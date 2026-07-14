// ============================================================================
//  Implementación de la capa de datos para MySQL / MariaDB (driver mysql2).
//  Expone una interfaz común (ver también postgres.js) que usan los controllers.
// ============================================================================
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'servicio_comunitario',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Normaliza el resultado de mysql2 a la forma [filas, meta].
function normalizar(result) {
    if (Array.isArray(result)) return [result, {}];
    return [[], { insertId: result.insertId, affectedRows: result.affectedRows }];
}

module.exports = {
    // SELECT/UPDATE/DELETE: devuelve [filas, meta]
    query: async (sql, params) => {
        const [result] = await pool.query(sql, params);
        return normalizar(result);
    },

    // INSERT que necesita el id generado (col se ignora en MySQL: usa insertId).
    insertReturningId: async (sql, params /*, col */) => {
        const [result] = await pool.query(sql, params);
        return result.insertId;
    },

    // Conexión dedicada para transacciones.
    getConnection: async () => {
        const conn = await pool.getConnection();
        return {
            query: async (sql, params) => {
                const [result] = await conn.query(sql, params);
                return normalizar(result);
            },
            beginTransaction: () => conn.beginTransaction(),
            commit: () => conn.commit(),
            rollback: () => conn.rollback(),
            release: () => conn.release()
        };
    },

    // Helpers de dialecto
    isDuplicateError: (err) => !!err && err.code === 'ER_DUP_ENTRY',
    dateDaysAgo: (n) => `DATE_SUB(NOW(), INTERVAL ${parseInt(n, 10)} DAY)`,
    orderByCalle: (col) =>
        `FIELD(${col}, 'Calle 1', 'Calle 2', 'Calle 3', 'Calle 4', 'Calle 5', 'Calle 6', 'Calle 7', 'Callejón', NULL)`,

    end: () => pool.end()
};
