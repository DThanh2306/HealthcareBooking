// services/appointment.service.js
const db = require("../config/db");
const patientProfileService = require("./patientProfile.service");

/**
 * Create a new appointment (queue_number is assigned when approved, not at creation)
 */
exports.createAppointment = async (data) => {
  // First, find or create patient profile
  const id_patient = await patientProfileService.findOrCreatePatientProfile(data);
  
  // Create appointment WITHOUT queue_number (will be assigned when approved)
  const sql = `
    INSERT INTO appointments (
      id_patient, dr_id, reason, appointment_date, status
    ) VALUES (?, ?, ?, ?, ?)
  `;
  
  const values = [
    id_patient,
    data.dr_id,
    data.reason,
    data.appointment_date,
    "pending"
  ];
  
  const [result] = await db.query(sql, values);
  return { success: true, insertedId: result.insertId, id_patient };
};

/**
 * Update appointment status
 * If status is 'approved', assign queue_number at this time
 */
exports.updateAppointmentStatus = async (id_appointment, status) => {
  if (status === 'approved') {
    // Get appointment details to know dr_id and appointment_date
    const [appts] = await db.query(
      "SELECT dr_id, appointment_date FROM appointments WHERE id_appointment = ?",
      [id_appointment]
    );
    
    if (appts.length === 0) {
      throw new Error("Appointment not found");
    }
    
    const appointment = appts[0];
    // Assign queue_number when approving
    const queueNumber = await exports.getNextQueueNumber(appointment.dr_id, appointment.appointment_date);
    
    // Update status and queue_number
    await db.query(
      "UPDATE appointments SET status = ?, queue_number = ? WHERE id_appointment = ?",
      [status, queueNumber, id_appointment]
    );
  } else {
    // For other statuses, just update status (no queue_number)
    await db.query(
      "UPDATE appointments SET status = ? WHERE id_appointment = ?",
      [status, id_appointment]
    );
  }
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
      d.sp_id,
      r.reschedule_status,
      r.reschedule_reason,
      r.proposed_date AS proposed_appointment_date,
      r.requested_by AS reschedule_requested_by
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN appointment_reschedules r ON r.id_appointment = a.id_appointment AND r.reschedule_status = 'requested'
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
      p.to_thon,
      p.xa,
      p.quan,
      p.tinh,
      d.dr_name,
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    WHERE p.id_u = ?
    ORDER BY a.appointment_date DESC, COALESCE(a.queue_number, 999999)
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
      d.sp_id,
      r.reschedule_status,
      r.reschedule_reason,
      r.proposed_date AS proposed_appointment_date,
      r.requested_by AS reschedule_requested_by
    FROM appointments a
    JOIN patient_profiles p ON a.id_patient = p.id_patient
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    LEFT JOIN users u ON p.id_u = u.id_u
    LEFT JOIN appointment_reschedules r ON r.id_appointment = a.id_appointment AND r.reschedule_status = 'requested'
    WHERE d.id_u = ?
    ORDER BY a.appointment_date DESC, COALESCE(a.queue_number, 999999)
  `;
  const [result] = await db.query(sql, [doctorUserId]);
  return result;
};

/**
 * Get booked queue numbers for a doctor on a specific date
 * Only returns queue numbers from approved appointments (not pending)
 */
exports.getBookedSlots = async (dr_id, date) => {
  const sql = `
    SELECT queue_number
    FROM appointments
    WHERE dr_id = ?
    AND appointment_date = ?
    AND status IN ('approved', 'in_progress', 'done')
    AND queue_number IS NOT NULL
  `;
  const [results] = await db.query(sql, [dr_id, date]);
  return results.map((r) => r.queue_number);
};

/**
 * Get next available queue number for a doctor on a specific date
 */
exports.getNextQueueNumber = async (dr_id, date) => {
  // First, try to get current number from doctor_queue
  let sql = `SELECT current_number FROM doctor_queue WHERE dr_id = ? AND queue_date = ?`;
  let [rows] = await db.query(sql, [dr_id, date]);
  
  let currentNumber = 0;
  if (rows.length > 0) {
    currentNumber = rows[0].current_number;
  } else {
    // Create new entry if not exists
    sql = `INSERT INTO doctor_queue (dr_id, queue_date, current_number) VALUES (?, ?, 0)`;
    await db.query(sql, [dr_id, date]);
  }
  
  // Increment the current number
  currentNumber += 1;
  
  // Update the doctor_queue
  sql = `UPDATE doctor_queue SET current_number = ? WHERE dr_id = ? AND queue_date = ?`;
  await db.query(sql, [currentNumber, dr_id, date]);
  
  return currentNumber;
};
