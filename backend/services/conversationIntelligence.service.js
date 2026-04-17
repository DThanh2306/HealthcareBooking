const llmService = require("./llm.service");

/**
 * ConversationIntelligence Service
 * Sử dụng LLM để hiểu ý định người dùng và tạo response linh hoạt
 */
class ConversationIntelligenceService {
  constructor() {
    // Configuration
    this.config = {
      temperature: 0.3, // Low temperature for consistent responses
      maxTokens: 1000,
      topP: 0.9
    };
  }

  /**
   * Phân tích ý định của user khi trả lời câu hỏi
   */
  async analyzeUserIntent(userMessage, currentStep, conversationState) {
    const prompt = this.buildIntentAnalysisPrompt(userMessage, currentStep, conversationState);
    
    try {
      const responseText = await llmService.callChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
      });

      // Parse JSON response
      const result = llmService.parseJSONResponse(responseText);
      return result;
    } catch (error) {
      console.error("❌ Intent analysis failed:", error.message);
      // Fallback: assume user is answering the question
      return {
        intent: "answer_question",
        extracted_value: userMessage.trim(),
        confidence: 0.5,
        needs_redirect: false,
        is_emergency: false
      };
    }
  }

  /**
   * Build prompt cho intent analysis
   */
  buildIntentAnalysisPrompt(userMessage, currentStep, conversationState) {
    const stateContext = this.formatStateContext(conversationState);
    
    return `You are a medical AI assistant. Analyze patient intent in Vietnamese conversation.

CONVERSATION CONTEXT:
${stateContext}

CURRENT QUESTION: "${currentStep.question}"
Collecting: ${currentStep.key}

PATIENT'S ANSWER: "${userMessage}"

TASK:
Analyze what the patient is doing:

1. ANSWER_QUESTION: Trả lời đúng câu hỏi hiện tại (phải hợp lý với câu hỏi)
2. SYMPTOM_MENTIONED: Người dùng nói về triệu chứng bệnh (ngay cả khi đang hỏi thông tin khác)
3. ASK_PRICE: Hỏi về giá khám, chi phí (ngay cả khi đang hỏi thông tin khác)
4. ASK_SCHEDULE: Hỏi về lịch khám, thời gian (ngay cả khi đang hỏi thông tin khác)
5. ASK_GENERAL: Hỏi thông tin chung về bệnh viện, bác sĩ (ngay cả khi đang hỏi thông tin khác)
6. OFF_TOPIC: Câu hỏi HOÀN TOÀN không liên quan (thời tiết, chính trị, thể thao, v.v.)
7. EMERGENCY: Tình huống khẩn cấp cần xử lý ngay

⚠️ QUAN TRỌNG - XỬ LÝ OFF_TOPIC:
Nếu câu trả lời KHÔNG trực tiếp liên quan đến câu hỏi (VD: hỏi giới tính mà nói về thời tiết),
chọn intent = "OFF_TOPIC" để trả lời câu hỏi đó và nhẹ nhàng chuyển hướng về y tế.

LƯU Ý: Chúng ta là chatbot y tế THÔNG MINH, không phải chatbot cứng nhắc.
- TRẢ LỜI được các câu hỏi thông thường (thời tiết, kiến thức chung)
- SAU ĐÓ nhẹ nhàng chuyển về chủ đề y tế
- KHÔNG từ chối hay nói "không liên quan"

⚠️ QUAN TRỌNG - PHÁT HIỆN TRIỆU CHỨNG:
Nếu người dùng đề cập BẤT KỲ triệu chứng bệnh nào (đau đầu, đau bụng, sốt, ho, khó thở, v.v.), 
cho dù đang hỏi câu nào, PHẢI chọn intent = "SYMPTOM_MENTIONED" và trích xuất triệu chứng.

VÍ DỤ:
- "tôi hơi đau đầu" (khi hỏi giới tính) → SYMPTOM_MENTIONED, extracted_value = "đau đầu"
- "con tôi bị sốt" (khi hỏi giới tính) → SYMPTOM_MENTIONED, extracted_value = "sốt"
- "đau bụng dữ dội" (bất kỳ lúc nào) → SYMPTOM_MENTIONED hoặc EMERGENCY
- "Nam" (khi hỏi giới tính) → ANSWER_QUESTION, extracted_value = "Nam"
- "25 tuổi" (khi hỏi tuổi) → ANSWER_QUESTION, extracted_value = "25"

DẤU HIỆU KHẨN CẤP:
- Sốt cao ≥39°C ở trẻ nhỏ, ≥40°C ở người lớn
- Co giật, ngất xỉu, mất ý thức
- Đau ngực dữ dội, khó thở nặng
- Chảy máu không cầm được
- Đau bụng dữ dội
- Liệt, yếu một bên người đột ngột
- Tai biến mạch máu não

EXTRACT INFORMATION:
- Với gender: "Nam", "Nữ", "Khác" (chuẩn hóa)
- Với age: Chỉ số (VD: "25")
- Với location: Địa chỉ cụ thể nhất có thể
- Với primaryConcern: Triệu chứng chính (mô tả ngắn gọn)
- Với symptomDuration: Thời gian (VD: "3 ngày", "2 tuần")

CRITICAL: Return ONLY valid JSON. No explanation, no markdown, just JSON.

FORMAT:
{
  "intent": "ANSWER_QUESTION|SYMPTOM_MENTIONED|ASK_PRICE|ASK_SCHEDULE|ASK_GENERAL|OFF_TOPIC|EMERGENCY",
  "extracted_value": "extracted value",
  "confidence": 0.95,
  "needs_redirect": false,
  "is_emergency": false,
  "emergency_details": null,
  "user_question": null
}

EXAMPLES:

Input (current_key=gender): "Nam"
Output: {"intent":"ANSWER_QUESTION","extracted_value":"Nam","confidence":0.99,"needs_redirect":false,"is_emergency":false,"emergency_details":null,"user_question":null}

Input (current_key=gender): "Male" or "I am male"
Output: {"intent":"ANSWER_QUESTION","extracted_value":"Nam","confidence":0.95,"needs_redirect":false,"is_emergency":false,"emergency_details":null,"user_question":null}

Input (current_key=gender): "tôi hơi đau đầu"
Output: {"intent":"SYMPTOM_MENTIONED","extracted_value":"đau đầu","confidence":0.95,"needs_redirect":false,"is_emergency":false,"emergency_details":null,"user_question":null}

Input (current_key=gender): "thời tiết hôm nay thế nào"
Output: {"intent":"OFF_TOPIC","extracted_value":null,"confidence":0.99,"needs_redirect":true,"is_emergency":false,"emergency_details":null,"user_question":"Hỏi về thời tiết"}

Input (current_key=age): "Tôi 25 tuổi" or "I am 25"
Output: {"intent":"ANSWER_QUESTION","extracted_value":"25","confidence":0.98,"needs_redirect":false,"is_emergency":false,"emergency_details":null,"user_question":null}

Input (current_key=age): "200 tuổi" or "I am 200 years old"
Output: {"intent":"ASK_GENERAL","extracted_value":null,"confidence":0.95,"needs_redirect":true,"is_emergency":false,"emergency_details":null,"user_question":"Đùa về tuổi 200"}

Input (current_key=gender): "Khám có đắt không?"
Output: {"intent":"ASK_PRICE","extracted_value":null,"confidence":0.95,"needs_redirect":true,"is_emergency":false,"emergency_details":null,"user_question":"Giá khám có đắt không?"}

Input (current_key=gender): "Con tôi 2 tuổi sốt 40 độ co giật"
Output: {"intent":"EMERGENCY","extracted_value":"Con 2 tuổi sốt 40°C co giật","confidence":0.99,"needs_redirect":false,"is_emergency":true,"emergency_details":"Trẻ 2 tuổi sốt cao 40°C kèm co giật","user_question":null}

ANALYZE NOW (JSON only):`;
  }

  /**
   * Generate flexible response dựa trên intent
   */
  async generateFlexibleResponse(intent, currentStep, conversationState) {
    // Handle emergency first
    if (intent.is_emergency) {
      return this.generateEmergencyResponse(intent);
    }

    // Handle redirects (off-topic questions)
    if (intent.needs_redirect) {
      return this.generateRedirectResponse(intent, currentStep, conversationState);
    }

    // Normal acknowledgement
    return this.generateAcknowledgement(currentStep, intent.extracted_value, conversationState);
  }

  /**
   * Generate emergency response
   */
  generateEmergencyResponse(intent) {
    return `⚠️⚠️⚠️ TÌNH HUỐNG KHẨN CẤP ⚠️⚠️⚠️

Tôi nhận thấy: ${intent.emergency_details}

ĐÂY LÀ TÌNH HUỐNG KHẨN CẤP - HÃY LÀM NGAY:

1. 🚨 GỌI CẤP CỨU 115 NGAY LẬP TỨC
2. 🏥 Hoặc đến bệnh viện cấp cứu gần nhất
3. ⚠️ KHÔNG TỰ Ý CHO THUỐC - ĐI CẤP CỨU NGAY

Trong khi chờ cấp cứu:
- Giữ bình tĩnh
- Để người bệnh nằm yên
- Theo dõi sát tình trạng
- Chuẩn bị giấy tờ tùy thân

Bạn có cần tôi tìm bệnh viện cấp cứu gần nhất không? (Có/Không)`;
  }

  /**
   * Generate redirect response cho off-topic questions
   */
  async generateRedirectResponse(intent, currentStep, conversationState) {
    // Special handling for OFF_TOPIC (completely unrelated answers)
    if (intent.intent === 'OFF_TOPIC') {
      const prompt = `You are a friendly, intelligent medical AI chatbot like ChatGPT. The patient asked something unrelated to healthcare.

PATIENT ASKED: "${intent.user_question}"
CURRENT QUESTION: "${currentStep.question}" (${currentStep.key})

TASK:
1. Answer their question briefly and intelligently (1-2 sentences)
2. Show you're smart and helpful - not a rigid bot
3. Smoothly transition back to healthcare topic
4. Be warm, natural, conversational
5. Support both Vietnamese and English

EXAMPLE 1 (Weather question in Vietnamese):
Patient: "thời tiết hôm nay thế nào"
Asking: "Giới tính của bạn?"
Response: "Hôm nay thời tiết khá đẹp ở Hà Nội, khoảng 25-28 độ C. 😊

Nhân tiện, để tư vấn sức khỏe chính xác cho bạn, bạn vui lòng cho tôi biết giới tính của bạn nhé (Nam, Nữ hoặc Khác)?"

EXAMPLE 2 (Age joke):
Patient: "200 tuổi"
Asking: "Bạn bao nhiêu tuổi?"
Response: "Haha 200 tuổi thì bạn đã là 'cụ rùa' rồi! 😄 Chắc bạn đang đùa đúng không?

Để tư vấn y tế phù hợp với độ tuổi, bạn vui lòng cho tôi biết tuổi thực của bạn nhé?"

EXAMPLE 3 (General knowledge in English):
Patient: "what's the weather like"
Asking: "What is your age?"
Response: "The weather today is quite pleasant - around 75-82°F in most areas. ☀️

Now, to help with your health concerns, could you please tell me your age?"

WRITE RESPONSE (warm, conversational, 2-3 sentences):`;

      try {
        const responseText = await llmService.callChatCompletion({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 250,
        });
        return responseText ? responseText.trim() : `Cảm ơn bạn đã hỏi! Tuy nhiên, để tư vấn sức khỏe tốt nhất cho bạn, ${currentStep.question}`;
      } catch (error) {
        console.error("❌ OFF_TOPIC response generation failed:", error.message);
        return `Cảm ơn bạn đã hỏi! Tuy nhiên, để tư vấn sức khỏe tốt nhất cho bạn, ${currentStep.question}`;
      }
    }
    
    // Handle other redirects (price, schedule, etc.)
    const prompt = `Bạn là bác sĩ AI thân thiện và chuyên nghiệp giống ChatGPT.

BỆNH NHÂN HỎI: "${intent.user_question}"

NGỮ CẢNH: Đang thu thập thông tin "${currentStep.key}" với câu hỏi "${currentStep.question}"

Thông tin đã có: ${this.formatStateContext(conversationState)}

NHIỆM VỤ:
1. Trả lời ngắn gọn câu hỏi của bệnh nhân (1-2 câu)
2. Giải thích mục đích cuộc trò chuyện này là:
   - Tìm bác sĩ phù hợp với triệu chứng
   - Gợi ý chuyên khoa cần khám
   - Tìm bệnh viện gần bạn
   - Đánh giá mức độ khẩn cấp
3. Redirect nhẹ nhàng về câu hỏi ban đầu
4. Support both Vietnamese and English

VÍ DỤ TRẢ LỜI VỀ GIÁ:
"Tôi hiểu bạn quan tâm về chi phí. Giá khám thường dao động từ 150.000đ - 500.000đ tùy bác sĩ và chuyên khoa. Sau khi hiểu rõ triệu chứng của bạn, tôi sẽ gợi ý các bác sĩ với mức giá phù hợp.

Mục đích cuộc trò chuyện này là giúp bạn:
✅ Tìm bác sĩ phù hợp với triệu chứng
✅ Gợi ý chuyên khoa cần khám  
✅ Tìm bệnh viện gần bạn

Để tiếp tục, ${currentStep.question}"

VIẾT CÂU TRẢ LỜI (ngắn gọn, thân thiện, chuyên nghiệp):`;

    try {
      const responseText = await llmService.callChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
      });
      return responseText ? responseText.trim() : `Cảm ơn bạn đã hỏi. Tôi sẽ ghi nhận câu hỏi của bạn.

Mục đích cuộc trò chuyện này là giúp bạn tìm bác sĩ và bệnh viện phù hợp với tình trạng sức khỏe.

Để tiếp tục, ${currentStep.question}`;
    } catch (error) {
      console.error("❌ Redirect response generation failed:", error.message);
      // Fallback
      return `Cảm ơn bạn đã hỏi. Tôi sẽ ghi nhận câu hỏi của bạn.

Mục đích cuộc trò chuyện này là giúp bạn tìm bác sĩ và bệnh viện phù hợp với tình trạng sức khỏe.

Để tiếp tục, ${currentStep.question}`;
    }
  }

  /**
   * Generate empathetic acknowledgement when symptom is mentioned early
   */
  async generateSymptomAcknowledgement(symptom, currentStep, conversationState) {
    const prompt = `Bạn là bác sĩ AI thân thiện và empathetic.

TÌNH HUỐNG:
- Bệnh nhân vừa nói về triệu chứng: "${symptom}"
- Nhưng tôi đang hỏi về: "${currentStep.question}" (${currentStep.key})

NHIỆM VỤ:
1. Thể hiện sự đồng cảm và ghi nhận triệu chứng
2. Giải thích ngắn gọn tại sao cần thông tin "${currentStep.key}"
3. Hỏi lại câu hỏi ban đầu một cách tự nhiên

PHONG CÁCH:
- Ấm áp, chuyên nghiệp
- Không dài dòng (2-3 câu)
- Tạo cảm giác được quan tâm

VÍ DỤ 1:
Triệu chứng: "đau đầu"
Đang hỏi: giới tính
→ "Tôi hiểu bạn đang bị đau đầu. Tôi sẽ ghi nhận điều này để phân tích kỹ hơn. Trước tiên, để tư vấn chính xác nhất, bạn vui lòng cho tôi biết giới tính của bạn nhé (Nam, Nữ hoặc Khác)?"

VÍ DỤ 2:
Triệu chứng: "sốt cao"
Đang hỏi: tuổi
→ "Cảm ơn bạn đã chia sẻ. Tôi ghi nhận bạn đang bị sốt cao - điều này rất quan trọng. Để đánh giá mức độ nguy hiểm, bạn vui lòng cho tôi biết tuổi của bạn?"

VIẾT CÂU TRẢ LỜI (2-3 câu, kết thúc bằng câu hỏi):`;

    try {
      const responseText = await llmService.callChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      });
      return responseText ? responseText.trim() : `Tôi hiểu bạn đang gặp vấn đề về ${symptom}. Tôi sẽ ghi nhận điều này.\n\nĐể tư vấn chính xác, ${currentStep.question}`;
    } catch (error) {
      console.error("❌ Symptom acknowledgement generation failed:", error.message);
      // Fallback
      return `Tôi hiểu bạn đang gặp vấn đề về ${symptom}. Tôi sẽ ghi nhận điều này.\n\nĐể tư vấn chính xác, ${currentStep.question}`;
    }
  }

  /**
   * Generate natural acknowledgement
   */
  async generateAcknowledgement(currentStep, extractedValue, conversationState, language = 'vi') {
    const isEnglish = language === 'en';
    
    const prompt = isEnglish 
      ? `You are a friendly medical AI assistant. Create a brief confirmation for the patient's information.

INFORMATION RECEIVED: ${currentStep.key} = "${extractedValue}"

REQUIREMENTS:
- 1 short sentence to confirm
- Friendly, professional
- Don't ask again

EXAMPLES:
- Gender "Male" → "Got it, you are male."
- Age "25" → "Thank you, you are 25 years old."
- Symptom "headache" → "I understand you are experiencing headaches. I will analyze this to provide accurate advice."

WRITE CONFIRMATION (1 short sentence):`
      : `Bạn là bác sĩ AI thân thiện. Tạo câu xác nhận ngắn gọn cho thông tin bệnh nhân vừa cung cấp.

THÔNG TIN VỪA NHẬN: ${currentStep.key} = "${extractedValue}"

YÊU CẦU:
- 1 câu ngắn gọn xác nhận đã ghi nhận
- Thân thiện, chuyên nghiệp
- Không hỏi lại

VÍ DỤ:
- Giới tính "Nam" → "Đã ghi nhận, bạn là nam giới."
- Tuổi "25" → "Cảm ơn bạn, tuổi của bạn là 25."
- Triệu chứng "đau đầu" → "Tôi hiểu bạn đang bị đau đầu. Tôi sẽ phân tích để tư vấn chính xác."

VIẾT CÂU XÁC NHẬN (1 câu ngắn):`;

    try {
      const responseText = await llmService.callChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 100,
      });
      return responseText ? responseText.trim() : (typeof currentStep.acknowledgement === 'function' ? currentStep.acknowledgement(extractedValue) : `Đã ghi nhận: ${extractedValue}`);
    } catch (error) {
      console.error("❌ Acknowledgement generation failed:", error.message);
      // Fallback to default
      return typeof currentStep.acknowledgement === 'function' 
        ? currentStep.acknowledgement(extractedValue)
        : `Đã ghi nhận: ${extractedValue}`;
    }
  }

  /**
   * Extract thông tin từ câu trả lời dài dòng
   */
  async extractStructuredInfo(userMessage, targetField) {
    const prompt = `Trích xuất thông tin "${targetField}" từ câu trả lời của bệnh nhân.

CÂU TRẢ LỜI: "${userMessage}"

CẦN TRÍCH XUẤT: ${targetField}

QUY TẮC:
- gender: Nam, Nữ, hoặc Khác (chuẩn hóa)
- age: Chỉ số tuổi (VD: "25")
- location: Địa chỉ đầy đủ nhất có thể
- primaryConcern: Liệt kê các triệu chứng, phân tách bằng dấu phẩy
- symptomDuration: Thời gian (VD: "3 ngày", "2 tuần")

TRẢ VỀ ĐÚNG GIÁ TRỊ TRÍCH XUẤT (không có text khác):`;

    try {
      const responseText = await llmService.callChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });
      return responseText ? responseText.trim() : userMessage.trim();
    } catch (error) {
      console.error("❌ Info extraction failed:", error.message);
      return userMessage.trim();
    }
  }

  /**
   * Generate gợi ý câu hỏi tiếp theo
   */
  async generateFollowUpSuggestions(conversationState) {
    const suggestions = [];
    
    // Dựa vào thông tin đã có để gợi ý
    if (!conversationState.gender) {
      suggestions.push("Nam", "Nữ");
    } else if (!conversationState.age) {
      suggestions.push("Dưới 18 tuổi", "18-40 tuổi", "Trên 40 tuổi");
    } else if (!conversationState.location) {
      suggestions.push("TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng");
    } else if (!conversationState.primaryConcern) {
      suggestions.push("Đau đầu", "Đau bụng", "Sốt cao", "Ho, khó thở");
    }
    
    return suggestions;
  }

  /**
   * Format conversation state for LLM context
   */
  formatStateContext(state) {
    const parts = [];
    if (state.gender) parts.push(`Giới tính: ${state.gender}`);
    if (state.age) parts.push(`Tuổi: ${state.age}`);
    if (state.location) parts.push(`Khu vực: ${state.location}`);
    if (state.primaryConcern) parts.push(`Triệu chứng: ${state.primaryConcern}`);
    if (state.symptomDuration) parts.push(`Thời gian: ${state.symptomDuration}`);
    
    return parts.length > 0 ? parts.join(", ") : "Chưa có thông tin";
  }

  /**
   * Parse JSON response from LLM
   */
  parseJSONResponse(response) {
    return llmService.parseJSONResponse(response);
  }
  /**
   * Validate LLM configuration
   */
  isConfigured() {
    return llmService.isConfigured();
  }
}

module.exports = new ConversationIntelligenceService();
