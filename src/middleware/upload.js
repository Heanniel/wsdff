// ============================================================================
//  Subida de archivos (fotos de referencia de pagos) — multer
// ============================================================================
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

// En local, la carpeta va en la raíz del proyecto. En Vercel/serverless el
// proyecto es de solo lectura y solo /tmp es escribible. Se puede sobrescribir
// con la variable UPLOAD_DIR (útil en los tests).
const dirPorDefecto = process.env.VERCEL
    ? path.join(os.tmpdir(), 'uploads', 'referencias')
    : path.join(__dirname, '..', '..', 'uploads', 'referencias');
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : dirPorDefecto;

try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
    console.warn('No se pudo crear la carpeta de subidas (¿filesystem de solo lectura?):', e.message);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const nombre = `ref_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, nombre);
    }
});

// Middleware que procesa un único archivo de campo "referencia_foto".
const subirReferencia = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(null, true);
        cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP o GIF).'));
    }
}).single('referencia_foto');

module.exports = { subirReferencia, UPLOAD_DIR };
