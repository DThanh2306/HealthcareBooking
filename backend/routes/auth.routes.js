// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Đăng nhập / Đăng ký
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name_u, email_u, password_u]
 *             properties:
 *               name_u:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email_u:
 *                 type: string
 *                 example: vana@gmail.com
 *               password_u:
 *                 type: string
 *                 example: "123456"
 *               sdt_u:
 *                 type: string
 *                 example: "0901234567"
 *               gender_u:
 *                 type: string
 *                 example: Nam
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã tồn tại
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập — lấy JWT token
 *     tags: [Auth]
 *     description: |
 *       Sau khi đăng nhập thành công, copy `token` từ response.
 *       Nhấn nút **Authorize 🔒** góc trên phải, nhập `Bearer <token>` rồi nhấn Authorize.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email_u, password_u]
 *             properties:
 *               email_u:
 *                 type: string
 *                 example: admin@gmail.com
 *               password_u:
 *                 type: string
 *                 example: "123456"
 *           examples:
 *             admin:
 *               summary: Tài khoản Admin
 *               value:
 *                 email_u: admin@gmail.com
 *                 password_u: "123456"
 *             doctor:
 *               summary: Tài khoản Bác sĩ
 *               value:
 *                 email_u: bs1@gmail.com
 *                 password_u: "123456"
 *             user:
 *               summary: Tài khoản User
 *               value:
 *                 email_u: u1@gmail.com
 *                 password_u: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_u:
 *                       type: integer
 *                       example: 1
 *                     name_u:
 *                       type: string
 *                       example: Admin
 *                     email_u:
 *                       type: string
 *                       example: admin@gmail.com
 *                     role:
 *                       type: string
 *                       enum: [admin, doctor, user]
 *                       example: admin
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post("/login", authController.login);

module.exports = router;