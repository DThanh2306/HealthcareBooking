// controllers/patients.controller.js
const patientService = require("../services/patients.service");
const appointmentService = require("../services/appointment.service");
const rescheduleService = require("../services/appointmentReschedule.service");

require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME, // apikey
    pass: process.env.SMTP_PASSWORD,
  },
    debug: true, 
    logger: true
});


exports.createPatient = async (req, res) => {
  try {
    const data = req.body;
    const newPatient = await patientService.createPatient(data);
    res.status(201).json(newPatient);
  } catch (err) {
    console.error("❌ Error booking:", err);
    res.status(500).json({ error: "Booking failed", detail: err.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, appointment_date } = req.query;
    const data = await patientService.getPaginatedPatients(
      page,
      limit,
      status,
      appointment_date
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch", detail: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }

  try {
    await patientService.updateStatus(id, status);
    
    // Send email notification if approved
    if (status === "approved") {
      const appt = await appointmentService.getAppointmentById(id);

        console.log("📧 EMAIL:", appt?.email);
        console.log("📦 APPT:", appt);


      if (appt && appt.email) {
        try {
          await transporter.sendMail({
            from: {
              name: process.env.SMTP_FROM_NAME,
              address: process.env.SMTP_FROM_EMAIL,
            },
            to: appt.email,
            subject: "Thông báo xác nhận đặt lịch khám",
            html: `
              <h3>Đặt lịch khám thành công!</h3>
              <b>Tên bệnh nhân:</b> ${appt.p_name}<br/>
              <b>Bác sĩ:</b> ${appt.dr_name}<br/>
              <b>Chuyên khoa:</b> ${appt.specialty || 'Đang cập nhật'}<br/>
              <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
              <b>Ngày khám:</b> ${appt.appointment_date}<br/>
              <b>Số thứ tự:</b> ${appt.queue_number}<br/>
              <b>Lý do khám:</b> ${appt.reason || ''}
            `,
          });

          console.log("✅ Email sent (approved)");
        } catch (e) {
          console.error("❌ Brevo send mail error:", e);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Đã cập nhật trạng thái thành ${status}`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi cập nhật trạng thái", detail: err.message });
  }
};
exports.cancelAppointment = async (req, res) => {
  const { id_appointment } = req.params;
  try {
    await patientService.cancelAppointment(id_appointment);

    res.json({ success: true, message: "Đã hủy và xóa lịch khám" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByUserId = async (req, res) => {
  try {
    const userId = req.params.id_u;
    const data = await patientService.getPatientsByUserId(userId);
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi lấy lịch của người dùng", detail: err.message });
  }
};

exports.getUserAppointments = async (req, res) => {
  console.log("🔥 getUserAppointments called", req.user);

  try {
    const userId = req.user.id_u;
    const data = await patientService.getAppointmentsByUserId(userId);
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi khi lấy lịch khám", detail: err.message });
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

// Doctor or patient proposes reschedule
exports.proposeReschedule = async (req, res) => {
  const { id } = req.params;
  const { proposed_date, reason } = req.body || {};
  try {
    if (!proposed_date) {
      return res.status(400).json({ error: "Thiếu ngày đề xuất" });
    }
    const requested_by = req.user?.role === "doctor" ? "doctor" : "patient";
    await patientService.proposeReschedule(id, proposed_date, reason, requested_by);

    // Get appointment details for notification
    const appt = await appointmentService.getAppointmentById(id);
    if (!appt) {
      return res.json({ success: true });
    }

    // Create notification for doctor about reschedule request
    if (appt.dr_id) {
      const notificationService = require("../services/notification.service");
      try {
        const message = `Bệnh nhân ${appt.p_name} đề xuất đổi lịch khám từ ${appt.appointment_date} sang ${proposed_date}. ${reason ? `Lý do: ${reason}` : ''}`;
        await notificationService.createDoctorNotification({
          doctorId: appt.dr_id,
          message: message,
          type: "general" // Using general type for reschedule requests
        });
      } catch (notifError) {
        console.error("❌ Failed to create doctor notification:", notifError);
        // Don't fail the whole request if notification fails
      }
    }

    // Send email to the opposite party about proposed change
    
    const requesterRole = req.user?.role;

    // If doctor requested → email patient; if user requested → email doctor
    if (requesterRole === "doctor") {
      if (appt.email) {
        const msg = {
          to: appt.email,
          from: { email: 'thachotaodi711@gmail.com', name: 'Booking Medical' },
          subject: 'Đề xuất thay đổi lịch khám từ bác sĩ',
          html:
            `<h3>Bác sĩ đề xuất thay đổi lịch khám</h3>
             <b>Bác sĩ:</b> ${appt.dr_name} (${appt.specialty || 'Đang cập nhật'})<br/>
             <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
             <b>Lịch cũ:</b> ${appt.appointment_date} - Số ${appt.queue_number}<br/>
             <b>Lịch đề xuất:</b> ${proposed_date} (số thứ tự sẽ được cấp khi chấp nhận)<br/>
             <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
             <p>Vui lòng vào trang Lịch khám để chấp nhận hoặc từ chối.</p>`
        };
        try { await sgMail.send(msg); } catch (e) { console.error("❌ Send mail error:", e.response?.body || e); }
      }
    } else {
      if (appt.doctor_email) {
        const msg = {
          to: appt.doctor_email,
          from: { email: 'thachotaodi711@gmail.com', name: 'Booking Medical' },
          subject: 'Bệnh nhân đề xuất thay đổi lịch khám',
          html:
            `<h3>Bệnh nhân đề xuất thay đổi lịch khám</h3>
             <b>Bệnh nhân:</b> ${appt.p_name}<br/>
             <b>Lịch cũ:</b> ${appt.appointment_date} - Số ${appt.queue_number}<br/>
             <b>Lịch đề xuất:</b> ${proposed_date} (số thứ tự sẽ được cấp khi chấp nhận)<br/>
             <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
             <p>Vui lòng vào trang Lịch bác sĩ để chấp nhận hoặc từ chối.</p>`
        };
        try { await sgMail.send(msg); } catch (e) { console.error("❌ Send mail error:", e.response?.body || e); }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ proposeReschedule error:", err);
    res.status(500).json({ error: "Không thể đề xuất đổi lịch", detail: err.message });
  }
};

// Accept proposed reschedule
exports.acceptReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate role vs requested_by
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
    res.status(500).json({ error: "Không thể chấp nhận đổi lịch", detail: err.message });
  }
};

// Decline proposed reschedule
exports.declineReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate role vs requested_by
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