// ============================================================================
//  Controlador de catálogos y estadísticas generales
// ============================================================================
const db = require('../db/pool');

// OBTENER ROLES
async function obtenerRoles(req, res) {
    try {
        const [results] = await db.query('SELECT * FROM roles');
        res.json({ roles: results });
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener roles' });
    }
}

// OBTENER ESTADOS CIVILES
async function obtenerEstadosCiviles(req, res) {
    try {
        const [results] = await db.query('SELECT * FROM estados_civiles');
        res.json({ estados_civiles: results });
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener estados civiles' });
    }
}

// OBTENER ESTADÍSTICAS DEL DASHBOARD
async function obtenerStats(req, res) {
    try {
        const [[personas]] = await db.query('SELECT COUNT(*) as count FROM personas');
        const [[admins]] = await db.query('SELECT COUNT(*) as count FROM usuarios WHERE id_rol = 1');
        const [[secretarios]] = await db.query('SELECT COUNT(*) as count FROM usuarios WHERE id_rol = 2');
        res.json({
            total_personas: personas.count,
            total_admins: admins.count,
            total_secretarios: secretarios.count
        });
    } catch (e) {
        console.error('Error al obtener estadísticas:', e);
        res.json({ total_personas: 0, total_admins: 0, total_secretarios: 0 });
    }
}

module.exports = { obtenerRoles, obtenerEstadosCiviles, obtenerStats };
