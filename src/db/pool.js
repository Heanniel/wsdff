// ============================================================================
//  Selector de motor de base de datos.
//  Elige la implementación según DB_CLIENT. Si no se define pero SÍ existe
//  DATABASE_URL (típico de Supabase/Vercel), asume PostgreSQL automáticamente.
//  Así, aunque se olvide DB_CLIENT=postgres en producción, no intenta MySQL local.
//  Ambas implementaciones exponen la misma interfaz; los controllers no cambian.
// ============================================================================
const porDefecto = process.env.DATABASE_URL ? 'postgres' : 'mysql';
const client = (process.env.DB_CLIENT || porDefecto).toLowerCase();

module.exports = (client === 'postgres' || client === 'pg')
    ? require('./postgres')
    : require('./mysql');
