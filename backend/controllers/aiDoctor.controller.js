const aiDoctorConversationService = require("../services/aiDoctorConversation.service");

exports.startConversation = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || null;
    const result = aiDoctorConversationService.startConversation(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ AI Doctor start error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể khởi tạo cuộc trò chuyện với bác sĩ AI.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body || {};

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu conversationId hoặc nội dung tin nhắn.",
      });
    }

    const response = await aiDoctorConversationService.processMessage(
      conversationId,
      message,
      { radiusKm: req.body?.radiusKm }
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("❌ AI Doctor message error:", error);

    const isNotFound =
      error.message && error.message.includes("không tồn tại hoặc đã hết hạn");

    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message || "Không thể xử lý tin nhắn của bạn.",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
// Simple health check endpoint for AI Doctor service
exports.health = async (req, res) => {
 try {
   res.json({
     success: true,
     status: 'ok',
     service: 'ai-doctor',
     timestamp: new Date().toISOString()
   });
 } catch (error) {
   res.status(500).json({ success: false, message: 'Health check failed' });
 }
};
