/**
 * src/controllers/appointmentController.js
 *
 * HTTP layer for Endpoints B1 (availability) and B2 (book appointment).
 */
const { validationResult } = require('express-validator');
const appointmentService = require('../services/appointmentService');

// ─── GET /api/appointments/availability  (B1) ─────────────────────────────────
async function getAvailability(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'One or more query parameters failed validation.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { clinicianId, startDate, endDate, duration } = req.query;
    const result = await appointmentService.getAvailableSlots(
      clinicianId,
      startDate,
      endDate,
      duration ? parseInt(duration, 10) : 0
    );

    return res.status(200).json({
      status: 'success',
      clinicianId:    result.clinician.clinicianId,
      clinicianName:  result.clinician.clinicianName,
      slots:          result.slots,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', code: err.code, message: err.message });
    }
    console.error('[appointmentController.getAvailability]', err);
    return res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
  }
}

// ─── POST /api/appointments  (B2) ─────────────────────────────────────────────
async function bookAppointment(req, res) {
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
    const { patientId, clinicianId, slotId, appointmentType, notes } = req.body;
    const appointment = await appointmentService.bookAppointment({
      patientId,
      clinicianId,
      slotId,
      appointmentType,
      notes,
      bookingUserId:   req.user.userId,
      bookingUserRole: req.user.role,
    });

    return res.status(201).json({ status: 'success', data: appointment });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', code: err.code, message: err.message });
    }
    console.error('[appointmentController.bookAppointment]', err);
    return res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'An unexpected error occurred.' });
  }
}

module.exports = { getAvailability, bookAppointment };
