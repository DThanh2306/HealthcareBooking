const db = require("../config/db");
const BASE_URL = "http://localhost:3000"; // đường dẫn cố định

// Lấy role của user
exports.getUserRole = async (id) => {
  const sql = "SELECT role FROM users WHERE id_u = ?";
  const [results] = await db.query(sql, [id]);
  if (!results.length) return null;
  return results[0].role;
};

// Lấy thông tin người dùng theo id (phân biệt role)
exports.getUserById = async (id) => {
  const roleQuery = "SELECT role FROM users WHERE id_u = ?";
  const [roleResult] = await db.query(roleQuery, [id]);
  if (!roleResult.length) return null;

  const role = roleResult[0].role;

  if (role === "doctor") {
    // JOIN với bảng doctors
    const sql = `
      SELECT 
        u.id_u,
        u.email_u,
        u.role,
        d.dr_name,
        d.sp_id,
        sp.sp_name AS specialty,
        d.dr_h_name,
        d.dr_description,
        d.image
      FROM users u
      JOIN doctors d ON u.id_u = d.id_u
      LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
      WHERE u.id_u = ?
    `;
    const [results] = await db.query(sql, [id]);
    const doctor = results[0];

    // Thêm URL đầy đủ nếu ảnh có
    if (doctor && doctor.image && !String(doctor.image).startsWith("http")) {
      doctor.image = `${BASE_URL}${doctor.image}`;
    }

    return doctor;
  } else {
    // Người dùng thường
    const sql = `
      SELECT id_u, name_u, email_u, sdt_u, birth_u, gender_u, city_u, distr_u, ward_u, role, avatar 
      FROM users WHERE id_u = ?
    `;
    const [results] = await db.query(sql, [id]);
    const user = results[0];

    // Thêm URL đầy đủ nếu ảnh có
    if (user && user.avatar && !String(user.avatar).startsWith("http")) {
      user.avatar = `${BASE_URL}${user.avatar}`;
    }

    return user;
  }
};

exports.updateUser = async (id, data) => {
  // Kiểm tra role
  const roleQuery = "SELECT role FROM users WHERE id_u = ?";
  const [roleResult] = await db.query(roleQuery, [id]);
  if (!roleResult.length) throw new Error("Không tìm thấy người dùng");

  const role = roleResult[0].role;

  if (role === "doctor") {
    const allowedFields = [
      "dr_name",
      "sp_id",
      "dr_h_name",
      "dr_description",
      "image",
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (!updates.length) return { success: true, updated: 0, message: "Không có thay đổi" };

    const sql = `UPDATE doctors SET ${updates.join(", ")} WHERE id_u = ?`;
    values.push(id);

    const [result] = await db.query(sql, values);
    return { success: true, updated: result.affectedRows };
  } else {
    const allowedFields = [
      "name_u",
      "email_u",
      "sdt_u",
      "birth_u",
      "gender_u",
      "city_u",
      "distr_u",
      "ward_u",
      "avatar",
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (!updates.length) return { success: true, updated: 0, message: "Không có thay đổi" };

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id_u = ?`;
    values.push(id);

    const [result] = await db.query(sql, values);
    return { success: true, updated: result.affectedRows };
  }
};

// Lấy user với password để check (chỉ dùng cho đổi mật khẩu)
exports.getUserForPasswordCheck = async (id) => {
  const sql = "SELECT id_u, password_u FROM users WHERE id_u = ?";
  const [results] = await db.query(sql, [id]);
  if (!results.length) return null;
  return results[0];
};

// Cập nhật mật khẩu
exports.updatePassword = async (id, hashedPassword) => {
  const sql = "UPDATE users SET password_u = ? WHERE id_u = ?";
  const [result] = await db.query(sql, [hashedPassword, id]);
  return { success: true, updated: result.affectedRows };
};
