
const express      = require('express');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { availabilityValidation, bookAppointmentValidation } = require('../validators/appointmentValidators');
const { getAvailability, bookAppointment } = require('../controllers/appointmentController');

const router = express.Router();

router.get(
  '/availability',
  authenticate,
  authorize('clinician', 'admin_assistant', 'patient'),
  availabilityValidation,
  getAvailability
);

router.post(
  '/',
  authenticate,
  authorize('patient', 'admin_assistant'),
  bookAppointmentValidation,
  bookAppointment
);

module.exports = router;
