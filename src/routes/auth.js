const express     = require('express');
const rateLimit   = require('express-rate-limit');
const { registerValidation, loginValidation } = require('../validators/authValidators');
const { register, login } = require('../controllers/authController');

const router = express.Router();

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

router.post('/register', authLimiter, registerValidation, register);

router.post('/login', authLimiter, loginValidation, login);

module.exports = router;
