/**
 * Quick test for conversationIntelligence service
 */
require('dotenv').config();
const conversationIntelligence = require('./services/conversationIntelligence.service');

async function quickTest() {
  console.log('\n🧪 Testing Conversation Intelligence Service...\n');
  
  // Check configuration
  if (!conversationIntelligence.isConfigured()) {
    console.log('❌ GROQ API not configured!');
    console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Found' : 'Not found');
    console.log('GROQ_MODEL:', process.env.GROQ_MODEL || 'Not set');
    process.exit(1);
  }
  
  console.log('✅ GROQ API configured');
  console.log('   Model:', process.env.GROQ_MODEL || 'llama-3.1-70b-versatile');
  
  // Test intent analysis
  const currentStep = {
    key: 'gender',
    question: 'Giới tính của bạn (nam, nữ hoặc khác)?'
  };
  
  const conversationState = {};
  
  console.log('\n📝 Test 1: Off-topic question about price');
  console.log('User message: "tôi muốn hỏi giá khám có đắt không?"');
  
  try {
    const intent = await conversationIntelligence.analyzeUserIntent(
      "tôi muốn hỏi giá khám có đắt không?",
      currentStep,
      conversationState
    );
    
    console.log('\n✅ Intent detected:');
    console.log('   Intent:', intent.intent);
    console.log('   Confidence:', intent.confidence);
    console.log('   Needs redirect:', intent.needs_redirect);
    console.log('   Is emergency:', intent.is_emergency);
    
    if (intent.needs_redirect) {
      console.log('\n📝 Generating redirect response...');
      const response = await conversationIntelligence.generateFlexibleResponse(
        intent,
        currentStep,
        conversationState
      );
      console.log('\n🤖 Bot response:');
      console.log(response);
    }
    
    console.log('\n✅ Test passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

quickTest();
