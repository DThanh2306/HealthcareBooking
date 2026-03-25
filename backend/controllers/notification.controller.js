const notificationService = require("../services/notification.service");

exports.getDoctorNotifications = async (req, res) => {
  try {
    const doctorUserId = req.user.id_u;
    const notifications = await notificationService.listDoctorNotifications(doctorUserId);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("❌ getDoctorNotifications error:", error);
    res.status(500).json({ error: "Không thể lấy danh sách thông báo" });
  }
};

exports.markDoctorNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorUserId = req.user.id_u;
    const updated = await notificationService.markDoctorNotificationRead(id, doctorUserId);
    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy thông báo" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ markDoctorNotificationRead error:", error);
    res.status(500).json({ error: "Không thể cập nhật trạng thái thông báo" });
  }
};
