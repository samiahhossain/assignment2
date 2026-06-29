/**
 * src/routes/auth.js
 *
 * Mounts authentication endpoints under /api/auth
 * Rate-limiting is applied per-route to reflect the different threat levels.
 */
const express     = require('express');
const rateLimit   = require('express-rate-limit');
const { registerValidation, loginValidation } = require('../validators/authValidators');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Stricter limiter for credential endpoints (5 req / min per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMITED',
    message: 'Too many attempts. Please wait one minute before trying again.',
  },
});

// POST /api/auth/register  —  SEC-1
router.post('/register', authLimiter, registerValidation, register);

// POST /api/auth/login  —  SEC-2
router.post('/login', authLimiter, loginValidation, login);

module.exports = router;
