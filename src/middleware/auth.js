// ============================================================================
//  Middleware de autenticación y autorización
// ============================================================================

// Exige sesión iniciada para las rutas de API.
function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ error: 'No autenticado. Inicia sesión.' });
}

// Exige rol de administrador (id_rol === 1).
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.id_rol === 1) return next();
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador.' });
}

// Protege las páginas HTML: redirige al login si no hay sesión válida.
function requirePage(rolNombre) {
    return (req, res, next) => {
        const u = req.session && req.session.user;
        if (!u) return res.redirect('/login.html');
        if (rolNombre && u.nombre_rol !== rolNombre) return res.redirect('/login.html');
        next();
    };
}

module.exports = { requireAuth, requireAdmin, requirePage };
