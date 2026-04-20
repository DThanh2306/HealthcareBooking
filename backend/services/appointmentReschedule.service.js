// services/appointmentReschedule.service.js
const db = require("../config/db");

/**
 * Propose a reschedule for an appointment
 */
exports.proposeReschedule = async (
  id_appointment,
  proposed_date,
  reason,
  requested_by
) => {
  const sql = `
    INSERT INTO appointment_reschedules (
      id_appointment, proposed_date,
      reschedule_reason, reschedule_status, requested_by
    ) VALUES (?, ?, ?, 'requested', ?)
  `;
  
  await db.query(sql, [
    id_appointment,
    proposed_date,
    reason || null,
    requested_by
  ]);
  
  return { success: true };
};

/**
 * Get active reschedule request for an appointment
 */
exports.getActiveReschedule = async (id_appointment) => {
  const sql = `
    SELECT * FROM appointment_reschedules
    WHERE id_appointment = ? AND reschedule_status = 'requested'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id_appointment]);
  return rows[0] || null;
};

/**
 * Accept a reschedule request
 * Updates the appointment with new date and assigns new queue number
 */
exports.acceptReschedule = async (id_appointment) => {
  const reschedule = await exports.getActiveReschedule(id_appointment);
  if (!reschedule) throw new Error("No active reschedule request found");

  const appointmentService = require("./appointment.service");
  const scheduleService    = require("./schedule.service");
  const appointment = await appointmentService.getAppointmentById(id_appointment);

  const newDate     = reschedule.proposed_date;
  const newTimeSlot = reschedule.proposed_time_slot || appointment.time_slot;

  // Kiểm tra slot mới còn chỗ không
  if (newTimeSlot) {
    const availability = await scheduleService.checkSlotAvailability(
      appointment.dr_id, newTimeSlot, newDate
    );
    if (!availability.available) {
      const err = new Error(availability.reason || 'Khung giờ đề xuất đã đầy');
      err.code = 'SLOT_FULL';
      err.statusCode = 409;
      throw err;
    }

    // Giảm slot cũ, tăng slot mới
    const oldSchedule = await scheduleService.getScheduleForSlot(
      appointment.dr_id, appointment.time_slot, appointment.appointment_date
    );
    if (oldSchedule?.max_slot !== null && oldSchedule?.max_slot !== undefined) {
      await scheduleService.decrementSlotUsage(
        appointment.dr_id, appointment.time_slot, appointment.appointment_date
      );
    }
    if (availability.max_slot !== null) {
      await scheduleService.incrementSlotUsage(appointment.dr_id, newTimeSlot, newDate);
    }
  }

  const newQueueNumber = await appointmentService.getNextQueueNumber(appointment.dr_id, newDate);

  await db.query(
    `UPDATE appointments
     SET appointment_date = ?, time_slot = ?, queue_number = ?
     WHERE id_appointment = ?`,
    [newDate, newTimeSlot || null, newQueueNumber, id_appointment]
  );

  await db.query(
    "UPDATE appointment_reschedules SET reschedule_status = 'accepted' WHERE id = ?",
    [reschedule.id]
  );

  return { success: true };
};

/**
 * Decline a reschedule request
 */
exports.declineReschedule = async (id_appointment) => {
  const reschedule = await exports.getActiveReschedule(id_appointment);
  
  if (!reschedule) {
    throw new Error("No active reschedule request found");
  }
  
  await db.query(
    "UPDATE appointment_reschedules SET reschedule_status = 'declined' WHERE id = ?",
    [reschedule.id]
  );
  
  return { success: true };
};

/**
 * Get all reschedule requests for an appointment
 */
exports.getRescheduleHistory = async (id_appointment) => {
  const sql = `
    SELECT * FROM appointment_reschedules
    WHERE id_appointment = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(sql, [id_appointment]);
  return rows;
};

/**
 * Cancel/delete a reschedule request
 */
exports.cancelReschedule = async (reschedule_id) => {
  await db.query(
    "DELETE FROM appointment_reschedules WHERE id = ?",
    [reschedule_id]
  );
  return { success: true };
};
