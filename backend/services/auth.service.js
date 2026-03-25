const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // nên lưu vào biến môi trường

exports.register = async (data) => {
  const {
    name_u,
    email_u,
    sdt_u,
    birth_u,
    gender_u,
    city_u,
    distr_u,
    ward_u,
    password_u,
    role = "user",
  } = data;
  const hashedPassword = await bcrypt.hash(password_u, 10);
  const sql =
    "INSERT INTO users (name_u, email_u, sdt_u, birth_u, gender_u, city_u, distr_u, ward_u, password_u, role) VALUES (?, ?, ?, ?,?,?,?,?,?,?)";
  await db.query(sql, [
    name_u,
    email_u,
    sdt_u,
    birth_u,
    gender_u,
    city_u,
    distr_u,
    ward_u,
    hashedPassword,
    role,
  ]);
  return { success: true };
};

exports.login = async (email_u, password_u) => {
  const sql = "SELECT * FROM users WHERE email_u = ?";
  const [results] = await db.query(sql, [email_u]);
  if (!results.length) throw new Error("Tài khoản không tồn tại");

  const user = results[0];
  const isMatch = await bcrypt.compare(password_u, user.password_u);
  if (!isMatch) throw new Error("Sai mật khẩu");

  const token = jwt.sign(
    { id_u: user.id_u, name_u: user.name_u, role: user.role },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

  delete user.password_u;
  return { token, user };
};
