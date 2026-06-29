/**
 * src/controllers/authController.js
 *
 * Handles HTTP layer for SEC-1 (register) and SEC-2 (login).
 * Reads validation errors, delegates to authService, and formats responses.
 */
const { validationResult } = require('express-validator');
const authService = require('../services/authService');

// ─── POST /api/auth/register  (SEC-1) ─────────────────────────────────────────
async function register(req, res) {
  // Return all field-level validation errors at once
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'One or more fields failed validation.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { email, password, role, firstName, lastName } = req.body;
    const user = await authService.registerUser({ email, password, role, firstName, lastName });

    return res.status(201).json({
      status: 'success',
      data: {
        userId:    user.userId,
        email:     user.email,
        role:      user.role,
        firstName: user.firstName,
        lastName:  user.lastName,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', code: err.code, message: err.message });
    }
    console.error('[authController.register]', err);
    return res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
  }
}

// ─── POST /api/auth/login  (SEC-2) ────────────────────────────────────────────
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'One or more fields failed validation.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', code: err.code, message: err.message });
    }
    console.error('[authController.login]', err);
    return res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
  }
}

module.exports = { register, login };
