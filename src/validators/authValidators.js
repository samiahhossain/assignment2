const { body } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),

  body('role')
    .isIn(['clinician', 'admin_assistant', 'patient'])
    .withMessage('Role must be one of: clinician, admin_assistant, patient.'),

  body('firstName')
    .trim().notEmpty().withMessage('First name is required.')
    .isLength({ max: 100 }).withMessage('First name may not exceed 100 characters.'),

  body('lastName')
    .trim().notEmpty().withMessage('Last name is required.')
    .isLength({ max: 100 }).withMessage('Last name may not exceed 100 characters.'),
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

module.exports = { registerValidation, loginValidation };
