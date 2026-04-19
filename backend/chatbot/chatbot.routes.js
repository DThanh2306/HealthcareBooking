const express = require('express')
const router = express.Router()
const chatbotController = require('./chatbot.controller')

/**
 * @swagger
 * /chatbot/start:
 *   post:
 *     summary: Bắt đầu cuộc hội thoại
 *     tags: [Chatbot]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: user_123
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationId:
 *                   type: string
 *                   example: "abc-123"
 *                 message:
 *                   type: string
 *                   example: "Chào bạn..."
 */
router.post('/chatbot/start', chatbotController.startChat)
/**
 * @swagger
 * /chatbot/message:
 *   post:
 *     summary: Gửi tin nhắn vào chatbot
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - message
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "abc-123"
 *               message:
 *                 type: string
 *                 example: "Tôi bị đau đầu"
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi request
 */
router.post('/chatbot/message', chatbotController.sendMessage)

module.exports = router