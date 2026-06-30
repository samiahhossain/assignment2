const { query, body } = require('express-validator');

const availabilityValidation = [
  query('clinicianId')
    .notEmpty().withMessage('clinicianId is required.'),

  query('startDate')
    .notEmpty().withMessage('startDate is required.')
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date (YYYY-MM-DD).'),

  query('endDate')
    .notEmpty().withMessage('endDate is required.')
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date (YYYY-MM-DD).')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < req.query.startDate) {
        throw new Error('endDate must not be earlier than startDate.');
      }
      const start = new Date(req.query.startDate);
      const end   = new Date(endDate);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      if (diffDays > 31) {
        throw new Error('Date range may not exceed 31 days.');
      }
      return true;
    }),

  query('duration')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('duration must be an integer between 5 and 120 minutes.'),
];

const bookAppointmentValidation = [
  body('patientId')
    .notEmpty().withMessage('patientId is required.'),

  body('clinicianId')
    .notEmpty().withMessage('clinicianId is required.'),

  body('slotId')
    .notEmpty().withMessage('slotId is required.'),

  body('appointmentType')
    .notEmpty().withMessage('appointmentType is required.')
    .isIn(['in-person', 'virtual'])
    .withMessage('appointmentType must be either "in-person" or "virtual".'),

  body('notes')
    .optional()
    .isString()
    .isLength({ max: 2000 }).withMessage('notes may not exceed 2000 characters.')
    .trim(),
];

module.exports = { availabilityValidation, bookAppointmentValidation };
