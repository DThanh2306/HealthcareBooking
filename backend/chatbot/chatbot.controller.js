const aiDoctorConversationService = require('../services/aiDoctorConversation.service')

// START conversation
exports.startChat = (req, res) => {
  const { userId } = req.body

  const result = aiDoctorConversationService.startConversation(userId)

  res.json(result)
}

// SEND message
exports.sendMessage = async (req, res) => {
  const { conversationId, message } = req.body

  if (!conversationId) {
    return res.status(400).json({ error: 'Missing conversationId' })
  }

  try {
    const result = await aiDoctorConversationService.processMessage(
      conversationId,
      message
    )

    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}