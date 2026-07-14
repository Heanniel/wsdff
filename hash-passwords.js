// ============================================================================
//  Migración de contraseñas: texto plano  ->  hash bcrypt
//  Uso:  node hash-passwords.js
//  Es idempotente: las contraseñas que ya estén hasheadas se omiten.
// ============================================================================
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'servicio_comunitario'
    });

    console.log('🔐 Iniciando migración de contraseñas...\n');
    const [usuarios] = await db.execute('SELECT id_usuario, usuario_login, password_hash FROM usuarios');

    let migradas = 0;
    for (const u of usuarios) {
        const actual = u.password_hash || '';
        if (actual.startsWith('$2')) {
            console.log(`  •  ${u.usuario_login}: ya está hasheada, se omite.`);
            continue;
        }
        const hash = await bcrypt.hash(actual, 10);
        await db.execute('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [hash, u.id_usuario]);
        console.log(`  ✓  ${u.usuario_login}: contraseña hasheada.`);
        migradas++;
    }

    await db.end();
    console.log(`\n🎉 Migración completada. ${migradas} contraseña(s) actualizada(s).`);
    process.exit(0);
})().catch(err => {
    console.error('❌ Error en la migración:', err.message);
    process.exit(1);
});
