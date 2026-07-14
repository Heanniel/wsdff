// ============================================================================
//  Controlador de autenticación
// ============================================================================
const bcrypt = require('bcryptjs');
const db = require('../db/pool');

// LOGIN - Acepta usuario o cédula
async function login(req, res) {
    const { usuario, password, role } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar por usuario_login O por cédula (incluye el hash para verificarlo en código)
    const query = `
        SELECT u.id_usuario, u.usuario_login, u.id_rol, u.password_hash, r.nombre_rol,
               p.id_persona, p.cedula, p.nombre, p.apellido, p.edad, p.celular, p.calle
        FROM usuarios u
        LEFT JOIN personas p ON u.id_persona = p.id_persona
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.usuario_login = ? OR p.cedula = ?
    `;

    try {
        const [results] = await db.query(query, [usuario, usuario]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario/cédula o contraseña incorrectos' });
        }

        const user = results[0];
        const stored = user.password_hash || '';

        // Verificación de contraseña (con migración perezosa de texto plano a hash).
        let passwordOk = false;
        if (stored.startsWith('$2')) {
            passwordOk = await bcrypt.compare(password, stored);
        } else if (password === stored) {
            passwordOk = true;
            const hash = await bcrypt.hash(password, 10);
            await db.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [hash, user.id_usuario]);
        }

        if (!passwordOk) {
            return res.status(401).json({ error: 'Usuario/cédula o contraseña incorrectos' });
        }

        // Validar que el rol seleccionado coincida con el rol real del usuario.
        if (role === 'admin' && user.nombre_rol !== 'Administrador') {
            return res.status(403).json({ error: 'Acceso denegado: Las credenciales no corresponden a un administrador' });
        }
        if (role === 'user' && user.nombre_rol === 'Administrador') {
            return res.status(403).json({ error: 'Acceso denegado: Las credenciales de administrador no pueden usarse en el rol de secretario' });
        }

        // Guardar en la sesión SOLO datos no sensibles (nunca el hash).
        const sessionUser = {
            id_usuario: user.id_usuario,
            id_persona: user.id_persona,
            id_rol: user.id_rol,
            nombre_rol: user.nombre_rol,
            usuario_login: user.usuario_login,
            cedula: user.cedula,
            nombre: user.nombre,
            apellido: user.apellido,
            edad: user.edad,
            celular: user.celular,
            calle: user.calle
        };
        req.session.user = sessionUser;
        res.json({ message: 'Login exitoso', usuario: sessionUser });
    } catch (e) {
        console.error('Error en login:', e);
        res.status(500).json({ error: 'Error al verificar credenciales' });
    }
}

// LOGOUT - Destruye la sesión del servidor
function logout(req, res) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada' });
    });
}

// ME - Devuelve el usuario de la sesión actual
function me(req, res) {
    if (req.session && req.session.user) return res.json({ usuario: req.session.user });
    return res.status(401).json({ error: 'No autenticado' });
}

module.exports = { login, logout, me };
