// services/appointment.service.js
const db = require("../config/db");
const patientProfileService = require("./patientProfile.service");

/**
 * Create a new appointment
 */
exports.createAppointment = async (data) => {
  // First, find or create patient profile
  const id_patient = await patientProfileService.findOrCreatePatientProfile(data);
  
  // Create appointment
  const sql = `
    INSERT INTO appointments (
      id_patient, dr_id, reason, appointment_date, time_slot, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    id_patient,
    data.dr_id,
    data.reason,
    data.appointment_date,
    data.time_slot,
    "pending"
  ];
  
  const [result] = await db.query(sql, values);
  return { success: true, insertedId: result.insertId, id_patient };
};

/**
 * Update appointment status
 */
exports.updateAppointmentStatus = async (id_appointment, status) => {
  const [result] = await db.query(
    "UPDATE appointments SET status = ? WHERE id_appointment = ?",
    [status, id_appointment]
  );
  return { success: true };
};

/**
 * Cancel/delete appointment
 */
exports.cancelAppointment = async (id_appointment) => {
  await db.query(
    "DELETE FROM appointments WHERE id_appointment = ?",
    [id_appointment]
  );
  return { success: true };
};

/**
 * Get paginated appointments with filters
 */
exports.getPaginatedAppointments = async (
  page = 1,
  limit = 10,
  status = null,
  appointment_date = null
) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT 
      a.*,
      p.p_name,
      p.gender,
      p.phone,
      p.email,
      p.dob,
      p.tinh,
      p.quan,
      p.xa,
      p.to_thon,
      d.dr_name,
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }

  if (appointment_date) {
    sql += " AND a.appointment_date = ?";
    params.push(appointment_date);
  }

  sql += " ORDER BY a.id_appointment DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  const [rows] = await db.query(sql, params);
  return rows;
};

/**
 * Get appointment by ID with full details
 */
exports.getAppointmentById = async (id_appointment) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name,
      p.gender,
      p.phone,
      p.email,
      p.dob,
      p.tinh,
      p.quan,
      p.xa,
      p.to_thon,
      p.id_u,
      d.dr_name,
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id,
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

/**
 * Get appointments by user ID
 */
exports.getAppointmentsByUserId = async (userId) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name,
      p.gender,
      p.phone,
      p.email,
      d.dr_name,
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    WHERE p.id_u = ?
    ORDER BY a.appointment_date DESC, a.time_slot
  `;
  const [result] = await db.query(sql, [userId]);
  return result;
};

/**
 * Get appointments by doctor's user ID
 */
exports.getAppointmentsByDoctorUserId = async (doctorUserId) => {
  const sql = `
    SELECT 
      a.*,
      p.p_name,
      p.gender,
      p.phone,
      p.email,
      p.id_u,
      u.name_u AS user_name,
      d.dr_name,
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN users u ON p.id_u = u.id_u
    WHERE d.id_u = ?
    ORDER BY a.appointment_date DESC, a.time_slot
  `;
  const [result] = await db.query(sql, [doctorUserId]);
  return result;
};

/**
 * Get booked time slots for a doctor on a specific date
 */
exports.getBookedSlots = async (dr_id, date) => {
  const sql = `
    SELECT time_slot 
    FROM appointments 
    WHERE dr_id = ? 
    AND appointment_date = ? 
    AND status IN ('pending', 'approved')
  `;
  const [results] = await db.query(sql, [dr_id, date]);
  return results.map((r) => r.time_slot);
};
