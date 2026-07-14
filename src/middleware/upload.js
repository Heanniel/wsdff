// ============================================================================
//  Subida de archivos (fotos de referencia de pagos) — multer
// ============================================================================
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Carpeta de subidas en la raíz del proyecto (dos niveles arriba de src/middleware).
// Se puede sobrescribir con la variable UPLOAD_DIR (útil en los tests).
const UPLOAD_DIR = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '..', '..', 'uploads', 'referencias');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
