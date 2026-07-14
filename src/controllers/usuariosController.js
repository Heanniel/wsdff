// ============================================================================
//  Controlador de usuarios (cuentas del sistema)
// ============================================================================
const bcrypt = require('bcryptjs');
const db = require('../db/pool');

// CAMBIAR CONTRASEÑA (solo la propia, salvo administrador)
async function cambiarPassword(req, res) {
    const { id_usuario, password_actual, password_nueva } = req.body;

    if (!id_usuario || !password_actual || !password_nueva) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    // Un usuario no admin solo puede cambiar su propia contraseña.
    if (req.session.user.id_rol !== 1 && req.session.user.id_usuario !== Number(id_usuario)) {
        return res.status(403).json({ error: 'No puedes cambiar la contraseña de otro usuario' });
    }
    if (password_nueva.length < 8 || !/\d/.test(password_nueva)) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres y al menos 1 número' });
    }

    try {
        const [results] = await db.query('SELECT password_hash FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        const stored = results[0].password_hash || '';
        const actualOk = stored.startsWith('$2')
            ? await bcrypt.compare(password_actual, stored)
            : password_actual === stored;

        if (!actualOk) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const hash = await bcrypt.hash(password_nueva, 10);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [hash, id_usuario]);
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (e) {
        console.error('Error al cambiar contraseña:', e);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
}

// CREAR USUARIO (solo administrador)
async function crear(req, res) {
    const { id_persona, id_rol, usuario_login, password } = req.body;

    if (!id_persona || !usuario_login || !password) {
        return res.status(400).json({ error: 'Persona, usuario y contraseña son requeridos' });
    }
    if (password.length < 8 || !/\d/.test(password)) {
        return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres y al menos 1 número' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const query = `INSERT INTO usuarios (id_persona, id_rol, usuario_login, password_hash) VALUES (?, ?, ?, ?)`;
        const id = await db.insertReturningId(query, [id_persona, id_rol || 2, usuario_login, hash], 'id_usuario');
        res.json({ message: 'Usuario creado exitosamente', id_usuario: id });
    } catch (err) {
        if (db.isDuplicateError(err)) {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }
        console.error('Error al crear usuario:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
}

module.exports = { cambiarPassword, crear };
