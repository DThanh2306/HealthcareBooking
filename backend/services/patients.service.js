// services/patients.service.js
const db = require("../config/db");

exports.createPatient = async (data) => {
  const sql = `
  INSERT INTO patients (
    id_u, dr_id, p_name, gender, phone, email, dob, tinh, quan, xa, to_thon, reason, appointment_date, time_slot, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

  const values = [
    data.id_u,
    data.dr_id,
    (data.name || data.p_name),
    data.gender,
    data.phone,
    data.email,
    data.dob,
    data.tinh,
    data.quan,
    data.xa,
    data.to,
    data.reason,
    data.appointment_date,
    data.time_slot,
    "pending",
  ];

  const [result] = await db.query(sql, values);
  return { success: true, insertedId: result.insertId };
};

exports.updateStatus = async (id_appointment, status) => {
  const [result] = await db.query(
    "UPDATE patients SET status = ? WHERE id_appointment = ?",
    [status, id_appointment]
  );
  return { success: true };
};

exports.cancelAppointment = async (id_appointment) => {
  await db.query(
    "DELETE FROM patients WHERE id_appointment = ?",
    [id_appointment]
  );
  return { success: true };
};

exports.getPaginatedPatients = async (
  page = 1,
  limit = 10,
  status = null,
  appointment_date = null
) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT 
      a.*, 
      d.dr_name AS dr_name, 
      sp.sp_name AS specialty,
      d.dr_h_name,
      d.sp_id
    FROM patients a
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

exports.getPatientsByUserId = async (id_u) => {
  const [rows] = await db.query("SELECT * FROM patients WHERE id_u = ?", [id_u]);
  return rows;
};

exports.getAppointmentsByUserId = async (userId) => {
  const sql = `
    SELECT a.*, d.dr_name AS dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id
    FROM patients a
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    WHERE a.id_u = ?
    ORDER BY a.appointment_date DESC, a.time_slot
  `;
  const [result] = await db.query(sql, [userId]);
  return result;
};

// Appointments for a doctor (by the doctor's user id)
exports.getAppointmentsByDoctorUserId = async (doctorUserId) => {
  const sql = `
    SELECT a.*, 
           u.name_u AS user_name,
           d.dr_name AS dr_name, sp.sp_name AS specialty, d.dr_h_name, d.sp_id
    FROM patients a
    JOIN doctors d ON a.dr_id = d.dr_id
    LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    JOIN users u ON a.id_u = u.id_u
    WHERE d.id_u = ?
    ORDER BY a.appointment_date DESC, a.time_slot
  `;
  const [result] = await db.query(sql, [doctorUserId]);
  return result;
};

exports.getBookedSlots = async (dr_id, date) => {
  const sql = `
    SELECT time_slot 
    FROM patients 
    WHERE dr_id = ? 
    AND appointment_date = ? 
    AND status IN ('pending', 'approved')
  `;
  const [results] = await db.query(sql, [dr_id, date]);
  return results.map((r) => r.time_slot);
};

// Doctor proposes a new schedule for an appointment
exports.proposeReschedule = async (id_appointment, proposed_date, proposed_time_slot, reason, requested_by) => {
  const sql = `
    UPDATE patients
    SET proposed_appointment_date = ?, 
        proposed_time_slot = ?, 
        reschedule_reason = ?,
        reschedule_status = 'requested',
        reschedule_requested_by = ?
    WHERE id_appointment = ?
  `;
  await db.query(sql, [proposed_date, proposed_time_slot, reason || null, requested_by || null, id_appointment]);
  return { success: true };
};

// Patient accepts the proposed reschedule
exports.acceptReschedule = async (id_appointment) => {
  const sql = `
    UPDATE patients
    SET appointment_date = COALESCE(proposed_appointment_date, appointment_date),
        time_slot = COALESCE(proposed_time_slot, time_slot),
        proposed_appointment_date = NULL,
        proposed_time_slot = NULL,
        reschedule_reason = NULL,
        reschedule_status = 'accepted'
    WHERE id_appointment = ?
  `;
  await db.query(sql, [id_appointment]);
  return { success: true };
};

// Patient declines the proposed reschedule
exports.declineReschedule = async (id_appointment) => {
  const sql = `
    UPDATE patients
    SET reschedule_status = 'declined'
    WHERE id_appointment = ?
  `;
  await db.query(sql, [id_appointment]);
  return { success: true };
};
