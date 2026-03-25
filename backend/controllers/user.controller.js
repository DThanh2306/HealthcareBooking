const userService = require("../services/user.service");
const bcrypt = require("bcrypt");

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (err) {
    console.error("❌ getUserById error:", err);
    res.status(500).json({ message: "Lỗi server", detail: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Luôn đảm bảo req.body tồn tại
    const body = req.body || {};

    // 🆕 Xử lý ảnh cho cả doctor và user
    const data = { ...body };
    
    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      
      // ✅ Kiểm tra role để set đúng field
      const userRole = await userService.getUserRole(id);
      if (userRole === 'doctor') {
        data.image = imagePath; // Bác sĩ dùng field 'image'
      } else {
        data.avatar = imagePath; // User thường dùng field 'avatar'
      }
    }

    const result = await userService.updateUser(id, data);

    // 🆕 Trả về dữ liệu đã cập nhật
    const updatedUser = await userService.getUserById(id);

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      updatedData: updatedUser
    });
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({
      message: "Lỗi server",
      detail: err.message,
    });
  }
};

// 🆕 Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Mật khẩu xác nhận không khớp"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const user = await userService.getUserForPasswordCheck(id);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_u);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng"
      });
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await userService.updatePassword(id, hashedNewPassword);

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công"
    });

  } catch (err) {
    console.error("❌ changePassword error:", err);
    res.status(500).json({
      message: "Lỗi server",
      detail: err.message,
    });
  }
};
