const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctor.controller");
const avatarUpload = require("../middlewares/logo-upload-middleware");

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: API quản lý bác sĩ
 */

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Lấy danh sách bác sĩ
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 */
router.get("/doctors", controller.getAllDoctors);

/**
 * @swagger
 * /doctors/{dr_id}:
 *   get:
 *     summary: Lấy chi tiết bác sĩ
 *     tags: [Doctors]
 *     parameters:
 *       - $ref: '#/components/parameters/doctorIdParam'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
router.get("/doctors/:dr_id", controller.getDoctorById);
router.get("/doctors/by-user/:id_u", controller.getDoctorByUserId);

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Tạo mới bác sĩ
 *     tags: [Doctors]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       201:
 *         description: Đã tạo bác sĩ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.post("/doctors", avatarUpload, controller.createDoctor);

/**
 * @swagger
 * /doctors/{dr_id}:
 *   put:
 *     summary: Cập nhật thông tin bác sĩ
 *     tags: [Doctors]
 *     parameters:
 *       - $ref: '#/components/parameters/doctorIdParam'
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.put("/doctors/:dr_id", avatarUpload, controller.updateDoctor);

/**
 * @swagger
 * /doctors/{dr_id}:
 *   delete:
 *     summary: Xoá bác sĩ
 *     tags: [Doctors]
 *     parameters:
 *       - $ref: '#/components/parameters/doctorIdParam'
 *     responses:
 *       200:
 *         description: Xoá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.delete("/doctors/:dr_id", controller.deleteDoctor);

/**
 * @swagger
 * /doctors/hospital/{hospitalName}/specialty/{specialtyId}:
 *   get:
 *     summary: Lấy danh sách bác sĩ theo bệnh viện và chuyên khoa
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: hospitalName
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên bệnh viện
 *       - in: path
 *         name: specialtyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chuyên khoa
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.get("/doctors/hospital/:hospitalName/specialty/:specialtyId", controller.getDoctorsByHospitalAndSpecialty);

/**
 * @swagger
 * /doctors/{dr_id}/available-slots:
 *   get:
 *     summary: Lấy lịch trống của bác sĩ theo ngày
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: dr_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID bác sĩ
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Ngày cần kiểm tra (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Danh sách lịch trống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["08:00 - 09:00", "09:00 - 10:00", "14:00 - 15:00"]
 *       400:
 *         description: Thiếu tham số date
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.get("/doctors/:dr_id/available-slots", controller.getAvailableSlots);

/**
 * @swagger
 * /doctors/profile/schedules:
 *   put:
 *     summary: Cập nhật lịch khám của bác sĩ (chính chủ)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["08:00 - 09:00", "09:00 - 10:00", "14:00 - 15:00"]
 *     responses:
 *       200:
 *         description: Cập nhật lịch khám thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
const authMiddleware = require("../middlewares/auth.middleware");

router.put("/doctors/profile/schedules", 
  authMiddleware.verifyToken, 
  authMiddleware.requireDoctor, 
  controller.updateDoctorSchedules
);

/**
 * @swagger
 * /doctors/{dr_id}/schedules/day/{day}:
 *   get:
 *     summary: Lấy lịch khám của bác sĩ theo ngày trong tuần
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: dr_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bác sĩ
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *         description: Ngày trong tuần (1=Thứ 2, 2=Thứ 3, ..., 7=Chủ nhật)
 *     responses:
 *       200:
 *         description: Lấy lịch khám thành công
 *       400:
 *         description: Tham số không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get("/doctors/:dr_id/schedules/day/:day", controller.getDoctorSchedulesByDay);

/**
 * @swagger
 * /doctors/{dr_id}/schedules/date/{date}:
 *   get:
 *     summary: Lấy lịch khám của bác sĩ theo ngày cụ thể
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: dr_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bác sĩ
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cụ thể (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy lịch khám thành công
 *       400:
 *         description: Tham số không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get("/doctors/:dr_id/schedules/date/:date", controller.getDoctorSchedulesByDate);

/**
 * @swagger
 * /doctors/profile/schedules-with-days:
 *   put:
 *     summary: Cập nhật lịch khám của bác sĩ theo từng ngày trong tuần
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedulesWithDays:
 *                 type: object
 *                 properties:
 *                   "1":
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Lịch khám Thứ 2
 *                   "2":
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Lịch khám Thứ 3
 *                 example:
 *                   "1": ["08:00 - 09:00", "09:00 - 10:00"]
 *                   "2": ["14:00 - 15:00", "15:00 - 16:00"]
 *     responses:
 *       200:
 *         description: Cập nhật lịch khám thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.put("/doctors/profile/schedules-with-days", 
  authMiddleware.verifyToken, 
  authMiddleware.requireDoctor, 
  controller.updateDoctorSchedulesWithDays
);

module.exports = router;
