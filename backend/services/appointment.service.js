// services/appointment.service.js
const db = require("../config/db");
const patientProfileService = require("./patientProfile.service");

/**
 * Create a new appointment
 * Kiểm tra max_slot trước, tăng current_slot sau khi insert thành công
 */
exports.createAppointment = async (data) => {
  const scheduleService = require("./schedule.service");

  if (data.time_slot && data.appointment_date) {
    const availability = await scheduleService.checkSlotAvailability(
      data.dr_id,
      data.time_slot,
      data.appointment_date
    );
    if (!availability.available) {
      const err = new Error(availability.reason || 'Khung giờ đã đầy');
      err.code = 'SLOT_FULL';
      err.statusCode = 409;
      throw err;
    }
  }

  const id_patient = await patientProfileService.findOrCreatePatientProfile(data);

  const [result] = await db.query(
    `INSERT INTO appointments
       (id_patient, dr_id, reason, appointment_date, time_slot, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_patient, data.dr_id, data.reason, data.appointment_date, data.time_slot || null, "pending"]
  );

  // Tăng slot sau khi insert thành công
  if (data.time_slot && data.appointment_date) {
    await scheduleService.incrementSlotUsage(data.dr_id, data.time_slot, data.appointment_date);
  }

  return { success: true, insertedId: result.insertId, id_patient };
};

exports.updateAppointmentStatus = async (id_appointment, status) => {
  if (status === 'approved') {
    const [appts] = await db.query(
      "SELECT dr_id, appointment_date FROM appointments WHERE id_appointment = ?",
      [id_appointment]
    );
    if (appts.length === 0) throw new Error("Appointment not found");

    const { dr_id, appointment_date } = appts[0];
    const queueNumber = await exports.getNextQueueNumber(dr_id, appointment_date);

    await db.query(
      "UPDATE appointments SET status = ?, queue_number = ? WHERE id_appointment = ?",
      [status, queueNumber, id_appointment]
    );
  } else {
    await db.query(
      "UPDATE appointments SET status = ? WHERE id_appointment = ?",
      [status, id_appointment]
    );

    // Giảm slot khi từ chối
    if (status === 'rejected') {
      await exports._decrementSlotForAppointment(id_appointment);
    }
  }
  return { success: true };
};

exports.cancelAppointment = async (id_appointment) => {
  await exports._decrementSlotForAppointment(id_appointment);
  await db.query("DELETE FROM appointments WHERE id_appointment = ?", [id_appointment]);
  return { success: true };
};

/**
 * Giảm slot usage khi hủy hoặc từ chối appointment
 */
exports._decrementSlotForAppointment = async (id_appointment) => {
  const scheduleService = require("./schedule.service");

  const [rows] = await db.query(
    "SELECT dr_id, appointment_date, time_slot FROM appointments WHERE id_appointment = ?",
    [id_appointment]
  );
  if (!rows.length || !rows[0].time_slot) return;

  const { dr_id, appointment_date, time_slot } = rows[0];

  // Chỉ giảm nếu schedule có max_slot (có giới hạn)
  const schedule = await scheduleService.getScheduleForSlot(dr_id, time_slot, appointment_date);
  if (schedule?.max_slot !== null && schedule?.max_slot !== undefined) {
    await scheduleService.decrementSlotUsage(dr_id, time_slot, appointment_date);
  }
};
// ── Các hàm còn lại giữ nguyên ──────────────────────────────────────────────

exports.getPaginatedAppointments = async (
  page = 1, limit = 10, status = null, appointment_date = null
) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT 
      a.*,
      p.p_name, p.gender, p.phone, p.email, p.dob,
      p.tinh, p.quan, p.xa, p.to_thon,
      d.dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id,
      r.reschedule_status, r.reschedule_reason,
      r.proposed_date AS proposed_appointment_date,
      r.requested_by AS reschedule_requested_by
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN appointment_reschedules r 
      ON r.id_appointment = a.id_appointment AND r.reschedule_status = 'requested'
    WHERE 1=1
  `;
  const params = [];

  if (status) { sql += " AND a.status = ?"; params.push(status); }
  if (appointment_date) { sql += " AND a.appointment_date = ?"; params.push(appointment_date); }

  sql += " ORDER BY a.id_appointment DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  const [rows] = await db.query(sql, params);
  return rows;
};

exports.getAppointmentById = async (id_appointment) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name, p.gender, p.phone, p.email, p.dob,
      p.tinh, p.quan, p.xa, p.to_thon, p.id_u,
      d.dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id,
      u.email_u AS doctor_email
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN users u ON d.id_u = u.id_u
    WHERE a.id_appointment = ?
  `;
  const [rows] = await db.query(sql, [id_appointment]);
  return rows[0] || null;
};

exports.getAppointmentsByUserId = async (userId) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name, p.gender, p.phone, p.email,
      p.to_thon, p.xa, p.quan, p.tinh,
      d.dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id,
      r.reschedule_status, r.reschedule_reason,
      r.proposed_date AS proposed_appointment_date,
      r.requested_by AS reschedule_requested_by
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN appointment_reschedules r 
      ON r.id_appointment = a.id_appointment AND r.reschedule_status = 'requested'
    WHERE p.id_u = ?
    ORDER BY a.appointment_date DESC, COALESCE(a.queue_number, 999999)
  `;
  const [result] = await db.query(sql, [userId]);
  return result;
};

exports.getAppointmentsByDoctorUserId = async (doctorUserId) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name, p.gender, p.phone, p.email, p.id_u,
      u.name_u AS user_name,
      d.dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id,
      r.reschedule_status, r.reschedule_reason,
      r.proposed_date AS proposed_appointment_date,
      r.requested_by AS reschedule_requested_by
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN users u ON p.id_u = u.id_u
    LEFT JOIN appointment_reschedules r 
      ON r.id_appointment = a.id_appointment AND r.reschedule_status = 'requested'
    WHERE d.id_u = ?
    ORDER BY a.appointment_date DESC, COALESCE(a.queue_number, 999999)
  `;
  const [result] = await db.query(sql, [doctorUserId]);
  return result;
};

exports.getBookedSlots = async (dr_id, date) => {
  const sql = `
    SELECT queue_number FROM appointments
    WHERE dr_id = ? AND appointment_date = ?
    AND status IN ('approved', 'in_progress', 'done')
    AND queue_number IS NOT NULL
  `;
  const [results] = await db.query(sql, [dr_id, date]);
  return results.map((r) => r.queue_number);
};

exports.getNextQueueNumber = async (dr_id, date) => {
  let sql = `SELECT current_number FROM doctor_queue WHERE dr_id = ? AND queue_date = ?`;
  let [rows] = await db.query(sql, [dr_id, date]);

  let currentNumber = 0;
  if (rows.length > 0) {
    currentNumber = rows[0].current_number;
  } else {
    sql = `INSERT INTO doctor_queue (dr_id, queue_date, current_number) VALUES (?, ?, 0)`;
    await db.query(sql, [dr_id, date]);
  }

  currentNumber += 1;
  sql = `UPDATE doctor_queue SET current_number = ? WHERE dr_id = ? AND queue_date = ?`;
  await db.query(sql, [currentNumber, dr_id, date]);

  return currentNumber;
};