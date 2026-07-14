const express = require('express');
const { requireAuth } = require('../middleware/auth');
const catalogos = require('../controllers/catalogosController');

const router = express.Router();

router.get('/roles', requireAuth, catalogos.obtenerRoles);
router.get('/estados-civiles', requireAuth, catalogos.obtenerEstadosCiviles);
router.get('/stats', requireAuth, catalogos.obtenerStats);

module.exports = router;
