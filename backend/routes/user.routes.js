const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const avatarUpload = require("../middlewares/logo-upload-middleware");

// ✅ chỉ cho người đã đăng nhập mới truy cập
router.get("/:id", authMiddleware.verifyToken, userController.getUserById);

// ✅ chỉ giữ 1 PUT route duy nhất — có avatarUpload ở giữa
router.put(
  "/:id",
  authMiddleware.verifyToken,
  avatarUpload,
  userController.updateUser
);

// ✅ Upload ảnh đại diện riêng
router.post("/upload", authMiddleware.verifyToken, avatarUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file nào được tải lên" });
  }

  const filePath = `/uploads/${req.file.filename}`;
  res.json({
    message: "Upload thành công",
    filename: req.file.filename,
    path: filePath,
  });
});

// 🆕 Đổi mật khẩu
router.put("/:id/change-password", authMiddleware.verifyToken, userController.changePassword);

module.exports = router;
