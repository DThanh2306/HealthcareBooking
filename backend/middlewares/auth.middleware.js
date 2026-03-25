const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Không có token" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Chuẩn hóa payload để hỗ trợ cả token cũ (id) và mới (id_u)
    req.user = {
      ...decoded,
      id_u: decoded.id_u || decoded.id || decoded.userId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Chỉ dành cho admin" });
  }
  next();
};

exports.optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Chuẩn hóa payload để hỗ trợ cả token cũ (id) và mới (id_u)
    req.user = {
      ...decoded,
      id_u: decoded.id_u || decoded.id || decoded.userId,
    };
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

exports.requireDoctor = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ error: "Chỉ dành cho bác sĩ" });
  }
  next();
};