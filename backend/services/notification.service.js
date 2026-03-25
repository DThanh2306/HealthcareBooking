const db = require("../config/db");

class NotificationService {
  async createDoctorNotification({
    doctorId,
    averageRating = null,
    message,
    type = "low_rating",
    adminId = null,
  }) {
    if (!doctorId) {
      throw new Error("Thiếu thông tin bác sĩ");
    }

    const [doctorRows] = await db.query(
      "SELECT dr_id, dr_name, id_u AS doctor_user_id FROM doctors WHERE dr_id = ?",
      [doctorId]
    );

    if (!doctorRows.length) {
      throw new Error("Không tìm thấy bác sĩ");
    }

    const doctor = doctorRows[0];
    if (!doctor.doctor_user_id) {
      throw new Error("Bác sĩ chưa liên kết tài khoản đăng nhập");
    }

    const numericAverage =
      averageRating !== null && averageRating !== undefined
        ? parseFloat(averageRating)
        : null;

    const finalMessage =
      message ||
      `Điểm đánh giá trung bình của bạn hiện tại ${
        numericAverage !== null ? `${numericAverage.toFixed(1)} sao` : ""
      }. Vui lòng rà soát quy trình khám và cải thiện trải nghiệm bệnh nhân.`;

    const [result] = await db.query(
      `INSERT INTO doctor_notifications 
       (doctor_id, doctor_user_id, doctor_name, average_rating, message, type, status, created_by_admin)
       VALUES (?, ?, ?, ?, ?, ?, 'unread', ?)`,
      [
        doctor.dr_id,
        doctor.doctor_user_id,
        doctor.dr_name,
        numericAverage,
        finalMessage,
        type,
        adminId,
      ]
    );

    return {
      id: result.insertId,
      doctor_id: doctor.dr_id,
      doctor_user_id: doctor.doctor_user_id,
      doctor_name: doctor.dr_name,
      average_rating: numericAverage,
      message: finalMessage,
      type,
      status: "unread",
      created_by_admin: adminId,
    };
  }

  async listDoctorNotifications(doctorUserId) {
    const [rows] = await db.query(
      `SELECT id, doctor_id, doctor_name, average_rating, message, type, status, created_at
       FROM doctor_notifications
       WHERE doctor_user_id = ?
       ORDER BY created_at DESC`,
      [doctorUserId]
    );
    return rows;
  }

  async markDoctorNotificationRead(notificationId, doctorUserId) {
    const [result] = await db.query(
      `UPDATE doctor_notifications 
       SET status = 'read'
       WHERE id = ? AND doctor_user_id = ?`,
      [notificationId, doctorUserId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new NotificationService();
