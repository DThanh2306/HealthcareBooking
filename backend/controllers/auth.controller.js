const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    await authService.register(req.body);
    res.json({ success: true, message: "Đăng ký thành công" });
  } catch (err) {
    res.status(500).json({ error: "Đăng ký thất bại", detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { token, user } = await authService.login(
      req.body.email_u,
      req.body.password_u
    );
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: "Đăng nhập thất bại", detail: err.message });
  }
};
