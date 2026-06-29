/**
 * src/services/appointmentService.js
 *
 * Database operations for Endpoints B1 (availability) and B2 (book appointment).
 * Both functions use parameterised queries exclusively — no string concatenation.
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ─── B1 — List available slots ────────────────────────────────────────────────

/**
 * Returns available (is_booked = 0) slots for a clinician within a date range.
 * Optionally filters by minimum slot duration in minutes.
 *
 * @param {string} clinicianId
 * @param {string} startDate   ISO 8601 date string
 * @param {string} endDate     ISO 8601 date string
 * @param {number} [duration]  Minimum slot length in minutes (default 0 = no filter)
 * @returns {Promise<{ clinician: object, slots: Array }>}
 */
async function getAvailableSlots(clinicianId, startDate, endDate, duration = 0) {
  // Verify the clinician exists and is active
  const clinicians = await db.query(
    `SELECT user_id, first_name, last_name
     FROM users
     WHERE user_id = ? AND role = 'clinician' AND is_active = 1`,
    [clinicianId]
  );

  if (clinicians.length === 0) {
    const err = new Error('No active clinician found with the provided clinicianId.');
    err.code   = 'CLINICIAN_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const clinician = clinicians[0];

  // Fetch unbooked slots in range; filter by duration using TIMESTAMPDIFF
  const slots = await db.query(
    `SELECT slot_id, slot_date, start_time, end_time
     FROM availability_slots
     WHERE clinician_id = ?
       AND slot_date BETWEEN ? AND ?
       AND is_booked = 0
       AND TIMESTAMPDIFF(MINUTE, start_time, end_time) >= ?
     ORDER BY slot_date, start_time`,
    [clinicianId, startDate, endDate, duration]
  );

  return {
    clinician: {
      clinicianId: clinician.user_id,
      clinicianName: `${clinician.first_name} ${clinician.last_name}`,
    },
    slots: slots.map((s) => ({
      slotId:    s.slot_id,
      date:      s.slot_date instanceof Date
                   ? s.slot_date.toISOString().split('T')[0]
                   : s.slot_date,
      startTime: s.start_time,
      endTime:   s.end_time,
    })),
  };
}

// ─── B2 — Book appointment ────────────────────────────────────────────────────

/**
 * Creates an appointment by:
 *   1. Opening a transaction
 *   2. Locking the slot row (SELECT … FOR UPDATE)
 *   3. Verifying the slot is still available
 *   4. Inserting the appointment row
 *   5. Marking the slot as booked
 *   6. Inserting reminder records (24h and 1h before)
 *   7. Committing
 *
 * Any failure rolls back the transaction so no partial data is written.
 *
 * @param {object} params
 * @returns {Promise<object>} The created appointment record
 */
async function bookAppointment({ patientId, clinicianId, slotId, appointmentType, notes, bookingUserId, bookingUserRole }) {
  // ── Pre-transaction checks (no lock needed yet) ───────────────────────────

  // Confirm patient exists and is active
  const patients = await db.query(
    'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = ? AND is_active = 1',
    [patientId]
  );
  if (patients.length === 0) {
    const err = new Error('No active patient found with the provided patientId.');
    err.code   = 'PATIENT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // If caller is a patient, they may only book for themselves
  if (bookingUserRole === 'patient') {
    const selfRows = await db.query(
      'SELECT patient_id FROM patients WHERE patient_id = ? AND user_id = ?',
      [patientId, bookingUserId]
    );
    if (selfRows.length === 0) {
      const err = new Error('Patients may only book appointments for themselves.');
      err.code   = 'ACCESS_DENIED';
      err.status = 403;
      throw err;
    }
  }

  // Confirm slot exists (we will re-check is_booked inside the transaction)
  const slotCheck = await db.query(
    'SELECT slot_id FROM availability_slots WHERE slot_id = ?',
    [slotId]
  );
  if (slotCheck.length === 0) {
    const err = new Error('No slot found with the provided slotId.');
    err.code   = 'SLOT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // ── Transactional booking ─────────────────────────────────────────────────
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Lock the slot row so concurrent requests queue here instead of racing
    const [slotRows] = await conn.execute(
      `SELECT slot_id, clinician_id, slot_date, start_time, end_time, is_booked
       FROM availability_slots
       WHERE slot_id = ?
       FOR UPDATE`,
      [slotId]
    );

    const slot = slotRows[0];

    // Re-check availability now that we hold the lock
    if (slot.is_booked) {
      await conn.rollback();
      const err = new Error('This time slot is no longer available. Please select another.');
      err.code   = 'SLOT_UNAVAILABLE';
      err.status = 409;
      throw err;
    }

    // Reject bookings for slots in the past
    const slotDateTime = new Date(`${slot.slot_date instanceof Date
      ? slot.slot_date.toISOString().split('T')[0]
      : slot.slot_date}T${slot.start_time}Z`);

    if (slotDateTime < new Date()) {
      await conn.rollback();
      const err = new Error('Cannot book an appointment in the past.');
      err.code   = 'PAST_SLOT';
      err.status = 422;
      throw err;
    }

    // Generate IDs
    const appointmentId = `APT-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Insert appointment
    await conn.execute(
      `INSERT INTO appointments
         (appointment_id, patient_id, clinician_id, slot_id, appointment_type, status, notes)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`,
      [appointmentId, patientId, clinicianId, slotId, appointmentType, notes || null]
    );

    // Mark slot as booked
    await conn.execute(
      'UPDATE availability_slots SET is_booked = 1, appointment_id = ? WHERE slot_id = ?',
      [appointmentId, slotId]
    );

    // Schedule reminders (24h and 1h before)
    const reminders = [];
    for (const offset of [{ type: '24h', ms: 24 * 60 * 60 * 1000 }, { type: '1h', ms: 60 * 60 * 1000 }]) {
      const reminderId  = `REM-${uuidv4().slice(0, 8).toUpperCase()}`;
      const scheduledAt = new Date(slotDateTime.getTime() - offset.ms);
      await conn.execute(
        'INSERT INTO appointment_reminders (reminder_id, appointment_id, reminder_type, scheduled_at) VALUES (?, ?, ?, ?)',
        [reminderId, appointmentId, offset.type, scheduledAt]
      );
      reminders.push({ type: offset.type, scheduledAt: scheduledAt.toISOString() });
    }

    await conn.commit();

    // ── Build response payload ──────────────────────────────────────────────
    const slotDateStr = slot.slot_date instanceof Date
      ? slot.slot_date.toISOString().split('T')[0]
      : slot.slot_date;

    const clinicianRows = await db.query(
      'SELECT first_name, last_name FROM users WHERE user_id = ?',
      [slot.clinician_id]
    );
    const clinicianName = clinicianRows.length > 0
      ? `${clinicianRows[0].first_name} ${clinicianRows[0].last_name}`
      : 'Unknown';

    return {
      appointmentId,
      patientId,
      clinicianId: slot.clinician_id,
      clinicianName,
      date:            slotDateStr,
      startTime:       slot.start_time,
      endTime:         slot.end_time,
      appointmentType,
      status:          'confirmed',
      reminders,
      createdAt:       new Date().toISOString(),
    };

  } catch (err) {
    // Only roll back if the connection is still in a transaction
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAvailableSlots, bookAppointment };
