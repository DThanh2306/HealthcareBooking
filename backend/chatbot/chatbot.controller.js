const aiDoctorConversationService = require('../services/aiDoctorConversation.service')

// START conversation
exports.startChat = (req, res) => {
  try {
    console.log('📥 /chatbot/start called')
    const { userId } = req.body
    const result = aiDoctorConversationService.startConversation(userId)
    console.log('✅ Result:', JSON.stringify(result))
    res.json(result)
  } catch (e) {
    console.error('❌ startChat error:', e.message)
    res.status(500).json({ error: e.message })
  }
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