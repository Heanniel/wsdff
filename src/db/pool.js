// ============================================================================
//  Selector de motor de base de datos.
//  Elige la implementación según DB_CLIENT ('mysql' por defecto, o 'postgres').
//  Ambas exponen la misma interfaz, así que los controllers no cambian.
// ============================================================================
const client = (process.env.DB_CLIENT || 'mysql').toLowerCase();

module.exports = (client === 'postgres' || client === 'pg')
    ? require('./postgres')
    : require('./mysql');
