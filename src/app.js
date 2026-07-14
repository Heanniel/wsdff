// ============================================================================
//  Construcción de la aplicación Express (sin arrancar el servidor).
//  Se exporta para poder probarla con supertest sin abrir un puerto.
// ============================================================================
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const helmet = require('helmet');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const personasRoutes = require('./routes/personasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const bombonasRoutes = require('./routes/bombonasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:${PORT}`;

// --- Middleware base y de seguridad ---
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Confía en el proxy (Vercel) para que las cookies "secure" funcionen tras HTTPS.
app.set('trust proxy', 1);

// Sesión guardada en una cookie firmada (sin estado): funciona en serverless,
// donde no hay memoria compartida entre invocaciones. Los datos de sesión son
// pequeños (usuario sin contraseña), así que caben de sobra en la cookie.
app.use(cookieSession({
    name: 'sc_session',
    keys: [process.env.SESSION_SECRET || 'cambia-esto'],
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción (Vercel)
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
}));

// Log de peticiones (nunca registra contraseñas). Silenciado durante los tests.
app.use((req, res, next) => {
    if (req.method !== 'GET' && process.env.NODE_ENV !== 'test') {
        const safeBody = { ...req.body };
        ['password', 'password_actual', 'password_nueva', 'password_hash'].forEach(k => {
            if (k in safeBody) safeBody[k] = '***';
        });
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, safeBody);
    }
    next();
});

// --- Rutas ---
app.use('/', pageRoutes);      // páginas, estáticos, subidas y bloqueo de archivos
app.use('/', authRoutes);      // /login, /logout, /me
app.use('/', personasRoutes);  // /personas...
app.use('/', usuariosRoutes);  // /usuarios...
app.use('/', catalogosRoutes); // /roles, /estados-civiles, /stats
app.use('/', bombonasRoutes);  // /bombonas..., /api/usuario/ventas-calle

module.exports = app;
