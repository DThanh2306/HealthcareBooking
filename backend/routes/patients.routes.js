// routes/patients.routes.js
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patients.controller");

const { verifyToken } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: API đặt lịch khám bệnh
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Lấy danh sách lịch hẹn có phân trang và lọc
 *     tags: [Patients]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - name: appointment_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách lịch khám
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.get("/patients", patientController.getAllPatients);

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Tạo lịch hẹn mới
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dr_id, p_name, gender, phone, email, appointment_date]
 *             properties:
 *               dr_id:
 *                 type: integer
 *               p_name:
 *                 type: string
 *               gender:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               tinh:
 *                 type: string
 *               quan:
 *                 type: string
 *               xa:
 *                 type: string
 *               to_thon:
 *                 type: string
 *               reason:
 *                 type: string
 *               appointment_date:
 *                 type: string
 *                 format: date
 *               time_slot:
 *                 type: string
 *                 example: "08:00 - 09:00"
 *                 description: Khung giờ khám, nếu có max_slot sẽ kiểm tra giới hạn
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: Khung giờ đã đầy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Khung giờ đã đầy
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.post("/patients", patientController.createPatient);

/**
 * @swagger
 * /patients/status/{id}:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn
 *     tags: [Patients]
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - $ref: '#/components/parameters/patientIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.patch("/patients/status/:id", patientController.updateStatus);

/**
 * @swagger
 * /user/{id_u}:
 *   get:
 *     summary: Lấy lịch khám theo ID người dùng
 *     tags: [Patients]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Danh sách lịch khám của người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.get("/user/:id_u", patientController.getByUserId);

router.delete(
  "/patients/:id_appointment",
  verifyToken,
  patientController.cancelAppointment
);

/**
 * @swagger
 * /patients/my:
 *   get:
 *     summary: Lấy lịch khám của người dùng đã đăng nhập
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch khám cá nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.get("/patients/my", verifyToken, patientController.getUserAppointments);

router.get("/patients/booked/:dr_id/:date", patientController.getBookedSlots);

/**
 * @swagger
 * /patients/{id}/slot-usage:
 *   get:
 *     summary: Kiểm tra số slot đã dùng của một khung giờ theo ngày
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: dr_id của bác sĩ
 *       - in: query
 *         name: time_slot
 *         required: true
 *         schema:
 *           type: string
 *         example: "08:00 - 09:00"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thông tin slot usage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dr_id:
 *                   type: integer
 *                 time_slot:
 *                   type: string
 *                 date:
 *                   type: string
 *                 current_slot:
 *                   type: integer
 *                 max_slot:
 *                   type: integer
 *                   nullable: true
 *                 available:
 *                   type: boolean
 */
router.get("/patients/:id/slot-usage", patientController.getSlotUsage);

// Rescheduling endpoints
/**
 * @swagger
 * /patients/{id}/reschedule:
 *   post:
 *     summary: Đề xuất đổi lịch khám
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proposed_date]
 *             properties:
 *               proposed_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               proposed_time_slot:
 *                 type: string
 *                 example: "09:00 - 09:30"
 *                 description: Khung giờ mới đề xuất (nếu muốn đổi khung giờ)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đề xuất thành công
 *       400:
 *         description: Thiếu ngày đề xuất
 */
router.post("/patients/:id/reschedule", verifyToken, patientController.proposeReschedule);
/**
 * @swagger
 * /patients/{id}/reschedule/accept:
 *   post:
 *     summary: Chấp nhận đề xuất đổi lịch
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chấp nhận thành công
 *       409:
 *         description: Khung giờ đề xuất đã đầy
 */
router.post("/patients/:id/reschedule/accept", verifyToken, patientController.acceptReschedule);

/**
 * @swagger
 * /patients/{id}/reschedule/decline:
 *   post:
 *     summary: Từ chối đề xuất đổi lịch
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.post("/patients/:id/reschedule/decline", verifyToken, patientController.declineReschedule);


// Doctor self appointments
const { requireDoctor } = require("../middlewares/auth.middleware");
router.get("/patients/doctor/my", verifyToken, requireDoctor, patientController.getDoctorAppointments);

module.exports = router;
