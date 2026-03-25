const db = require("../config/db");
const { unlink } = require("fs");
const path = require("path");

function readDoctor(data) {
  // Normalize and map input fields to DB columns
  const specialtyId = data.specialty_id !== undefined ? data.specialty_id : data.sp_id;
  const hospitalId = data.h_id !== undefined && data.h_id !== '' ? Number(data.h_id) : null;
  const price = data.dr_price !== undefined && data.dr_price !== '' ? Number(data.dr_price) : 0;
  return {
    dr_name: data.dr_name,
    sp_id: specialtyId || null,
    h_id: hospitalId, // ensure hospital id is persisted
    image: data.image,
    dr_price: price,
    dr_h_name: data.dr_h_name,
    dr_description: data.dr_description,
  };
}

async function getAllDoctors(specialty = null, search = null, hospital = null) {
  try {
    let sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    `;
    let params = [];
    let conditions = [];
    
    if (specialty) {
      conditions.push('d.sp_id = ?');
      params.push(specialty);
    }
    
    if (search) {
      conditions.push('(LOWER(d.dr_name) LIKE LOWER(?) OR LOWER(COALESCE(sp.sp_name, "")) LIKE LOWER(?))');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY d.dr_id ASC`;
    
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    throw error;
  }
}

async function getDoctorById(dr_id) {
  try {
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE d.dr_id = ?
    `;
    const [results] = await db.query(sql, [dr_id]);
    return results[0] || null;
  } catch (error) {
    throw error;
  }
}

async function createDoctor(data) {
  const doctor = readDoctor(data);
  try {
    const [result] = await db.query("INSERT INTO doctors SET ?", doctor);
    return { dr_id: result.insertId, ...doctor };
  } catch (error) {
    throw error;
  }
}

async function updateDoctor(dr_id, data) {
  const updated = readDoctor(data);
  try {
    await db.query("UPDATE doctors SET ? WHERE dr_id = ?", [updated, dr_id]);
    return { dr_id, ...updated };
  } catch (error) {
    throw error;
  }
}

async function deleteDoctor(dr_id) {
  const doctor = await getDoctorById(dr_id);
  try {
    await db.query("DELETE FROM doctors WHERE dr_id = ?", [dr_id]);
    // Xóa ảnh cũ nếu tồn tại
    if (doctor?.image && doctor.image.startsWith("/uploads/")) {
      unlink(path.join("public", doctor.image), (err) => {});
    }
    return true;
  } catch (error) {
    throw error;
  }
}

async function searchDoctorsByName(keyword) {
  try {
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE LOWER(d.dr_name) LIKE LOWER(?)
      ORDER BY d.dr_id ASC
    `;
    const [results] = await db.query(sql, [`%${keyword}%`]);
    return results;
  } catch (error) {
    throw error;
  }
}

async function getDoctorsWithPagination(limit = 10, offset = 0, specialty = null, search = null, hospital = null) {
  try {
    let sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    `;
    let params = [];
    let conditions = [];
    
    if (specialty) {
      conditions.push('d.sp_id = ?');
      params.push(specialty);
    }
    
    if (search) {
      conditions.push('(LOWER(d.dr_name) LIKE LOWER(?) OR LOWER(COALESCE(sp.sp_name, "")) LIKE LOWER(?))');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY d.dr_id ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    throw error;
  }
}

async function countDoctors(specialty = null, search = null, hospital = null) {
  try {
    let sql = `
      SELECT COUNT(*) as total
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
    `;
    let params = [];
    let conditions = [];
    
    if (specialty) {
      conditions.push('d.sp_id = ?');
      params.push(specialty);
    }
    
    if (search) {
      conditions.push('(LOWER(d.dr_name) LIKE LOWER(?) OR LOWER(COALESCE(sp.sp_name, "")) LIKE LOWER(?))');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const [results] = await db.query(sql, params);
    return results[0].total;
  } catch (error) {
    throw error;
  }
}

async function findDoctorsBySpecialties(specialtyIds) {
  try {
    const placeholders = specialtyIds.map(() => '?').join(',');
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE d.sp_id IN (${placeholders})
      ORDER BY d.dr_name
    `;
    const [results] = await db.query(sql, specialtyIds);
    return results;
  } catch (error) {
    throw error;
  }
}

async function findDoctorsBySpecialtiesWithScore(specialtyScores) {
  try {
    const conditions = [];
    const params = [];
    
    for (const [specialtyId, score] of specialtyScores) {
      conditions.push(`(d.sp_id = ? AND ? > 0.5)`);
      params.push(specialtyId, score);
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE ${conditions.join(' OR ')}
      ORDER BY d.dr_name
    `;
    
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    throw error;
  }
}

async function getDoctorsByHospitalAndSpecialty(hospitalName, specialtyId) {
  try {
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE d.dr_h_name = ? AND d.sp_id = ?
      ORDER BY d.dr_id ASC
    `;
    const [results] = await db.query(sql, [hospitalName, specialtyId]);
    return results;
  } catch (error) {
    throw error;
  }
}

async function getBookedSlots(doctorId, date) {
  try {
    const sql = `
      SELECT time_slot 
      FROM patients 
      WHERE dr_id = ? AND appointment_date = ? AND status IN ('pending', 'approved')
    `;
    const [results] = await db.query(sql, [doctorId, date]);
    return results;
  } catch (error) {
    throw error;
  }
}

async function getDoctorByUserId(id_u) {
  try {
    const sql = `
      SELECT d.*, sp.sp_name AS specialty, sp.sp_id AS specialty_id
      FROM doctors d
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE d.id_u = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [id_u]);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  searchDoctorsByName,
  getDoctorsWithPagination,
  countDoctors,
  findDoctorsBySpecialties,
  findDoctorsBySpecialtiesWithScore,
  getDoctorsByHospitalAndSpecialty,
  getBookedSlots,
  getDoctorByUserId,
};
