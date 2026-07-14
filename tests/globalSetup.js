// Crea la base de datos de pruebas desde el dump antes de correr los tests.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TEST_DB = 'servicio_comunitario_test';

module.exports = async () => {
    const dump = fs.readFileSync(path.join(__dirname, '..', 'servicio_comunitario.sql'), 'utf8');
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await conn.query(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    await conn.query(`USE \`${TEST_DB}\``);
    await conn.query(dump);
    await conn.end();
    console.log(`\n🧪 Base de datos de pruebas "${TEST_DB}" lista.`);
};
