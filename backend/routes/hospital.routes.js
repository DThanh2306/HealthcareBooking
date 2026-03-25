const express = require("express");
const router = express.Router();
const controller = require("../controllers/hospital.controller");
const logoUpload = require("../middlewares/logo-upload-middleware");

/**
 * @swagger
 * tags:
 *   name: Hospitals
 *   description: API quản lý bệnh viện
 */

/**
 * @swagger
 * /hospitals:
 *   get:
 *     summary: Lấy danh sách bệnh viện
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Danh sách bệnh viện
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hospital'
 */
router.get("/hospitals", controller.getAll);

/**
 * @swagger
 * /hospitals/{id}:
 *   get:
 *     summary: Lấy chi tiết bệnh viện
 *     tags: [Hospitals]
 *     parameters:
 *       - $ref: '#/components/parameters/hospitalIdParam'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
router.get("/hospitals/:id", controller.getById);

/**
 * @swagger
 * /hospitals/{id}/specialties:
 *   get:
 *     summary: Lấy danh sách chuyên khoa có tại bệnh viện
 *     tags: [Hospitals]
 *     parameters:
 *       - $ref: '#/components/parameters/hospitalIdParam'
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sp_id:
 *                     type: integer
 *                   sp_name:
 *                     type: string
 *                   sp_description:
 *                     type: string
 *                   doctor_count:
 *                     type: integer
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 */
router.get("/hospitals/:id/specialties", controller.getSpecialties);

// Nearby hospitals based on this hospital's address
router.get("/hospitals/:id/nearby", controller.getNearby);

/**
 * @swagger
 * /hospitals:
 *   post:
 *     summary: Tạo mới bệnh viện
 *     tags: [Hospitals]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       201:
 *         description: Đã tạo bệnh viện
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.post("/hospitals", logoUpload, controller.create);

/**
 * @swagger
 * /hospitals/{id}:
 *   put:
 *     summary: Cập nhật bệnh viện
 *     tags: [Hospitals]
 *     parameters:
 *       - $ref: '#/components/parameters/hospitalIdParam'
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
router.put("/hospitals/:id", logoUpload, controller.update);

/**
 * @swagger
 * /hospitals/{id}:
 *   delete:
 *     summary: Xoá bệnh viện
 *     tags: [Hospitals]
 *     parameters:
 *       - $ref: '#/components/parameters/hospitalIdParam'
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
router.delete("/hospitals/:id", controller.remove);

module.exports = router;
