const express = require('express');
const path = require('path');
const { requireAuth, requirePage } = require('../middleware/auth');
const { UPLOAD_DIR } = require('../middleware/upload');

const router = express.Router();
const ROOT = path.join(__dirname, '..', '..'); // raíz del proyecto

// Páginas protegidas (deben ir ANTES de express.static)
router.get('/', (req, res) => res.sendFile(path.join(ROOT, 'login.html')));
router.get('/admin.html', requirePage('Administrador'), (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
router.get('/usuario.html', requirePage(), (req, res) => res.sendFile(path.join(ROOT, 'usuario.html')));

// Bloquea el acceso directo a archivos sensibles del servidor.
const archivosBloqueados = new Set([
    '.env', '.env.example', 'server.js', 'hash-passwords.js', 'run-migration.js',
    'package.json', 'package-lock.json', 'servicio_comunitario.sql', 'query', '.gitignore'
]);
router.use((req, res, next) => {
    const rel = decodeURIComponent(req.path).replace(/^\/+/, '').toLowerCase();
    if (archivosBloqueados.has(rel) || rel.endsWith('.sql') || rel.startsWith('node_modules') ||
        rel.startsWith('.git') || rel.startsWith('src/') || rel.startsWith('migrations/')) {
        return res.status(404).send('No encontrado');
    }
    next();
});

// Fotos de referencia de pagos: solo accesibles con sesión iniciada.
router.get('/uploads/referencias/:file', requireAuth, (req, res) => {
    const nombre = path.basename(req.params.file); // evita path traversal
    const ruta = path.join(UPLOAD_DIR, nombre);
    if (!ruta.startsWith(UPLOAD_DIR)) return res.status(400).send('Ruta no válida');
    res.sendFile(ruta, (err) => {
        if (err) res.status(404).send('Imagen no encontrada');
    });
});

// Archivos estáticos (css, js de cliente, vendor, imágenes) — públicos.
router.use(express.static(ROOT));

module.exports = router;
