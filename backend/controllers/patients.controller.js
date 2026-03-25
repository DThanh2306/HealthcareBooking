// controllers/patients.controller.js
const patientService = require("../services/patients.service");

require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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
    // ----------- DI CHUYỂN ĐOẠN GỬI MAIL VÀO ĐÂY ----------
    if(status === "approved") {
      const db = require("../config/db");
      db.query(
        `SELECT p.*, d.dr_name AS dr_name, sp.sp_name AS specialty, d.dr_h_name 
         FROM patients p 
         JOIN doctors d ON p.dr_id = d.dr_id 
         LEFT JOIN specialties sp ON sp.sp_id = d.sp_id 
         WHERE p.id_appointment = ?`,
        [id],
        async (err, results) => {
          if (!err && results && results[0] && results[0].email) {
            const appt = results[0];
            const msg = {
              to: appt.email,
              from: {
                email: 'thachotaodi711@gmail.com', // <-- THAY BẰNG EMAIL ĐÃ XÁC THỰC CỦA BẠN
                name: 'Booking Medical' // <-- Tên hiển thị khi gửi mail
              },
              subject: 'Thông báo xác nhận đặt lịch khám',
              html:
                `<h3>Đặt lịch khám thành công!</h3>
                <b>Tên bệnh nhân:</b> ${appt.name}<br/>
                <b>Bác sĩ:</b> ${appt.dr_name}<br/>
                <b>Chuyên khoa:</b> ${appt.specialty || 'Đang cập nhật'}<br/>
                <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
                <b>Ngày khám:</b> ${appt.appointment_date}<br/>
                <b>Giờ khám:</b> ${appt.time_slot}<br/>
                <b>Lý do khám:</b> ${appt.reason}`
            };
            try {
              await sgMail.send(msg);
            } catch (e) {
              console.error("❌ SendGrid send mail error:", 
                e.response?.body?.errors || e.response?.body || e);
              
            }
          }
        }
      );
    }
    // ----------- END GỬI MAIL ----------
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

// Doctor proposes reschedule
exports.proposeReschedule = async (req, res) => {
  const { id } = req.params;
  const { proposed_date, proposed_time_slot, reason } = req.body || {};
  try {
    if (!proposed_date || !proposed_time_slot) {
      return res.status(400).json({ error: "Thiếu ngày/giờ đề xuất" });
    }
    const requested_by = req.user?.role === "doctor" ? "doctor" : "patient";
    await patientService.proposeReschedule(id, proposed_date, proposed_time_slot, reason, requested_by);

    // Send email to the opposite party about proposed change
    const db = require("../config/db");
    db.query(
      `SELECT p.*, d.dr_name AS dr_name, sp.sp_name AS specialty, d.dr_h_name, u.email_u AS doctor_email 
       FROM patients p 
       JOIN doctors d ON p.dr_id = d.dr_id 
       LEFT JOIN specialties sp ON sp.sp_id = d.sp_id 
       LEFT JOIN users u ON d.id_u = u.id_u
       WHERE p.id_appointment = ?`,
      [id],
      async (err, results) => {
        if (err || !results || !results[0]) return;
        const appt = results[0];
        const requesterRole = req.user?.role;

        // If doctor requested → email patient; if user requested → email doctor
        if (requesterRole === "doctor") {
          if (!appt.email) return;
          const msg = {
            to: appt.email,
            from: { email: 'thachotaodi711@gmail.com', name: 'Booking Medical' },
            subject: 'Đề xuất thay đổi lịch khám từ bác sĩ',
            html:
              `<h3>Bác sĩ đề xuất thay đổi lịch khám</h3>
               <b>Bác sĩ:</b> ${appt.dr_name} (${appt.specialty || 'Đang cập nhật'})<br/>
               <b>Bệnh viện:</b> ${appt.dr_h_name}<br/>
               <b>Lịch cũ:</b> ${appt.appointment_date} - ${appt.time_slot}<br/>
               <b>Lịch đề xuất:</b> ${proposed_date} - ${proposed_time_slot}<br/>
               <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
               <p>Vui lòng vào trang Lịch khám để chấp nhận hoặc từ chối.</p>`
          };
          try { await sgMail.send(msg); } catch (e) { console.error("❌ Send mail error:", e.response?.body || e); }
        } else {
          if (!appt.doctor_email) return;
          const msg = {
            to: appt.doctor_email,
            from: { email: 'thachotaodi711@gmail.com', name: 'Booking Medical' },
            subject: 'Bệnh nhân đề xuất thay đổi lịch khám',
            html:
              `<h3>Bệnh nhân đề xuất thay đổi lịch khám</h3>
               <b>Bệnh nhân:</b> ${appt.p_name || appt.name}<br/>
               <b>Lịch cũ:</b> ${appt.appointment_date} - ${appt.time_slot}<br/>
               <b>Lịch đề xuất:</b> ${proposed_date} - ${proposed_time_slot}<br/>
               <b>Lý do:</b> ${reason || 'Không cung cấp'}<br/>
               <p>Vui lòng vào trang Lịch bác sĩ để chấp nhận hoặc từ chối.</p>`
          };
          try { await sgMail.send(msg); } catch (e) { console.error("❌ Send mail error:", e.response?.body || e); }
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ proposeReschedule error:", err);
    res.status(500).json({ error: "Không thể đề xuất đổi lịch", detail: err.message });
  }
};

// Patient accepts proposed reschedule
exports.acceptReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate role vs requested_by
    const db = require("../config/db");
    const [rows] = await db.execute(
      "SELECT reschedule_status, reschedule_requested_by FROM patients WHERE id_appointment = ?",
      [id]
    );
    const appt = rows && rows[0];
    if (!appt || appt.reschedule_status !== 'requested') {
      return res.status(400).json({ error: "Không có đề xuất cần xử lý" });
    }
    const role = req.user?.role;
    if (appt.reschedule_requested_by === 'patient' && role !== 'doctor') {
      return res.status(403).json({ error: "Chỉ bác sĩ được chấp nhận đề xuất của bệnh nhân" });
    }
    if (appt.reschedule_requested_by === 'doctor' && role !== 'patient' && role !== 'user') {
      return res.status(403).json({ error: "Chỉ bệnh nhân được chấp nhận đề xuất của bác sĩ" });
    }

    await patientService.acceptReschedule(id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ acceptReschedule error:", err);
    res.status(500).json({ error: "Không thể chấp nhận đổi lịch", detail: err.message });
  }
};

// Patient declines proposed reschedule
exports.declineReschedule = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate role vs requested_by
    const db = require("../config/db");
    const [rows] = await db.execute(
      "SELECT reschedule_status, reschedule_requested_by FROM patients WHERE id_appointment = ?",
      [id]
    );
    const appt = rows && rows[0];
    if (!appt || appt.reschedule_status !== 'requested') {
      return res.status(400).json({ error: "Không có đề xuất cần xử lý" });
    }
    const role = req.user?.role;
    if (appt.reschedule_requested_by === 'patient' && role !== 'doctor') {
      return res.status(403).json({ error: "Chỉ bác sĩ được từ chối đề xuất của bệnh nhân" });
    }
    if (appt.reschedule_requested_by === 'doctor' && role !== 'patient' && role !== 'user') {
      return res.status(403).json({ error: "Chỉ bệnh nhân được từ chối đề xuất của bác sĩ" });
    }

    await patientService.declineReschedule(id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ declineReschedule error:", err);
    res.status(500).json({ error: "Không thể từ chối đổi lịch", detail: err.message });
  }
};