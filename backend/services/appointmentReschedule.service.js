// services/appointmentReschedule.service.js
const db = require("../config/db");

/**
 * Propose a reschedule for an appointment
 */
exports.proposeReschedule = async (
  id_appointment,
  proposed_date,
  proposed_time_slot,
  reason,
  requested_by
) => {
  const sql = `
    INSERT INTO appointment_reschedules (
      id_appointment, proposed_date, proposed_time_slot, 
      reschedule_reason, reschedule_status, requested_by
    ) VALUES (?, ?, ?, ?, 'requested', ?)
  `;
  
  await db.query(sql, [
    id_appointment,
    proposed_date,
    proposed_time_slot,
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
 * Updates the appointment with new date/time and marks reschedule as accepted
 */
exports.acceptReschedule = async (id_appointment) => {
  // Get the active reschedule request
  const reschedule = await exports.getActiveReschedule(id_appointment);
  
  if (!reschedule) {
    throw new Error("No active reschedule request found");
  }
  
  // Update appointment with new date/time
  await db.query(
    `UPDATE appointments 
     SET appointment_date = ?, time_slot = ?
     WHERE id_appointment = ?`,
    [reschedule.proposed_date, reschedule.proposed_time_slot, id_appointment]
  );
  
  // Mark reschedule as accepted
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
