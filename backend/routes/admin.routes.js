const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Middleware xác thực admin
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.requireAdmin);

/**
 * @swagger
 * /api/admin/feedbacks:
 *   get:
 *     summary: Lấy danh sách tất cả feedback cho admin
 *     tags: [Admin]
 *     parameters:
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
 *           default: 20
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, doctor, hospital]
 *         description: Loại đánh giá
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Đánh giá (1-5 sao)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc bình luận
 *     responses:
 *       200:
 *         description: Lấy danh sách feedback thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/feedbacks", adminController.getAllFeedbacks);

/**
 * @swagger
 * /api/admin/feedback-stats:
 *   get:
 *     summary: Lấy thống kê feedback cho admin
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/feedback-stats", adminController.getFeedbackStats);
router.get("/feedback-averages", adminController.getFeedbackAverages);

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Lấy thống kê tổng quan cho admin
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/overview", adminController.getOverviewStats);
router.get("/revenue", adminController.getRevenueBreakdown);
router.get("/revenue/details", adminController.getRevenueDetails);
router.get("/monthly-trends", adminController.getMonthlyTrends);

/**
 * @swagger
 * /api/admin/doctor-ratings/{id}:
 *   delete:
 *     summary: Xóa đánh giá bác sĩ
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá bác sĩ
 *     responses:
 *       200:
 *         description: Xóa đánh giá thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đánh giá
 *       500:
 *         description: Lỗi server
 */
router.delete("/doctor-ratings/:id", adminController.deleteDoctorRating);

/**
 * @swagger
 * /api/admin/hospital-ratings/{id}:
 *   delete:
 *     summary: Xóa đánh giá bệnh viện
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đánh giá bệnh viện
 *     responses:
 *       200:
 *         description: Xóa đánh giá thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đánh giá
 *       500:
 *         description: Lỗi server
 */
router.delete("/hospital-ratings/:id", adminController.deleteHospitalRating);

/**
 * @swagger
 * /api/admin/feedbacks/export:
 *   get:
 *     summary: Xuất danh sách feedback ra Excel
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, doctor, hospital]
 *         description: Loại đánh giá
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Đánh giá (1-5 sao)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc bình luận
 *     responses:
 *       200:
 *         description: Xuất file thành công
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/feedbacks/export", adminController.exportFeedbacks);

// User management
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUserByAdmin);
router.delete('/users/:id', adminController.deleteUserByAdmin);

/**
 * @swagger
 * /api/admin/geo/hospitals/status:
 *   get:
 *     summary: Xem tiến độ geocode toạ độ bệnh viện
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Thống kê geocode
 */
router.get('/geo/hospitals/status', adminController.getGeocodeProgress);

/**
 * @swagger
 * /api/admin/geo/hospitals/backfill:
 *   post:
 *     summary: Chạy backfill geocode cho các bệnh viện chưa có toạ độ
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số bản ghi tối đa xử lý trong 1 lần gọi
 *     responses:
 *       200:
 *         description: Kết quả backfill
 */
router.post('/geo/hospitals/backfill', adminController.backfillHospitalsGeocode);

module.exports = router;
