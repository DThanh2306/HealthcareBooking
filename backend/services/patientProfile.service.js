// services/patientProfile.service.js
const db = require("../config/db");

/**
 * Find or create patient profile based on phone/email
 * Returns existing profile if found, creates new one otherwise
 */
exports.findOrCreatePatientProfile = async (data) => {
  // Try to find existing patient by phone (primary identifier)
  if (data.phone) {
    const [existing] = await db.query(
      "SELECT * FROM patient_profiles WHERE phone = ? LIMIT 1",
      [data.phone]
    );
    
    if (existing.length > 0) {
      // Update profile if needed
      const profileId = existing[0].id_patient;
      const updates = {
        p_name: data.name || data.p_name,
        gender: data.gender,
        email: data.email,
        dob: data.dob,
        tinh: data.tinh,
        quan: data.quan,
        xa: data.xa,
        to_thon: data.to_thon
      };
      
      await db.query(
        `UPDATE patient_profiles 
         SET p_name = ?, gender = ?, email = ?, dob = ?, 
             tinh = ?, quan = ?, xa = ?, to_thon = ?
         WHERE id_patient = ?`,
        [updates.p_name, updates.gender, updates.email, updates.dob,
         updates.tinh, updates.quan, updates.xa, updates.to_thon, profileId]
      );
      
      return profileId;
    }
  }
  
  // Create new profile
  const sql = `
    INSERT INTO patient_profiles (
      id_u, p_name, gender, phone, email, dob, tinh, quan, xa, to_thon
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    data.id_u || null,
    data.name || data.p_name,
    data.gender,
    data.phone,
    data.email,
    data.dob,
    data.tinh,
    data.quan,
    data.xa,
    data.to_thon
  ];
  
  const [result] = await db.query(sql, values);
  return result.insertId;
};

/**
 * Get patient profile by ID
 */
exports.getPatientProfileById = async (id_patient) => {
  const [rows] = await db.query(
    "SELECT * FROM patient_profiles WHERE id_patient = ?",
    [id_patient]
  );
  return rows[0] || null;
};

/**
 * Get all patient profiles for a user
 */
exports.getPatientProfilesByUserId = async (id_u) => {
  const [rows] = await db.query(
    "SELECT * FROM patient_profiles WHERE id_u = ?",
    [id_u]
  );
  console.log("Patient profiles for user", id_u, rows);
  return rows;
};

/**
 * Update patient profile
 */
exports.updatePatientProfile = async (id_patient, data) => {
  const fields = [];
  const values = [];
  
  if (data.p_name !== undefined) { fields.push('p_name = ?'); values.push(data.p_name); }
  if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.dob !== undefined) { fields.push('dob = ?'); values.push(data.dob); }
  if (data.tinh !== undefined) { fields.push('tinh = ?'); values.push(data.tinh); }
  if (data.quan !== undefined) { fields.push('quan = ?'); values.push(data.quan); }
  if (data.xa !== undefined) { fields.push('xa = ?'); values.push(data.xa); }
  if (data.to_thon !== undefined) { fields.push('to_thon = ?'); values.push(data.to_thon); }
  
  if (fields.length === 0) return { success: true };
  
  values.push(id_patient);
  await db.query(
    `UPDATE patient_profiles SET ${fields.join(', ')} WHERE id_patient = ?`,
    values
  );
  
  return { success: true };
};

/**
 * Delete patient profile (cascades to appointments)
 */
exports.deletePatientProfile = async (id_patient) => {
  await db.query("DELETE FROM patient_profiles WHERE id_patient = ?", [id_patient]);
  return { success: true };
};
