// controllers/patients.controller.js
const patientService = require("../services/patients.service");
const appointmentService = require("../services/appointment.service");
const rescheduleService = require("../services/appointmentReschedule.service");
const scheduleService = require("../services/schedule.service");

require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
  logger: true
});

// ── Đặt lịch ────────────────────────────────────────────────────────────────
exports.createPatient = async (req, res) => {
  try {
    const data = req.body;
    const newPatient = await patientService.createPatient(data);
    res.status(201).json(newPatient);
  } catch (err) {
    console.error("❌ Error booking:", err);

    if (err.code === 'SLOT_FULL') {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: "Booking failed", detail: err.message });
  }
};

// ── Danh sách lịch hẹn ──────────────────────────────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, appointment_date } = req.query;
    const data = await patientService.getPaginatedPatients(page, limit, status, appointment_date);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch", detail: err.message });
  }
};

// ── Cập nhật trạng thái ─────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }

  try {
    await patientService.updateStatus(id, status);

    if (status === "approved") {
      const appt = await appointmentService.getAppointmentById(id);
      console.log("📧 EMAIL:", appt?.email);
      console.log("📦 APPT:", appt);

      if (appt && appt.email) {
        try {
          await transporter.sendMail({
            from: { name: process.env.SMTP_FROM_NAME, address: process.env.SMTP_FROM_EMAIL },
            to: appt.email,
            subject: "Thông báo xác nhận đặt lịch khám",
            html: `
              <h3>Đặt lịch khám thành công!</h3>
              <b>Tên bệnh nhân:</b> ${appt.p_name}<br/>
              <b>Bác sĩ:</b> ${appt.dr_name}<br/>
              <b>Chuyên khoa:</b> ${appt.specialty || 'Đang cập nhật'}<br/>
              <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
              <b>Ngày khám:</b> ${appt.appointment_date}<br/>
              ${appt.time_slot ? `<b>Khung giờ:</b> ${appt.time_slot}<br/>` : ''}
              <b>Số thứ tự:</b> ${appt.queue_number}<br/>
              <b>Lý do khám:</b> ${appt.reason || ''}
            `,
          });
          console.log("✅ Email sent (approved)");
        } catch (e) {
          console.error("❌ Send mail error:", e);
        }
      }
    }

    res.json({ success: true, message: `Đã cập nhật trạng thái thành ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Lỗi cập nhật trạng thái", detail: err.message });
  }
};

// ── Hủy lịch ────────────────────────────────────────────────────────────────
exports.cancelAppointment = async (req, res) => {
  const { id_appointment } = req.params;
  try {
    await patientService.cancelAppointment(id_appointment);
    res.json({ success: true, message: "Đã hủy và xóa lịch khám" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Lấy lịch theo user ──────────────────────────────────────────────────────
exports.getByUserId = async (req, res) => {
  try {
    const userId = req.params.id_u;
    const data = await patientService.getPatientsByUserId(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy lịch của người dùng", detail: err.message });
  }
};

exports.getUserAppointments = async (req, res) => {
  console.log("🔥 getUserAppointments called", req.user);
  try {
    const userId = req.user.id_u;
    const data = await patientService.getAppointmentsByUserId(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy lịch khám", detail: err.message });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const { dr_id, date } = req.params;
    const slots = await patientService.getBookedSlots(dr_id, date);
    res.json(slots);
  } catch (err) {
    console.error("❌ getBookedSlots error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorUserId = req.user.id_u;
    const data = await patientService.getAppointmentsByDoctorUserId(doctorUserId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy lịch khám của bác sĩ", detail: err.message });
  }
};

// ── Kiểm tra slot usage ─────────────────────────────────────────────────────
exports.getSlotUsage = async (req, res) => {
  try {
    const dr_id = req.params.id;
    const { time_slot, date } = req.query;

    if (!time_slot || !date) {
      return res.status(400).json({ error: "Thiếu time_slot hoặc date" });
    }

    const availability = await scheduleService.checkSlotAvailability(dr_id, time_slot, date);

    res.json({
      dr_id,
      time_slot,
      date,
      current_slot: availability.current_slot ?? 0,
      max_slot:     availability.max_slot ?? null,
      available:    availability.available,
      reason:       availability.reason ?? null,
    });
  } catch (err) {
    console.error("❌ getSlotUsage error:", err);
    res.status(500).json({ error: "Database error", detail: err.message });
  }
};

// ── Đề xuất đổi lịch ────────────────────────────────────────────────────────
exports.proposeReschedule = async (req, res) => {
  const { id } = req.params;
  const { proposed_date, proposed_time_slot, reason } = req.body || {}; // ← thêm proposed_time_slot
  try {
    if (!proposed_date) {
      return res.status(400).json({ error: "Thiếu ngày đề xuất" });
    }

    const requested_by = req.user?.role === "doctor" ? "doctor" : "patient";

    // ← truyền proposed_time_slot vào service
    await patientService.proposeReschedule(id, proposed_date, proposed_time_slot, reason, requested_by);

    const appt = await appointmentService.getAppointmentById(id);
    if (!appt) return res.json({ success: true });

    // Notification cho bác sĩ
    if (appt.dr_id) {
      const notificationService = require("../services/notification.service");
      try {
        const slotInfo = proposed_time_slot ? ` lúc ${proposed_time_slot}` : '';
        const message = `Bệnh nhân ${appt.p_name} đề xuất đổi lịch khám từ ${appt.appointment_date} sang ${proposed_date}${slotInfo}. ${reason ? `Lý do: ${reason}` : ''}`;
        await notificationService.createDoctorNotification({
          doctorId: appt.dr_id,
          message,
          type: "general",
        });
      } catch (notifError) {
        console.error("❌ Failed to create doctor notification:", notifError);
      }
    }

    // Email thông báo
    const requesterRole = req.user?.role;
    const slotInfo = proposed_time_slot ? ` lúc ${proposed_time_slot}` : '';

    if (requesterRole === "doctor") {
      if (appt.email) {
        try {
          await transporter.sendMail({
            from: { name: process.env.SMTP_FROM_NAME, address: process.env.SMTP_FROM_EMAIL },
            to: appt.email,
            subject: 'Đề xuất thay đổi lịch khám từ bác sĩ',
            html: `
              <h3>Bác sĩ đề xuất thay đổi lịch khám</h3>
              <b>Bác sĩ:</b> ${appt.dr_name} (${appt.specialty || 'Đang cập nhật'})<br/>
              <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
              <b>Lịch cũ:</b> ${appt.appointment_date}${appt.time_slot ? ` lúc ${appt.time_slot}` : ''} - Số ${appt.queue_number}<br/>
              <b>Lịch đề xuất:</b> ${proposed_date}${slotInfo}<br/>
              <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
              <p>Vui lòng vào trang Lịch khám để chấp nhận hoặc từ chối.</p>
            `,
          });
        } catch (e) {
          console.error("❌ Send mail error:", e);
        }
      }
    } else {
      if (appt.doctor_email) {
        try {
          await transporter.sendMail({
            from: { name: process.env.SMTP_FROM_NAME, address: process.env.SMTP_FROM_EMAIL },
            to: appt.doctor_email,
            subject: 'Bệnh nhân đề xuất thay đổi lịch khám',
            html: `
              <h3>Bệnh nhân đề xuất thay đổi lịch khám</h3>
              <b>Bệnh nhân:</b> ${appt.p_name}<br/>
              <b>Lịch cũ:</b> ${appt.appointment_date}${appt.time_slot ? ` lúc ${appt.time_slot}` : ''} - Số ${appt.queue_number}<br/>
              <b>Lịch đề xuất:</b> ${proposed_date}${slotInfo}<br/>
              <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
              <p>Vui lòng vào trang Lịch bác sĩ để chấp nhận hoặc từ chối.</p>
            `,
          });
        } catch (e) {
          console.error("❌ Send mail error:", e);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ proposeReschedule error:", err);
    res.status(500).json({ error: "Không thể đề xuất đổi lịch", detail: err.message });
  }
};

// ── Chấp nhận đổi lịch ──────────────────────────────────────────────────────
exports.acceptReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    const reschedule = await rescheduleService.getActiveReschedule(id);
    if (!reschedule) {
      return res.status(400).json({ error: "Không có đề xuất cần xử lý" });
    }

    const role = req.user?.role;
    if (reschedule.requested_by === 'patient' && role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ error: "Chỉ bác sĩ hoặc admin được chấp nhận đề xuất của bệnh nhân" });
    }
    if (reschedule.requested_by === 'doctor' && role !== 'patient' && role !== 'user' && role !== 'admin') {
      return res.status(403).json({ error: "Chỉ bệnh nhân hoặc admin được chấp nhận đề xuất của bác sĩ" });
    }

    await patientService.acceptReschedule(id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ acceptReschedule error:", err);

    if (err.code === 'SLOT_FULL') {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: "Không thể chấp nhận đổi lịch", detail: err.message });
  }
};

// ── Từ chối đổi lịch ────────────────────────────────────────────────────────
exports.declineReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    const reschedule = await rescheduleService.getActiveReschedule(id);
    if (!reschedule) {
      return res.status(400).json({ error: "Không có đề xuất cần xử lý" });
    }

    const role = req.user?.role;
    if (reschedule.requested_by === 'patient' && role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ error: "Chỉ bác sĩ hoặc admin được từ chối đề xuất của bệnh nhân" });
    }
    if (reschedule.requested_by === 'doctor' && role !== 'patient' && role !== 'user' && role !== 'admin') {
      return res.status(403).json({ error: "Chỉ bệnh nhân hoặc admin được từ chối đề xuất của bác sĩ" });
    }

    await patientService.declineReschedule(id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ declineReschedule error:", err);
    res.status(500).json({ error: "Không thể từ chối đổi lịch", detail: err.message });
  }
};