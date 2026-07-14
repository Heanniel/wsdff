// ============================================================================
//  Almacenamiento de las fotos de referencia de pagos.
//  - Si hay credenciales de Supabase (SUPABASE_URL + SUPABASE_SERVICE_KEY):
//    guarda/borra/sirve desde un bucket de Supabase Storage (persistente).
//  - Si no: usa el disco local (desarrollo). En Vercel sin Supabase iría a /tmp
//    (efímero), por eso en producción conviene configurar Supabase.
//
//  En la BD se guarda siempre la ruta lógica "/uploads/referencias/<archivo>",
//  así el frontend no cambia. El bucket es privado: al servir la imagen se
//  genera una URL firmada de corta duración.
// ============================================================================
const path = require('path');
const fs = require('fs');
const os = require('os');

const usarSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || 'referencias';

let supabase = null;
if (usarSupabase) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false }
    });
}

// Carpeta local (solo cuando NO se usa Supabase).
const LOCAL_DIR = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : (process.env.VERCEL
        ? path.join(os.tmpdir(), 'uploads', 'referencias')
        : path.join(__dirname, '..', 'uploads', 'referencias'));

if (!usarSupabase) {
    try { fs.mkdirSync(LOCAL_DIR, { recursive: true }); } catch (e) { /* FS de solo lectura */ }
}

function nombreArchivo(originalname) {
    const ext = path.extname(originalname || '').toLowerCase();
    return `ref_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
}

// Guarda el archivo (objeto de multer con .buffer/.mimetype/.originalname).
// Devuelve la ruta lógica que se guarda en la BD.
async function guardar(file) {
    const archivo = nombreArchivo(file.originalname);
    if (usarSupabase) {
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(archivo, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw error;
    } else {
        fs.writeFileSync(path.join(LOCAL_DIR, archivo), file.buffer);
    }
    return `/uploads/referencias/${archivo}`;
}

// Borra una imagen (para no dejar huérfanos si la compra se rechaza).
async function borrar(rutaLogica) {
    if (!rutaLogica) return;
    const archivo = path.basename(rutaLogica);
    try {
        if (usarSupabase) await supabase.storage.from(BUCKET).remove([archivo]);
        else fs.unlinkSync(path.join(LOCAL_DIR, archivo));
    } catch (e) { /* si no existe, se ignora */ }
}

// Genera una URL firmada (60 s) para servir la imagen desde Supabase.
// Devuelve null cuando se usa disco local (se sirve desde el filesystem).
async function urlFirmada(rutaLogica) {
    if (!usarSupabase) return null;
    const archivo = path.basename(rutaLogica);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(archivo, 60);
    if (error) throw error;
    return data.signedUrl;
}

module.exports = { guardar, borrar, urlFirmada, usarSupabase, LOCAL_DIR };
