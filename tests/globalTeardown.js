// Elimina la base de datos de pruebas y la carpeta temporal de subidas al terminar.
const fs = require('fs');
const os = require('os');
const path = require('path');
const mysql = require('mysql2/promise');

const TEST_DB = 'servicio_comunitario_test';

module.exports = async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
    await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await conn.end();

    fs.rmSync(path.join(os.tmpdir(), 'sc_test_uploads'), { recursive: true, force: true });
};
