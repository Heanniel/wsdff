const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { subirReferencia } = require('../middleware/upload');
const bombonas = require('../controllers/bombonasController');

const router = express.Router();

// Envuelve multer para devolver los errores de subida como JSON.
function subirFoto(req, res, next) {
    subirReferencia(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Error al subir la imagen' });
        next();
    });
}

router.get('/bombonas/totales', requireAuth, bombonas.obtenerTotales);
router.post('/bombonas/registrar', requireAuth, bombonas.registrar);
router.get('/bombonas/registros/detallado', requireAuth, bombonas.obtenerDetallado);
router.put('/bombonas/actualizar', requireAuth, bombonas.actualizar);
router.delete('/bombonas/eliminar/:id', requireAuth, bombonas.eliminar);
router.post('/bombonas/comprar', requireAuth, subirFoto, bombonas.comprar);
router.get('/bombonas/historial-ventas', requireAuth, bombonas.obtenerHistorial);
router.get('/bombonas/estadisticas-calles', requireAuth, bombonas.obtenerEstadisticasCalles);
router.get('/bombonas/estadisticas-ventas-calles', requireAuth, bombonas.obtenerEstadisticasVentasCalles);
router.get('/api/usuario/ventas-calle', requireAuth, bombonas.obtenerVentasCalleUsuario);

module.exports = router;
