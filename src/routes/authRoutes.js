const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');

const router = express.Router();

// Limitador anti fuerza-bruta para el login (desactivado durante los tests).
const loginLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 10,                  // 10 intentos por IP
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.' }
    });

router.post('/login', loginLimiter, auth.login);
router.post('/logout', auth.logout);
router.get('/me', auth.me);

module.exports = router;
