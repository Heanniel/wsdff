// ============================================================================
//  Punto de entrada: carga la configuración, arranca el servidor y verifica la BD.
//  La app se construye en src/app.js (así se puede testear sin abrir un puerto).
// ============================================================================
require('dotenv').config();

const app = require('./src/app');
const db = require('./src/db/pool');

const PORT = process.env.PORT || 3000;

// Verificación de conexión a la BD al arrancar.
db.getConnection()
    .then(conn => { console.log('✅ Conectado a MySQL (pool)'); conn.release(); })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
        console.log('Verifica que XAMPP/MySQL esté corriendo y que la base de datos exista.');
    });

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
