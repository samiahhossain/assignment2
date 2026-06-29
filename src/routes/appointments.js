/**
 * src/routes/appointments.js
 *
 * Mounts appointment endpoints under /api/appointments
 * authenticate must run before authorize on every protected route.
 */
const express      = require('express');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { availabilityValidation, bookAppointmentValidation } = require('../validators/appointmentValidators');
const { getAvailability, bookAppointment } = require('../controllers/appointmentController');

const router = express.Router();

// GET /api/appointments/availability  —  B1
// All authenticated roles may query availability
router.get(
  '/availability',
  authenticate,
  authorize('clinician', 'admin_assistant', 'patient'),
  availabilityValidation,
  getAvailability
);

// POST /api/appointments  —  B2
// Patients book for themselves; admin assistants book on behalf of patients
router.post(
  '/',
  authenticate,
  authorize('patient', 'admin_assistant'),
  bookAppointmentValidation,
  bookAppointment
);

module.exports = router;
