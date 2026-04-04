const feedbackService = require("../services/feedback.service");
const bcrypt = require('bcrypt');

/**
 * Lấy danh sách tất cả feedback cho admin
 * GET /api/admin/feedbacks
 */
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, rating, search } = req.query;
    
    const data = await feedbackService.getAllFeedbacksForAdmin({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      rating,
      search
    });

    res.json({ feedbacks: data.feedbacks, pagination: data.pagination });
  } catch (error) {
    console.error("❌ Get all feedbacks error:", error);
    res.status(500).json({
      error: "Không thể lấy danh sách đánh giá. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lấy thống kê feedback cho admin
 * GET /api/admin/feedback-stats
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = await feedbackService.getAdminFeedbackStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("❌ Get feedback stats error:", error);
    res.status(500).json({
      error: "Không thể lấy thống kê. Vui lòng thử lại sau.",
    });
  }
};

// GET /api/admin/feedback-averages
exports.getFeedbackAverages = async (req, res) => {
  try {
    const db = require('../config/db');
    const [doctorRows] = await db.execute(
      `SELECT 
         d.dr_id AS id,
         d.dr_name AS name,
         sp.sp_name AS specialty,
         AVG(dr.rating) AS average_rating,
         COUNT(*) AS total_ratings
       FROM doctor_ratings dr
       JOIN doctors d ON dr.dr_id = d.dr_id
       LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
       GROUP BY d.dr_id
       ORDER BY average_rating ASC`
    );

    const [hospitalRows] = await db.execute(
      `SELECT 
         h.h_id AS id,
         h.h_name AS name,
         AVG(hr.rating) AS average_rating,
         COUNT(*) AS total_ratings
       FROM hospital_ratings hr
       JOIN hospitals h ON hr.h_id = h.h_id
       GROUP BY h.h_id
       ORDER BY average_rating ASC`
    );

    res.json({ success: true, data: { doctors: doctorRows, hospitals: hospitalRows } });
  } catch (error) {
    console.error('❌ getFeedbackAverages error:', error);
    res.status(500).json({ error: 'Không thể lấy điểm trung bình đánh giá' });
  }
};

/**
 * Xóa đánh giá bác sĩ
 * DELETE /api/admin/doctor-ratings/:id
 */
exports.deleteDoctorRating = async (req, res) => {
  try {
    const { id } = req.params;
    
    await feedbackService.deleteDoctorRating(id);

    res.json({
      success: true,
      message: "Đánh giá bác sĩ đã được xóa thành công"
    });
  } catch (error) {
    console.error("❌ Delete doctor rating error:", error);
    res.status(500).json({
      error: "Không thể xóa đánh giá. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Xóa đánh giá bệnh viện
 * DELETE /api/admin/hospital-ratings/:id
 */
exports.deleteHospitalRating = async (req, res) => {
  try {
    const { id } = req.params;
    
    await feedbackService.deleteHospitalRating(id);

    res.json({
      success: true,
      message: "Đánh giá bệnh viện đã được xóa thành công"
    });
  } catch (error) {
    console.error("❌ Delete hospital rating error:", error);
    res.status(500).json({
      error: "Không thể xóa đánh giá. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Xuất danh sách feedback ra Excel
 * GET /api/admin/feedbacks/export
 */
exports.exportFeedbacks = async (req, res) => {
  try {
    const { type, rating, search } = req.query;
    
    const feedbacks = await feedbackService.getAllFeedbacksForAdmin({
      page: 1,
      limit: 10000, // Get all for export
      type,
      rating: rating ? parseInt(rating) : undefined,
      search
    });

    // Create Excel file (simplified - in production use a proper Excel library)
    const csvContent = createCSVContent(feedbacks.feedbacks);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error("❌ Export feedbacks error:", error);
    res.status(500).json({
      error: "Không thể xuất file. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Tạo nội dung CSV từ danh sách feedback
 */
function createCSVContent(feedbacks) {
  const headers = [
    'ID',
    'Loại',
    'Tên',
    'Đánh giá',
    'Bình luận',
    'Người đánh giá',
    'Email',
    'Ngày tạo'
  ];
  
  const rows = feedbacks.map(feedback => [
    feedback.id,
    feedback.type === 'doctor' ? 'Bác sĩ' : 'Bệnh viện',
    feedback.name,
    feedback.rating,
    `"${feedback.comment.replace(/"/g, '""')}"`, // Escape quotes
    feedback.user_name || 'Ẩn danh',
    feedback.user_email || '',
    new Date(feedback.created_at).toLocaleString('vi-VN')
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  return '\uFEFF' + csvContent; // Add BOM for UTF-8
}

exports.getOverviewStats = async (req, res) => {
  try {
    const db = require('../config/db');
    const [[{ totalAppointments }]] = await db.query(
      "SELECT COUNT(*) AS totalAppointments FROM appointments"
    );
    const [[{ approvedAppointments }]] = await db.query(
      "SELECT COUNT(*) AS approvedAppointments FROM appointments WHERE status = 'approved'"
    );
    const [[{ rejectedAppointments }]] = await db.query(
      "SELECT COUNT(*) AS rejectedAppointments FROM appointments WHERE status = 'rejected'"
    );
    const [[{ totalDoctors }]] = await db.query(
      "SELECT COUNT(*) AS totalDoctors FROM doctors"
    );
    const [[{ totalHospitals }]] = await db.query(
      "SELECT COUNT(*) AS totalHospitals FROM hospitals"
    );
    // Tổng doanh thu dựa trên cuộc hẹn đã duyệt và giá khám của bác sĩ
    const [[{ totalRevenue }]] = await db.query(
        `SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED)), 0) AS totalRevenue
         FROM appointments a
         JOIN doctors d ON a.dr_id = d.dr_id
         WHERE a.status = 'approved'`
      );

    res.json({
      totalAppointments,
      approvedAppointments,
      rejectedAppointments,
      doctors: totalDoctors,
      hospitals: totalHospitals,
      totalRevenue
    });
  } catch (error) {
    console.error('❌ Get overview stats error:', error);
    res.status(500).json({ error: 'Không thể lấy số liệu tổng quan.' });
  }
};

/**
 * Lấy thống kê doanh thu theo bác sĩ hoặc bệnh viện
 * GET /api/admin/revenue?mode=doctor|hospital
 */
exports.getRevenueBreakdown = async (req, res) => {
  try {
    const db = require('../config/db');
    const { mode = 'doctor', date_from, date_to } = req.query;

    const where = ["a.status = 'approved'"];
    const params = [];
    if (date_from) { where.push('a.appointment_date >= ?'); params.push(date_from); }
    if (date_to) { where.push('a.appointment_date <= ?'); params.push(date_to); }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    if (mode === 'hospital') {
      const [rows] = await db.query(
          `SELECT 
             h.h_id AS id,
             COALESCE(h.h_name, 'Chưa gán bệnh viện') AS name,
             COALESCE(SUM(CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED)), 0) AS revenue,
             COUNT(a.id_appointment) AS approvedCount
           FROM appointments a
           JOIN doctors d ON a.dr_id = d.dr_id
           LEFT JOIN hospitals h ON d.h_id = h.h_id
           ${whereSql}
           GROUP BY h.h_id, h.h_name
           ORDER BY revenue DESC`,
          params
        );
      return res.json({ mode, items: rows });
    }

    // default: doctor
    const [rows] = await db.query(
        `SELECT 
           d.dr_id AS id,
           d.dr_name AS name,
           COALESCE(SUM(CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED)), 0) AS revenue,
           COUNT(a.id_appointment) AS approvedCount
         FROM appointments a
         JOIN doctors d ON a.dr_id = d.dr_id
         ${whereSql}
         GROUP BY d.dr_id, d.dr_name
         ORDER BY revenue DESC`,
        params
      );
    return res.json({ mode: 'doctor', items: rows });
  } catch (error) {
    console.error('❌ Get revenue breakdown error:', error);
    res.status(500).json({ error: 'Không thể lấy thống kê doanh thu.' });
  }
};

/**
 * Chi tiết doanh thu theo bác sĩ hoặc bệnh viện (danh sách lịch đã duyệt)
 * GET /api/admin/revenue/details?mode=doctor|hospital&id=...&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=1&limit=20
 */
exports.getMonthlyTrends = async (req, res) => {
  try {
    const db = require('../config/db');

    // Build last 12 months list (YYYY-MM)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }

    const startDate = months[0] + '-01';

    // Get totals per month
    const [appointmentRows] = await db.query(
      `SELECT DATE_FORMAT(a.appointment_date, '%Y-%m') AS ym,
              COUNT(*) AS total,
              SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM appointments a
       WHERE a.appointment_date >= ?
       GROUP BY ym
       ORDER BY ym ASC`,
      [startDate]
    );

    // Get revenue per month (approved only)
    const [revenueRows] = await db.query(
      `SELECT DATE_FORMAT(a.appointment_date, '%Y-%m') AS ym,
              COALESCE(SUM(CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED)), 0) AS revenue
       FROM appointments a
       JOIN doctors d ON a.dr_id = d.dr_id
       WHERE a.status = 'approved' AND a.appointment_date >= ?
       GROUP BY ym
       ORDER BY ym ASC`,
      [startDate]
    );

    const byMonth = Object.fromEntries(months.map(m => [m, { month: m, total: 0, approved: 0, rejected: 0, revenue: 0 }]));

    for (const r of appointmentRows) {
      if (byMonth[r.ym]) {
        byMonth[r.ym].total = Number(r.total) || 0;
        byMonth[r.ym].approved = Number(r.approved) || 0;
        byMonth[r.ym].rejected = Number(r.rejected) || 0;
      }
    }
    for (const r of revenueRows) {
      if (byMonth[r.ym]) {
        byMonth[r.ym].revenue = Number(r.revenue) || 0;
      }
    }

    const items = months.map(m => byMonth[m]);

    // Calculate growth compared to previous month (for revenue and appointments)
    function calcGrowth(current, prev) {
      if (!prev) return 0;
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    }
    const last = items[items.length - 1];
    const prev = items[items.length - 2];

    res.json({
      months,
      items,
      summary: {
        latestAppointments: last?.total || 0,
        latestRevenue: last?.revenue || 0,
        appointmentGrowth: calcGrowth(last?.total || 0, prev?.total || 0),
        revenueGrowth: calcGrowth(last?.revenue || 0, prev?.revenue || 0)
      }
    });
  } catch (error) {
    console.error('❌ Get monthly trends error:', error);
    res.status(500).json({ error: 'Không thể lấy xu hướng theo tháng.' });
  }
};

exports.getRevenueDetails = async (req, res) => {
  try {
    const db = require('../config/db');
    const { mode = 'doctor', id, date_from, date_to, page = 1, limit = 20 } = req.query;
    if (!id) return res.status(400).json({ error: 'Thiếu tham số id' });
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = ["a.status = 'approved'"];
    const params = [];
    if (date_from) { where.push('a.appointment_date >= ?'); params.push(date_from); }
    if (date_to) { where.push('a.appointment_date <= ?'); params.push(date_to); }

    let baseJoin = 'JOIN doctors d ON a.dr_id = d.dr_id LEFT JOIN hospitals h ON d.h_id = h.h_id LEFT JOIN patient_profiles pp ON a.id_patient = pp.id_patient';
    if (mode === 'doctor') {
      where.push('d.dr_id = ?'); params.push(id);
    } else {
      where.push('h.h_id = ?'); params.push(id);
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const listSql = `
      SELECT 
        a.id_appointment,
        a.id_patient,
        pp.p_name,
        pp.phone,
        pp.email,
        a.appointment_date,
        a.time_slot,
        a.reason,
        d.dr_id,
        d.dr_name,
        d.dr_price,
        CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED) AS numeric_dr_price,
        d.h_id,
        h.h_name
      FROM appointments a
      ${baseJoin}
      ${whereSql}
      ORDER BY a.appointment_date DESC, a.time_slot DESC
      LIMIT ? OFFSET ?`;
    const listParams = [...params, parseInt(limit), offset];

    const countSql = `
      SELECT COUNT(*) AS total
      FROM appointments a
      ${baseJoin}
      ${whereSql}`;

    const revenueSql = `
      SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(d.dr_price, '.', ''), ',', '') AS UNSIGNED)), 0) AS revenue
      FROM appointments a
      ${baseJoin}
      ${whereSql}`;

    const [rows] = await db.query(listSql, listParams);
    const [[{ total }]] = await db.query(countSql, params);
    const [[{ revenue }]] = await db.query(revenueSql, params);

    res.json({
      mode,
      id,
      revenue,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      items: rows
    });
  } catch (error) {
    console.error('❌ Get revenue details error:', error);
    res.status(500).json({ error: 'Không thể lấy chi tiết doanh thu.' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const db = require('../config/db');
    const { page = 1, limit = 20, role = 'all', search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = [];
    const params = [];
    if (role !== 'all') {
      where.push('role = ?');
      params.push(role);
    }
    if (search) {
      where.push('(name_u LIKE ? OR email_u LIKE ? OR sdt_u LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.execute(
      `SELECT u.id_u, u.name_u, u.email_u, u.sdt_u, u.role, d.dr_id\n       FROM users u\n       LEFT JOIN doctors d ON d.id_u = u.id_u\n       ${whereSql} ORDER BY u.id_u DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);

    res.json({ users: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    console.error('❌ listUsers error:', e);
    res.status(500).json({ error: 'Không thể lấy danh sách người dùng' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const db = require('../config/db');
    const { name_u, email_u, sdt_u, password_u, role = 'user', dr_id } = req.body || {};
    if (!email_u || !password_u) {
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }
    const hashed = await bcrypt.hash(password_u, 10);
    const [result] = await db.execute(
        'INSERT INTO users (name_u, email_u, sdt_u, password_u, role) VALUES (?, ?, ?, ?, ?)',
        [name_u || null, email_u, sdt_u || null, hashed, role]
      );

    // Nếu tạo user role doctor và có dr_id, liên kết id_u vào bảng doctors
    if (role === 'doctor' && dr_id) {
      const userId = result.insertId;
      // Clear liên kết cũ nếu có (tránh 1 user gắn nhiều bác sĩ)
      await db.execute('UPDATE doctors SET id_u = NULL WHERE id_u = ?', [userId]);
      // Gắn bác sĩ được chọn với user mới tạo
      await db.execute('UPDATE doctors SET id_u = ? WHERE dr_id = ?', [userId, dr_id]);
    }

    res.status(201).json({ success: true, id_u: (result && result.insertId) || null });
  } catch (e) {
    console.error('❌ createUser error:', e);
    res.status(500).json({ error: 'Không thể tạo người dùng' });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const { name_u, email_u, sdt_u, role, password_u, birth_u, gender_u, city_u, distr_u, ward_u } = req.body || {};
    const fields = [];
    const values = [];
    if (name_u !== undefined) { fields.push('name_u = ?'); values.push(name_u); }
    if (email_u !== undefined) { fields.push('email_u = ?'); values.push(email_u); }
    if (sdt_u !== undefined) { fields.push('sdt_u = ?'); values.push(sdt_u); }
    if (birth_u !== undefined) { fields.push('birth_u = ?'); values.push(birth_u); }
    if (gender_u !== undefined) { fields.push('gender_u = ?'); values.push(gender_u); }
    if (city_u !== undefined) { fields.push('city_u = ?'); values.push(city_u); }
    if (distr_u !== undefined) { fields.push('distr_u = ?'); values.push(distr_u); }
    if (ward_u !== undefined) { fields.push('ward_u = ?'); values.push(ward_u); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (password_u) { const hashed = await bcrypt.hash(password_u, 10); fields.push('password_u = ?'); values.push(hashed); }
    if (!fields.length) return res.json({ success: true, updated: 0 });
    values.push(id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id_u = ?`, values);

    // Đồng bộ liên kết bác sĩ nếu role doctor và có dr_id trong body
    const { dr_id } = req.body || {};
    if (role === 'doctor') {
      if (dr_id) {
        // Clear mọi liên kết cũ của user này và gán dr_id mới
        await db.execute('UPDATE doctors SET id_u = NULL WHERE id_u = ?', [id]);
        await db.execute('UPDATE doctors SET id_u = ? WHERE dr_id = ?', [id, dr_id]);
      } else {
        // Nếu bỏ chọn bác sĩ, clear liên kết
        await db.execute('UPDATE doctors SET id_u = NULL WHERE id_u = ?', [id]);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error('❌ updateUserByAdmin error:', e);
    res.status(500).json({ error: 'Không thể cập nhật người dùng' });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    await db.execute('DELETE FROM users WHERE id_u = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ deleteUserByAdmin error:', e);
    res.status(500).json({ error: 'Không thể xóa người dùng' });
  }
};

/**
 * GET /api/admin/geo/hospitals/status
 * Thống kê tiến độ geocode toạ độ bệnh viện
 */
async function ensureHospitalLatLngColumns(db) {
  // Try to ensure columns exist; if after attempts they are still missing, throw to caller
  // so caller can decide to fallback or return clear error.
  const check = async () => {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hospitals' 
       AND COLUMN_NAME IN ('h_lat','h_lng')`
    );
    const hasLat = cols.some(c => c.COLUMN_NAME === 'h_lat');
    const hasLng = cols.some(c => c.COLUMN_NAME === 'h_lng');
    return { hasLat, hasLng };
  };

  let { hasLat, hasLng } = await check();
  try {
    if (!hasLat) {
      await db.execute("ALTER TABLE hospitals ADD COLUMN h_lat DECIMAL(10,7) NULL");
    }
    if (!hasLng) {
      await db.execute("ALTER TABLE hospitals ADD COLUMN h_lng DECIMAL(10,7) NULL");
    }
  } catch (e) {
    // Continue to re-check after attempting ALTER
    console.warn('ensureHospitalLatLngColumns warning:', e && e.message || e);
  }
  ({ hasLat, hasLng } = await check());
  if (!hasLat || !hasLng) {
    throw new Error("Database is missing columns h_lat/h_lng and cannot ALTER TABLE. Please run backend/sql/add_hospital_lat_lng.sql with sufficient privileges.");
  }
}

exports.getGeocodeProgress = async (req, res) => {
  try {
    const db = require('../config/db');
    await ensureHospitalLatLngColumns(db);
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM hospitals');
    const [[{ withLatLng }]] = await db.query('SELECT COUNT(*) AS withLatLng FROM hospitals WHERE h_lat IS NOT NULL AND h_lng IS NOT NULL');
    const [[{ withoutLatLng }]] = await db.query('SELECT COUNT(*) AS withoutLatLng FROM hospitals WHERE h_lat IS NULL OR h_lng IS NULL');
    const [sample] = await db.query('SELECT h_id, h_name, h_address FROM hospitals WHERE h_lat IS NULL OR h_lng IS NULL LIMIT 10');
    res.json({ success: true, data: { total, withLatLng, withoutLatLng, sample } });
  } catch (e) {
    console.error('❌ getGeocodeProgress error:', e);
    res.status(500).json({ success: false, error: 'Không thể lấy tiến độ geocode' });
  }
};

/**
 * POST /api/admin/geo/hospitals/backfill?limit=50
 * Geocode và cập nhật h_lat/h_lng cho các bệnh viện chưa có toạ độ (batch)
 */
exports.backfillHospitalsGeocode = async (req, res) => {
  try {
    const db = require('../config/db');
    const geo = require('../services/geoLocationService.service');
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const allowFallback = String(req.query.fallback || 'true') !== 'false';
    await ensureHospitalLatLngColumns(db);
    const [rows] = await db.execute(
      'SELECT h_id, h_name, h_address FROM hospitals WHERE h_lat IS NULL OR h_lng IS NULL LIMIT ?',
      [limit]
    );
    let updated = 0, failed = 0;
    const details = [];
    const cityHints = [
      'Hồ Chí Minh','TP HCM','TP.HCM','HCM','Sài Gòn','Sai Gon',
      'Hà Nội','Ha Noi','HN',
      'Cần Thơ','Can Tho','CT'
    ];
    function cleanAddress(s) {
      if (!s) return '';
      return s
        .replace(/\([^\)]*\)/g, ' ') // remove parenthesis content
        .replace(/Địa chỉ cũ:[^,]+/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    for (const h of rows) {
      let reason = '';
      try {
        const raw = (h.h_address || '').trim();
        const addr = cleanAddress(raw);
        let lat = null, lng = null, method = null;
        if (addr) {
          const g = await geo.geocodeAddress(addr);
          if (g && g.lat && g.lng) {
            lat = Number(g.lat); lng = Number(g.lng); method = 'geocode';
          }
        }
        // Fallback: try local city/province lookup from address or hospital name
        if (!lat && allowFallback) {
          const probe = addr || h.h_name;
          const local = geo.getLocalCityCoordinates(probe);
          if (local) {
            lat = Number(local.lat); lng = Number(local.lng); method = 'local_fallback';
          }
        }
        if (lat && lng) {
          await db.execute('UPDATE hospitals SET h_lat = ?, h_lng = ? WHERE h_id = ?', [lat, lng, h.h_id]);
          updated++;
          details.push({ h_id: h.h_id, method, ok: true });
          // nhẹ nhàng với Nominatim khi dùng geocode
          if (method === 'geocode') {
            await new Promise(r => setTimeout(r, Number(process.env.GEO_BACKFILL_DELAY_MS || 800)));
          }
        } else {
          failed++; reason = 'no_result';
          details.push({ h_id: h.h_id, ok: false, reason });
        }
      } catch (e) {
        failed++; reason = e && e.message || 'error';
        details.push({ h_id: h.h_id, ok: false, reason });
      }
    }
    res.json({ success: true, processed: rows.length, updated, failed, details });
  } catch (e) {
    console.error('❌ backfillHospitalsGeocode error:', e);
    res.status(500).json({ success: false, error: 'Không thể backfill geocode', message: e && e.message });
  }
};







