// ============================================================================
//  Ejecutor de migraciones SQL
//  Uso:  node run-migration.js migrations/001_fase2_limpieza_bd.sql
// ============================================================================
require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
    const archivo = process.argv[2];
    if (!archivo) {
        console.error('Uso: node run-migration.js <ruta-al-archivo.sql>');
        process.exit(1);
    }

    const sql = fs.readFileSync(archivo, 'utf8');
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'servicio_comunitario',
        multipleStatements: true
    });

    console.log(`▶ Ejecutando migración: ${archivo}\n`);
    try {
        await db.query(sql);
        console.log('✅ Migración aplicada correctamente.');
    } catch (err) {
        console.error('❌ Error al aplicar la migración:', err.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
})();
