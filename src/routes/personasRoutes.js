const express = require('express');
const { requireAuth } = require('../middleware/auth');
const personas = require('../controllers/personasController');

const router = express.Router();

router.get('/personas', requireAuth, personas.obtenerTodas);
router.get('/personas/sin-bombonas', requireAuth, personas.obtenerSinBombonas);
router.post('/personas', requireAuth, personas.crear);
router.put('/personas/:id_persona', requireAuth, personas.actualizar);

module.exports = router;
