/**
 * routes/botpress.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tất cả endpoints dành riêng cho Botpress chatbot.
 * Mount vào server.js:  app.use("/api/bot", require("./routes/botpress.routes"));
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router  = express.Router();
const db      = require("../config/db"); // dùng lại pool có sẵn

const ok  = (res, data, meta = {}) => res.json({ success: true, ...meta, data });
const err = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });

// ══════════════════════════════════════════════════════════════════════════════
//  1. TÌM KIẾM TỔNG HỢP
//  GET /api/bot/search?q=tim+mạch&type=all|doctor|hospital&limit=5
// ══════════════════════════════════════════════════════════════════════════════
router.get("/search", async (req, res) => {
  try {
    const { q = "", type = "all", limit = 5 } = req.query;
    const result = {};

    if (type === "all" || type === "doctor") {
      const [doctors] = await db.query(
        `SELECT d.dr_id, d.dr_name, d.dr_price,
                ROUND(d.average_rating,1) AS average_rating,
                s.sp_name, h.h_name
         FROM doctors d
         LEFT JOIN specialties s ON d.sp_id = s.sp_id
         LEFT JOIN hospitals   h ON d.h_id  = h.h_id
         WHERE d.dr_name LIKE ? OR s.sp_name LIKE ?
         ORDER BY d.average_rating DESC LIMIT ?`,
        [`%${q}%`, `%${q}%`, Number(limit)]
      );
      result.doctors = doctors;
    }

    if (type === "all" || type === "hospital") {
      const [hospitals] = await db.query(
        `SELECT h_id, h_name, h_address,
                ROUND(average_rating,1) AS average_rating, h_phone
         FROM hospitals
         WHERE h_name LIKE ? OR h_address LIKE ?
         ORDER BY average_rating DESC LIMIT ?`,
        [`%${q}%`, `%${q}%`, Number(limit)]
      );
      result.hospitals = hospitals;
    }

    ok(res, result);
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  2. DANH SÁCH CHUYÊN KHOA
//  GET /api/bot/specialties
// ══════════════════════════════════════════════════════════════════════════════
router.get("/specialties", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT sp_id, sp_name, sp_description FROM specialties ORDER BY sp_name"
    );
    ok(res, rows);
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  3. TÌM BÁC SĨ
//  GET /api/bot/doctors?sp_id=&h_id=&max_price=&min_rating=&search=&limit=5
// ══════════════════════════════════════════════════════════════════════════════
router.get("/doctors", async (req, res) => {
  try {
    const {
      search = "", sp_id, h_id,
      max_price, min_rating = 0,
      limit = 5, offset = 0,
    } = req.query;

    const params = [];
    let where = "WHERE 1=1";

    if (search)    { where += " AND d.dr_name LIKE ?";      params.push(`%${search}%`); }
    if (sp_id)     { where += " AND d.sp_id = ?";           params.push(Number(sp_id)); }
    if (h_id)      { where += " AND d.h_id = ?";            params.push(Number(h_id)); }
    if (max_price) { where += " AND d.dr_price <= ?";       params.push(Number(max_price)); }
    if (min_rating){ where += " AND d.average_rating >= ?"; params.push(Number(min_rating)); }

    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(
      `SELECT d.dr_id, d.dr_name, d.dr_description,
              FORMAT(d.dr_price,0) AS dr_price_fmt, d.dr_price,
              ROUND(d.average_rating,1) AS average_rating, d.total_ratings,
              d.image, h.h_name, h.h_address, s.sp_name
       FROM doctors d
       LEFT JOIN hospitals   h ON d.h_id  = h.h_id
       LEFT JOIN specialties s ON d.sp_id = s.sp_id
       ${where}
       ORDER BY d.average_rating DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM doctors d
       LEFT JOIN hospitals   h ON d.h_id  = h.h_id
       LEFT JOIN specialties s ON d.sp_id = s.sp_id
       ${where}`,
      params.slice(0, -2)
    );

    ok(res, rows, { total, limit: Number(limit), offset: Number(offset) });
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  4. CHI TIẾT BÁC SĨ + LỊCH LÀM VIỆC + ĐÁNH GIÁ MỚI NHẤT
//  GET /api/bot/doctors/:id
// ══════════════════════════════════════════════════════════════════════════════
router.get("/doctors/:id", async (req, res) => {
  try {
    const [[doctor]] = await db.query(
      `SELECT d.dr_id, d.dr_name, d.dr_description, d.dr_price,
              FORMAT(d.dr_price,0) AS dr_price_fmt,
              ROUND(d.average_rating,1) AS average_rating, d.total_ratings,
              d.image, h.h_name, h.h_address, h.h_phone AS hospital_phone,
              s.sp_name
       FROM doctors d
       LEFT JOIN hospitals   h ON d.h_id  = h.h_id
       LEFT JOIN specialties s ON d.sp_id = s.sp_id
       WHERE d.dr_id = ?`,
      [req.params.id]
    );
    if (!doctor) return err(res, "Không tìm thấy bác sĩ", 404);

    // Lịch làm việc
    const [schedules] = await db.query(
      `SELECT time_slot, day_of_week, specific_date, is_recurring
       FROM schedules WHERE dr_id = ? ORDER BY day_of_week, time_slot`,
      [req.params.id]
    );

    // Map day_of_week → tên ngày tiếng Việt
    const DAY_NAMES = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    const schedulesFormatted = schedules.map(s => ({
      ...s,
      day_name: s.day_of_week ? DAY_NAMES[s.day_of_week] : null,
    }));

    // Đánh giá gần nhất
    const [ratings] = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.name_u AS reviewer
       FROM doctor_ratings r
       JOIN users u ON r.id_u = u.id_u
       WHERE r.dr_id = ?
       ORDER BY r.created_at DESC LIMIT 3`,
      [req.params.id]
    );

    ok(res, { ...doctor, schedules: schedulesFormatted, recent_ratings: ratings });
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  5. NGÀY CÓ LỊCH KHÁM CỦA BÁC SĨ (N ngày tới)
//  GET /api/bot/doctors/:id/available-dates?days=14
// ══════════════════════════════════════════════════════════════════════════════
router.get("/doctors/:id/available-dates", async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days || 14), 60);
    const drId = req.params.id;

    const [schedules] = await db.query(
      "SELECT day_of_week, specific_date, is_recurring FROM schedules WHERE dr_id = ?",
      [drId]
    );

    const available = [];
    const DAY_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 1; i <= days; i++) {
      const d    = new Date();
      d.setDate(d.getDate() + i);
      const dow  = d.getDay();                          // 0=Sun…6=Sat
      const dowDB = dow === 0 ? 7 : dow;                // 1=T2…7=CN
      const iso  = d.toISOString().split("T")[0];

      const hasSlot = schedules.some(s => {
        if (s.is_recurring) return s.day_of_week === dowDB;
        const sd = s.specific_date instanceof Date
          ? s.specific_date.toISOString().split("T")[0]
          : String(s.specific_date || "").split("T")[0];
        return sd === iso;
      });

      if (hasSlot) {
        available.push({
          date: iso,
          label: `${DAY_VI[dow]} ${iso.split("-").reverse().join("/")}`,
        });
      }
    }

    ok(res, available);
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  6. DANH SÁCH BỆNH VIỆN
//  GET /api/bot/hospitals?search=&city=&limit=5
// ══════════════════════════════════════════════════════════════════════════════
router.get("/hospitals", async (req, res) => {
  try {
    const { search = "", city = "", limit = 5, offset = 0 } = req.query;
    const params = [];
    let where = "WHERE 1=1";

    if (search) { where += " AND h_name LIKE ?";    params.push(`%${search}%`); }
    if (city)   { where += " AND h_address LIKE ?"; params.push(`%${city}%`); }
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(
      `SELECT h_id, h_name, h_address, h_phone,
              ROUND(average_rating,1) AS average_rating, total_ratings
       FROM hospitals ${where}
       ORDER BY average_rating DESC
       LIMIT ? OFFSET ?`,
      params
    );
    ok(res, rows);
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  7. CHI TIẾT BỆNH VIỆN + CHUYÊN KHOA CÓ TẠI ĐÂY
//  GET /api/bot/hospitals/:id
// ══════════════════════════════════════════════════════════════════════════════
router.get("/hospitals/:id", async (req, res) => {
  try {
    const [[hospital]] = await db.query(
      "SELECT h_id, h_name, h_address, h_phone, h_description, average_rating FROM hospitals WHERE h_id = ?",
      [req.params.id]
    );
    if (!hospital) return err(res, "Không tìm thấy bệnh viện", 404);

    const [specialties] = await db.query(
      `SELECT DISTINCT s.sp_id, s.sp_name
       FROM doctors d
       JOIN specialties s ON d.sp_id = s.sp_id
       WHERE d.h_id = ?`,
      [req.params.id]
    );

    ok(res, { ...hospital, specialties });
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  8. KIỂM TRA SLOT TRƯỚC KHI ĐẶT LỊCH
//  GET /api/bot/appointments/check-slot?dr_id=1&date=2025-08-20
// ══════════════════════════════════════════════════════════════════════════════
router.get("/appointments/check-slot", async (req, res) => {
  try {
    const { dr_id, date } = req.query;
    if (!dr_id || !date) return err(res, "Thiếu dr_id hoặc date");

    const [[queue]] = await db.query(
      "SELECT current_number FROM doctor_queue WHERE dr_id = ? AND queue_date = ?",
      [dr_id, date]
    );

    const [[{ booked }]] = await db.query(
      `SELECT COUNT(*) AS booked FROM appointments
       WHERE dr_id = ? AND appointment_date = ?
       AND status NOT IN ('cancelled','rejected')`,
      [dr_id, date]
    );

    // Lấy thông tin bác sĩ để hiển thị
    const [[doctor]] = await db.query(
      "SELECT dr_name, dr_price FROM doctors WHERE dr_id = ?",
      [dr_id]
    );

    ok(res, {
      dr_id:        Number(dr_id),
      dr_name:      doctor?.dr_name,
      date,
      booked_slots: booked,
      next_number:  (queue?.current_number || 0) + 1,
      available:    true,
    });
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  9. ĐẶT LỊCH HẸN MỚI
//  POST /api/bot/appointments
//  Body: { dr_id, appointment_date, reason, patient_name, phone, email?,
//          gender?, dob?, id_u? }
// ══════════════════════════════════════════════════════════════════════════════
router.post("/appointments", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      id_u = null,
      dr_id, appointment_date, reason = "",
      patient_name, phone,
      email = "", gender = "", dob = null,
    } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!dr_id)             return err(res, "Thiếu dr_id");
    if (!appointment_date)  return err(res, "Thiếu appointment_date (YYYY-MM-DD)");
    if (!patient_name)      return err(res, "Thiếu patient_name");
    if (!phone)             return err(res, "Thiếu phone");

    // Không cho đặt ngày trong quá khứ
    if (new Date(appointment_date) < new Date(new Date().toDateString()))
      return err(res, "Không thể đặt lịch cho ngày đã qua");

    await conn.beginTransaction();

    // ── 1. Tạo hoặc tái sử dụng patient_profile ───────────────────────────────
    let patientId;
    const [[existing]] = await conn.query(
      `SELECT id_patient FROM patient_profiles
       WHERE phone = ? AND p_name = ?
       LIMIT 1`,
      [phone, patient_name]
    );
    patientId = existing?.id_patient;

    if (!patientId) {
      const [ins] = await conn.query(
        `INSERT INTO patient_profiles (id_u, p_name, gender, phone, email, dob)
         VALUES (?,?,?,?,?,?)`,
        [id_u, patient_name, gender, phone, email, dob]
      );
      patientId = ins.insertId;
    }

    // ── 2. Cấp số thứ tự (upsert doctor_queue) ────────────────────────────────
    await conn.query(
      `INSERT INTO doctor_queue (dr_id, queue_date, current_number) VALUES (?,?,1)
       ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
      [dr_id, appointment_date]
    );
    const [[{ current_number }]] = await conn.query(
      "SELECT current_number FROM doctor_queue WHERE dr_id = ? AND queue_date = ?",
      [dr_id, appointment_date]
    );

    // ── 3. Tạo appointment ────────────────────────────────────────────────────
    const [appt] = await conn.query(
      `INSERT INTO appointments
         (id_patient, dr_id, reason, appointment_date, queue_number, status)
       VALUES (?,?,?,?,?,'pending')`,
      [patientId, dr_id, reason, appointment_date, current_number]
    );

    // ── 4. Lấy thông tin để trả về chatbot ───────────────────────────────────
    const [[detail]] = await conn.query(
      `SELECT d.dr_name, h.h_name, h.h_address, s.sp_name
       FROM doctors d
       LEFT JOIN hospitals   h ON d.h_id  = h.h_id
       LEFT JOIN specialties s ON d.sp_id = s.sp_id
       WHERE d.dr_id = ?`,
      [dr_id]
    );

    await conn.commit();

    ok(
      res,
      {
        id_appointment:   appt.insertId,
        queue_number:     current_number,
        patient_name,
        phone,
        appointment_date,
        dr_name:          detail?.dr_name,
        hospital_name:    detail?.h_name,
        hospital_address: detail?.h_address,
        specialty:        detail?.sp_name,
        status:           "pending",
      },
      { message: `✅ Đặt lịch thành công! Số thứ tự của bạn là ${current_number}.` }
    );
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY")
      return err(res, "Số thứ tự này vừa bị trùng, vui lòng thử lại.");
    err(res, e.message, 500);
  } finally {
    conn.release();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  10. TRA CỨU LỊCH HẸN THEO SĐT
//  GET /api/bot/appointments/lookup?phone=0901234567
// ══════════════════════════════════════════════════════════════════════════════
router.get("/appointments/lookup", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return err(res, "Thiếu phone");

    const [rows] = await db.query(
      `SELECT a.id_appointment, a.appointment_date, a.queue_number, a.status,
              a.reason, p.p_name AS patient_name,
              d.dr_name, h.h_name AS hospital_name, s.sp_name,
              FORMAT(d.dr_price,0) AS dr_price_fmt
       FROM appointments a
       JOIN patient_profiles p ON a.id_patient = p.id_patient
       JOIN doctors d          ON a.dr_id = d.dr_id
       LEFT JOIN hospitals   h ON d.h_id  = h.h_id
       LEFT JOIN specialties s ON d.sp_id = s.sp_id
       WHERE p.phone = ?
       ORDER BY a.appointment_date DESC LIMIT 10`,
      [phone]
    );

    if (rows.length === 0)
      return ok(res, [], { message: "Không tìm thấy lịch hẹn nào với số điện thoại này." });

    ok(res, rows, { total: rows.length });
  } catch (e) { err(res, e.message, 500); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  11. HỦY LỊCH HẸN
//  PATCH /api/bot/appointments/:id/cancel
//  Body: { phone }  ← xác minh chủ nhân trước khi hủy
// ══════════════════════════════════════════════════════════════════════════════
router.patch("/appointments/:id/cancel", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return err(res, "Cần cung cấp số điện thoại để xác minh");

    // Xác minh phone khớp với lịch hẹn
    const [[appt]] = await db.query(
      `SELECT a.id_appointment, a.status, p.phone
       FROM appointments a
       JOIN patient_profiles p ON a.id_patient = p.id_patient
       WHERE a.id_appointment = ?`,
      [req.params.id]
    );

    if (!appt)          return err(res, "Không tìm thấy lịch hẹn", 404);
    if (appt.phone !== phone)
      return err(res, "Số điện thoại không khớp với lịch hẹn này", 403);
    if (!["pending", "approved"].includes(appt.status))
      return err(res, `Không thể hủy lịch đang ở trạng thái: ${appt.status}`);

    await db.query(
      "UPDATE appointments SET status='cancelled' WHERE id_appointment = ?",
      [req.params.id]
    );

    ok(res, { id_appointment: Number(req.params.id), status: "cancelled" },
      { message: "Đã hủy lịch hẹn thành công." });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;