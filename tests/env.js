// Variables de entorno para el entorno de pruebas.
// Se ejecuta ANTES de importar la app, así el pool apunta a la BD de test.
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = 'servicio_comunitario_test';
process.env.SESSION_SECRET = 'test-secret';
process.env.CORS_ORIGIN = 'http://localhost:3000';
// Las fotos subidas durante los tests van a una carpeta temporal descartable.
process.env.UPLOAD_DIR = require('path').join(require('os').tmpdir(), 'sc_test_uploads');
