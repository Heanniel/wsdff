// ============================================================================
//  Subida de archivos (fotos de referencia de pagos) — multer
//  Usa memoria: el archivo llega como buffer y luego lo persiste src/storage.js
//  (Supabase Storage en producción, o disco local en desarrollo).
// ============================================================================
const multer = require('multer');

// Middleware que procesa un único archivo del campo "referencia_foto".
const subirReferencia = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(null, true);
        cb(new Error('Solo se permiten imágenes (PNG, JPG, WEBP o GIF).'));
    }
}).single('referencia_foto');

module.exports = { subirReferencia };
