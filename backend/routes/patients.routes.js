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
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id_u
 *               - dr_id
 *               - name
 *               - gender
 *               - phone
 *               - email
 *               - appointment_date
 *               - queue_number
 *             properties:
 *               id_u:
 *                 type: integer
 *               dr_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Nam, Nữ, Khác]
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
 *               queue_number:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo thành công
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

// Rescheduling endpoints
router.post("/patients/:id/reschedule", verifyToken, patientController.proposeReschedule);
router.post("/patients/:id/reschedule/accept", verifyToken, patientController.acceptReschedule);
router.post("/patients/:id/reschedule/decline", verifyToken, patientController.declineReschedule);

// Doctor self appointments
const { requireDoctor } = require("../middlewares/auth.middleware");
router.get("/patients/doctor/my", verifyToken, requireDoctor, patientController.getDoctorAppointments);

module.exports = router;
