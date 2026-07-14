// ============================================================================
//  Punto de entrada serverless para Vercel.
//  Vercel invoca funciones (no procesos con app.listen), así que aquí solo
//  exportamos la app Express construida en src/app.js. Las variables de entorno
//  (DB_CLIENT, DATABASE_URL, SESSION_SECRET, etc.) se configuran en el panel de Vercel.
// ============================================================================
module.exports = require('../src/app');
