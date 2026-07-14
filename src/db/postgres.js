// ============================================================================
//  Implementación de la capa de datos para PostgreSQL (driver pg).
//  Expone la MISMA interfaz que mysql.js, para que los controllers no cambien.
// ============================================================================
const { Pool, types } = require('pg');

// Devolver bigint (COUNT, SUM de enteros) como número, igual que MySQL.
// (por defecto pg devuelve int8 como string). numeric(10,2) se deja como
// string, que es también el comportamiento de mysql2 para DECIMAL.
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

// Supabase (y la mayoría de Postgres gestionados) exigen SSL.
// Opción A (recomendada en Vercel/Supabase): definir DATABASE_URL con la cadena
//   de conexión del "Connection Pooler" de Supabase (puerto 6543).
// Opción B: definir DB_HOST/DB_USER/DB_PASSWORD/DB_PORT sueltos + DB_SSL=true.
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10
        }
        : {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'servicio_comunitario',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
            max: 10
        }
);

// Convierte los marcadores "?" de MySQL a "$1, $2, ..." de PostgreSQL.
function convertir(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => '$' + (++i));
}

module.exports = {
    query: async (sql, params = []) => {
        const res = await pool.query(convertir(sql), params);
        return [res.rows, { affectedRows: res.rowCount }];
    },

    // INSERT con RETURNING para obtener el id generado.
    insertReturningId: async (sql, params, col) => {
        const res = await pool.query(convertir(sql) + ` RETURNING ${col}`, params);
        return res.rows[0][col];
    },

    getConnection: async () => {
        const client = await pool.connect();
        return {
            query: async (sql, params = []) => {
                const res = await client.query(convertir(sql), params);
                return [res.rows, { affectedRows: res.rowCount }];
            },
            beginTransaction: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK'),
            release: () => client.release()
        };
    },

    // Helpers de dialecto
    isDuplicateError: (err) => !!err && err.code === '23505', // unique_violation
    dateDaysAgo: (n) => `(NOW() - INTERVAL '${parseInt(n, 10)} days')`,
    orderByCalle: (col) =>
        `array_position(ARRAY['Calle 1','Calle 2','Calle 3','Calle 4','Calle 5','Calle 6','Calle 7','Callejón']::text[], ${col}::text)`,

    end: () => pool.end()
};
