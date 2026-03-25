const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Middleware xác thực (optional cho một số routes)
router.use(authMiddleware.optionalAuth);

/**
 * @swagger
 * /api/feedback/diagnosis:
 *   post:
 *     summary: Lưu feedback về chẩn đoán
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptoms
 *               - suggestedSpecialties
 *               - accuracy
 *             properties:
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách triệu chứng
 *               suggestedSpecialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Chuyên khoa được đề xuất
 *               actualSpecialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Chuyên khoa thực tế (tùy chọn)
 *               accuracy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Độ chính xác (1-5)
 *     responses:
 *       200:
 *         description: Feedback đã được lưu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/diagnosis", feedbackController.saveDiagnosisFeedback);

/**
 * @swagger
 * /api/feedback/doctor:
 *   post:
 *     summary: Lưu feedback về bác sĩ
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - suggestedDoctors
 *               - selectedDoctor
 *               - satisfaction
 *             properties:
 *               suggestedDoctors:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Danh sách bác sĩ được đề xuất
 *               selectedDoctor:
 *                 type: string
 *                 description: Bác sĩ được chọn
 *               satisfaction:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Mức độ hài lòng (1-5)
 *     responses:
 *       200:
 *         description: Feedback đã được lưu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/doctor", feedbackController.saveDoctorFeedback);

/**
 * @swagger
 * /api/feedback/search:
 *   post:
 *     summary: Lưu lịch sử tìm kiếm
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - results
 *             properties:
 *               query:
 *                 type: string
 *                 description: Từ khóa tìm kiếm
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Kết quả tìm kiếm
 *     responses:
 *       200:
 *         description: Lịch sử tìm kiếm đã được lưu
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/search", feedbackController.saveSearchQuery);

/**
 * @swagger
 * /api/feedback/analysis:
 *   get:
 *     summary: Phân tích feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Phân tích feedback thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysis:
 *                       type: object
 *                       description: Phân tích chi tiết
 *                     stats:
 *                       type: object
 *                       description: Thống kê tổng quan
 *       500:
 *         description: Lỗi server
 */
router.get("/analysis", feedbackController.getFeedbackAnalysis);

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: Lấy thống kê feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSymptomFeedbacks:
 *                       type: integer
 *                     totalSpecialtyFeedbacks:
 *                       type: integer
 *                     totalDoctorFeedbacks:
 *                       type: integer
 *                     totalSearchQueries:
 *                       type: integer
 *                     uniqueSymptoms:
 *                       type: integer
 *                     uniqueSpecialties:
 *                       type: integer
 *                     uniqueDoctors:
 *                       type: integer
 *       500:
 *         description: Lỗi server
 */
router.get("/stats", feedbackController.getFeedbackStats);

/**
 * @swagger
 * /api/feedback/doctor-rating:
 *   post:
 *     summary: Đánh giá bác sĩ
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - rating
 *               - comment
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: ID bác sĩ
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Đánh giá (1-5 sao)
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 description: Bình luận (ít nhất 10 ký tự)
 *     responses:
 *       200:
 *         description: Đánh giá đã được lưu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/doctor-rating", feedbackController.saveDoctorRating);

/**
 * @swagger
 * /api/feedback/hospital-rating:
 *   post:
 *     summary: Đánh giá bệnh viện
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalId
 *               - rating
 *               - comment
 *             properties:
 *               hospitalId:
 *                 type: string
 *                 description: ID bệnh viện
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Đánh giá (1-5 sao)
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 description: Bình luận (ít nhất 10 ký tự)
 *     responses:
 *       200:
 *         description: Đánh giá đã được lưu thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/hospital-rating", feedbackController.saveHospitalRating);

/**
 * @swagger
 * /api/feedback/doctor/{doctorId}:
 *   get:
 *     summary: Lấy danh sách đánh giá của bác sĩ
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     averageRating:
 *                       type: number
 *       500:
 *         description: Lỗi server
 */
router.get("/doctor/:doctorId", feedbackController.getDoctorFeedbacks);

/**
 * @swagger
 * /api/feedback/hospital/{hospitalId}:
 *   get:
 *     summary: Lấy danh sách đánh giá của bệnh viện
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh viện
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đánh giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     averageRating:
 *                       type: number
 *       500:
 *         description: Lỗi server
 */
router.get("/hospital/:hospitalId", feedbackController.getHospitalFeedbacks);

// 🟩 Cập nhật đánh giá bác sĩ
router.put("/doctor-rating/:id_fb", feedbackController.updateDoctorRating);

// 🟥 Xóa đánh giá bác sĩ
router.delete("/doctor-rating/:id_fb", feedbackController.deleteDoctorRating);

// 🟩 Cập nhật đánh giá bệnh viện  
router.put("/hospital-rating/:id_fb_hos", feedbackController.updateHospitalRating);

// 🟥 Xóa đánh giá bệnh viện
router.delete("/hospital-rating/:id_fb_hos", feedbackController.deleteHospitalRating);

// Alias routes for backward compatibility / external clients
// Note: These aliases do not replace the canonical routes above.
// 1) Legacy: /api/feedback/doctors (ambiguous) -> guide to use /doctor/:doctorId
router.get("/doctors", (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Vui lòng dùng GET /api/feedback/doctor/:doctorId để lấy đánh giá theo bác sĩ.",
  });
});

// 2) Legacy: /api/feedback/doctor-ratings
//    - POST: alias tới /doctor-rating (tạo đánh giá)
//    - Others: trả lời hướng dẫn sử dụng
router.post("/doctor-ratings", feedbackController.saveDoctorRating);
router.all("/doctor-ratings", (req, res) => {
  if (req.method === "POST") return; // đã xử lý ở trên
  return res.status(400).json({
    success: false,
    message:
      "Để tạo đánh giá dùng POST /api/feedback/doctor-rating. Để xem danh sách, dùng GET /api/feedback/doctor/:doctorId.",
  });
});

module.exports = router;
