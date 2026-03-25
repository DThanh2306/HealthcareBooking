const db = require("../config/db");
const { unlink } = require("fs");
const path = require("path");

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  // Normalize number strings: trim, replace comma decimal with dot
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function clampCoord(value, min, max) {
  if (value === null) return null;
  if (value < min || value > max) return null;
  return value;
}

function readHospital(data) {
  const lat = clampCoord(toNumberOrNull(data.h_lat ?? data.lat), -90, 90);
  const lng = clampCoord(toNumberOrNull(data.h_lng ?? data.lng), -180, 180);
  return {
    h_name: data.h_name ?? data.name ?? '',
    logo: data.logo ?? '',
    h_address: data.h_address ?? data.address ?? '',
    h_description: data.h_description ?? data.description ?? '',
    h_phone: data.h_phone ?? data.phone ?? '',
    h_lat: lat,
    h_lng: lng,
  };
}

async function getAllHospitals() {
  try {
    const [results] = await db.execute("SELECT * FROM hospitals");
    return results;
  } catch (error) {
    throw error;
  }
}

async function getHospitalById(id) {
  try {
    const [results] = await db.execute("SELECT * FROM hospitals WHERE h_id = ?", [id]);
    return results[0] || null;
  } catch (error) {
    throw error;
  }
}

async function getHospitalByExactName(name) {
  try {
    const [results] = await db.execute("SELECT * FROM hospitals WHERE h_name = ? LIMIT 1", [name]);
    return results[0] || null;
  } catch (error) {
    throw error;
  }
}

async function getHospitalByNameInsensitive(name) {
  try {
    const [results] = await db.execute(
      "SELECT * FROM hospitals WHERE LOWER(h_name) = LOWER(?) OR h_name LIKE ? LIMIT 1",
      [name, `%${name}%`]
    );
    return results[0] || null;
  } catch (error) {
    throw error;
  }
}

async function createHospital(data) {
  const hospital = readHospital(data);
  try {
    const sql = `INSERT INTO hospitals (h_name, logo, h_address, h_description, h_phone, h_lat, h_lng) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      hospital.h_name,
      hospital.logo,
      hospital.h_address,
      hospital.h_description,
      hospital.h_phone,
      hospital.h_lat,
      hospital.h_lng,
    ];
    const [result] = await db.execute(sql, params);
    return { h_id: result.insertId, ...hospital };
  } catch (error) {
    console.error('SQL insert hospitals error:', error && error.message || error);
    throw error;
  }
}

async function updateHospital(id, data) {
  const updated = readHospital(data);
  try {
    const sql = `UPDATE hospitals 
      SET h_name = ?, logo = ?, h_address = ?, h_description = ?, h_phone = ?, h_lat = ?, h_lng = ?
      WHERE h_id = ?`;
    const params = [
      updated.h_name,
      updated.logo,
      updated.h_address,
      updated.h_description,
      updated.h_phone,
      updated.h_lat,
      updated.h_lng,
      id
    ];
    await db.execute(sql, params);
    return { h_id: Number(id), ...updated };
  } catch (error) {
    console.error('SQL update hospitals error:', error && error.message || error);
    throw error;
  }
}

async function deleteHospital(id) {
  const hospital = await getHospitalById(id);

  try {
    await db.execute("DELETE FROM hospitals WHERE h_id = ?", [id]);
    // Xóa ảnh cũ nếu tồn tại
    if (hospital?.logo && hospital.logo.startsWith("/uploads/")) {
      unlink(path.join("public", hospital.logo), (err) => {});
    }
    return true;
  } catch (error) {
    throw error;
  }
}

async function searchHospitalsByName(keyword) {
  try {
    const [results] = await db.execute(
      "SELECT * FROM hospitals WHERE LOWER(h_name) LIKE LOWER(?)",
      [`%${keyword}%`]
    );
    return results;
  } catch (error) {
    throw error;
  }
}

async function getHospitalSpecialties(hospitalName) {
  try {
    const sql = `
      SELECT DISTINCT sp.sp_id, sp.sp_name, sp.sp_description, COUNT(d.dr_id) as doctor_count
      FROM doctors d
      INNER JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE d.dr_h_name = ?
      GROUP BY sp.sp_id, sp.sp_name, sp.sp_description
      ORDER BY sp.sp_name
    `;
    const [results] = await db.execute(sql, [hospitalName]);
    return results;
  } catch (error) {
    throw error;
  }
}

async function searchHospitalsByAddressOrName(keyword) {
  try {
    const like = `%${keyword}%`;
    const [results] = await db.execute(
      "SELECT * FROM hospitals WHERE h_address LIKE ? OR h_name LIKE ?",
      [like, like]
    );
    return results;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllHospitals,
  getHospitalById,
  getHospitalByExactName,
  getHospitalByNameInsensitive,
  createHospital,
  updateHospital,
  deleteHospital,
  searchHospitalsByName,
  searchHospitalsByAddressOrName,
  getHospitalSpecialties,
};
