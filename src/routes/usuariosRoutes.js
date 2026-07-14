const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const usuarios = require('../controllers/usuariosController');

const router = express.Router();

router.put('/usuarios/cambiar-password', requireAuth, usuarios.cambiarPassword);
router.post('/usuarios', requireAuth, requireAdmin, usuarios.crear);

module.exports = router;
