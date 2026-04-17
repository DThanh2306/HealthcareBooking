const { randomUUID } = require("crypto");
const aiDoctorRecommendationService = require("./aiDoctorRecommendation.service");
const medicalKnowledge = require("./medicalKnowledge.service");
const improvedRagLLM = require("./improvedRagLLM.service");
const aiDoctorTraining = require("./aiDoctorTraining.service");
const ragLLMService = require("./ragLLM.service");
const conversationIntelligence = require("./conversationIntelligence.service");

const CONVERSATION_TTL_MS = 30 * 60 * 1000;

const STEPS = [
  {
    key: "gender",
    question:
      "Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn (nam, nữ hoặc khác)?",
    acknowledgement: (answer) => `Đã ghi nhận giới tính của bạn là "${answer}".`,
  },
  {
    key: "age",
    question: "Bạn bao nhiêu tuổi?",
    acknowledgement: (answer) => `Cảm ơn bạn. Tuổi của bạn là "${answer}".`,
  },
  {
    key: "location",
    question:
      "Bạn muốn khám ở khu vực nào? Vui lòng cung cấp địa chỉ cụ thể (VD: '123 Lê Lợi, Quận 1, TP.HCM') hoặc cho phép truy cập vị trí GPS. Bạn có thể đề xuất vị trí muốn khám hoặc vị trí hiện tại để tôi tìm bệnh viện gần nhất trong bán kính 50km.",
    acknowledgement: (answer) =>
      `Đã ghi nhận vị trí mong muốn khám: "${answer}". Tôi sẽ tìm các bác sĩ và bệnh viện phù hợp trong bán kính 50km từ vị trí này.`,
  },
  {
    key: "primaryConcern",
    question:
      "Triệu chứng chính khiến bạn lo lắng là gì? Bạn mô tả càng rõ thì tôi càng tư vấn chính xác.",
    acknowledgement: () =>
      "Cảm ơn bạn đã mô tả triệu chứng. Tôi sẽ phân tích để đề xuất chuyên khoa phù hợp.",
  },
  {
    key: "symptomDuration",
    question:
      "Các triệu chứng này đã xuất hiện trong bao lâu? Có thay đổi gì theo thời gian không?",
    acknowledgement: (answer) =>
      `Đã ghi nhận thời gian diễn ra triệu chứng: "${answer}".`,
  },
];

class AiDoctorConversationService {
  constructor() {
    this.conversations = new Map();
    setInterval(() => this.cleanUpExpiredConversations(), 10 * 60 * 1000).unref();
  }

  /**
   * Detect user's preferred language from their message
   */
  detectLanguage(message) {
    // Check for English patterns
    const englishPatterns = [
      /\b(i am|i'm|my|me|can you|could you|please|thank you|yes|no)\b/i,
      /\b(what|when|where|who|why|how)\b/i,
      /\b(headache|fever|cough|pain|symptom)\b/i,
      /^[a-zA-Z\s\d.,!?'-]+$/ // Mostly English characters
    ];
    
    const hasEnglish = englishPatterns.some(pattern => pattern.test(message));
    
    // Check for Vietnamese patterns
    const vietnamesePatterns = [
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
      /\b(tôi|bạn|của|là|có|không|gì|như|thế|nào)\b/i
    ];
    
    const hasVietnamese = vietnamesePatterns.some(pattern => pattern.test(message));
    
    if (hasEnglish && !hasVietnamese) {
      return 'en';
    }
    
    return 'vi'; // Default to Vietnamese
  }

  startConversation(userId = null) {
    const conversationId = randomUUID();
    const now = Date.now();

    const conversation = {
      id: conversationId,
      userId,
      state: {},
      history: [],
      stepIndex: 0,
      status: "collecting",
      createdAt: now,
      updatedAt: now,
    };

    const greeting =
      "Chào bạn, tôi là Bác sĩ AI của BookingCare. Tôi sẽ hỏi từng thông tin để hiểu rõ tình trạng của bạn và đề xuất chuyên khoa, bệnh viện, bác sĩ phù hợp. " +
      "Trong mọi trường hợp khẩn cấp, hãy liên hệ cấp cứu gần nhất.\n\n" +
      STEPS[0].question;

    conversation.history.push({ role: "assistant", content: greeting });
    this.conversations.set(conversationId, conversation);

    return {
      conversationId,
      message: greeting,
    };
  }

  async processMessage(conversationId, userMessage, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error("Cuộc hội thoại không tồn tại hoặc đã hết hạn.");
    }

    conversation.updatedAt = Date.now();
    
    // Detect and store user's preferred language
    const detectedLang = this.detectLanguage(userMessage);
    if (!conversation.language) {
      conversation.language = detectedLang;
      console.log(`🌐 Detected language: ${detectedLang}`);
    } else if (detectedLang !== conversation.language && userMessage.toLowerCase().includes('english')) {
      // User explicitly requested English
      conversation.language = 'en';
      console.log(`🌐 Language switched to: en`);
    }

    if (conversation.status === "completed") {
      return {
        message:
          "Cuộc trò chuyện đã hoàn tất. Nếu bạn cần hỗ trợ thêm, hãy bắt đầu cuộc trò chuyện mới nhé.",
        followUp: false,
        state: conversation.state,
        recommendations: conversation.recommendations,
      };
    }

    const currentStep = STEPS[conversation.stepIndex];
    conversation.history.push({ role: "user", content: userMessage });

    if (currentStep) {
      // 🆕 STEP 1: Analyze user intent with LLM
      let intent = null;
      try {
        if (conversationIntelligence.isConfigured()) {
          intent = await conversationIntelligence.analyzeUserIntent(
            userMessage,
            currentStep,
            conversation.state
          );
          console.log(`💡 Intent detected: ${intent.intent} (confidence: ${intent.confidence})`);
        }
      } catch (error) {
        console.error("⚠️ Intent analysis failed, using fallback:", error.message);
        // Continue with fallback logic
      }

      // 🆕 STEP 2: Handle emergency immediately
      if (intent && intent.is_emergency) {
        const emergencyResponse = conversationIntelligence.generateEmergencyResponse(intent);
        conversation.history.push({ role: "assistant", content: emergencyResponse });
        
        // Mark conversation for emergency tracking
        conversation.state._emergency = {
          detected: true,
          details: intent.emergency_details,
          timestamp: Date.now()
        };
        
        return {
          message: emergencyResponse,
          followUp: true,
          state: conversation.state,
          intent: "EMERGENCY",
          urgency: "critical"
        };
      }

      // 🆕 STEP 3: Handle symptom mentioned early (before asking for it)
      if (intent && intent.intent === 'SYMPTOM_MENTIONED') {
        // Special case: If we're already asking about primaryConcern, treat it as an answer
        if (currentStep.key === 'primaryConcern') {
          console.log("💡 Symptom mentioned while asking for primaryConcern - treating as answer");
          // Change intent to ANSWER_QUESTION so it gets processed normally
          intent.intent = 'ANSWER_QUESTION';
          // Continue to normal processing flow below
        } else {
          // User mentioned symptoms before we asked for them - smart!
          // Store the symptom for later use
          if (!conversation.state.earlySymptoms) {
            conversation.state.earlySymptoms = [];
          }
          conversation.state.earlySymptoms.push(intent.extracted_value);
          
          // Generate empathetic response that acknowledges symptom and continues flow
          try {
            const symptomResponse = await conversationIntelligence.generateSymptomAcknowledgement(
              intent.extracted_value,
              currentStep,
              conversation.state
            );
            
            conversation.history.push({ role: "assistant", content: symptomResponse });
            
            return {
              message: symptomResponse,
              followUp: true,
              state: conversation.state,
              intent: "SYMPTOM_MENTIONED",
              earlySymptom: intent.extracted_value
            };
          } catch (error) {
            console.error("⚠️ Symptom acknowledgement generation failed:", error.message);
            // Fallback to simple acknowledgement
            const fallbackResponse = `Tôi hiểu bạn đang gặp vấn đề về ${intent.extracted_value}. Tôi sẽ ghi nhận điều này.\n\nĐể tư vấn chính xác, tôi cần thêm một số thông tin. ${currentStep.question}`;
            conversation.history.push({ role: "assistant", content: fallbackResponse });
            
            return {
              message: fallbackResponse,
              followUp: true,
              state: conversation.state,
              intent: "SYMPTOM_MENTIONED"
            };
          }
        }
      }

      // 🆕 STEP 4: Handle off-topic questions (redirect)
      if (intent && intent.needs_redirect) {
        try {
          const redirectResponse = await conversationIntelligence.generateFlexibleResponse(
            intent,
            currentStep,
            conversation.state
          );
          
          conversation.history.push({ role: "assistant", content: redirectResponse });
          
          return {
            message: redirectResponse,
            followUp: true,
            state: conversation.state,
            intent: intent.intent,
            needsRedirect: true
          };
        } catch (error) {
          console.error("⚠️ Redirect response generation failed:", error.message);
          // Fallback - still be friendly
          let fallbackMessage = "";
          
          if (intent.intent === 'OFF_TOPIC') {
            fallbackMessage = `Cảm ơn bạn đã chia sẻ! Tuy nhiên, để tư vấn sức khỏe tốt nhất cho bạn, tôi cần biết thêm thông tin. ${currentStep.question}`;
          } else {
            fallbackMessage = `Cảm ơn bạn đã hỏi. Để tiếp tục, ${currentStep.question}`;
          }
          
          conversation.history.push({ role: "assistant", content: fallbackMessage });
          
          return {
            message: fallbackMessage,
            followUp: true,
            state: conversation.state,
            intent: intent.intent,
            needsRedirect: true
          };
        }
      }

      // 🆕 STEP 5: Extract value with LLM or fallback to validation
      let extractedValue = userMessage.trim();
      
      if (intent && intent.extracted_value) {
        // Use LLM-extracted value
        extractedValue = intent.extracted_value;
      } else {
        // Fallback to rule-based validation
        const validatedInput = this.validateAndEnhanceInput(currentStep.key, userMessage.trim());
        extractedValue = validatedInput.value;
      }
      
      conversation.state[currentStep.key] = extractedValue;
      
      // Add medical context if it's a symptom step
      if (currentStep.key === 'primaryConcern' && extractedValue) {
        const symptomAnalysis = medicalKnowledge.analyzeSymptoms(extractedValue);
        conversation.state._symptomAnalysis = symptomAnalysis;
      }
      
      // 🆕 STEP 6: Generate natural acknowledgement with LLM
      let acknowledgement;
      try {
        if (conversationIntelligence.isConfigured() && intent && intent.intent === 'ANSWER_QUESTION') {
          acknowledgement = await conversationIntelligence.generateAcknowledgement(
            currentStep,
            extractedValue,
            conversation.state,
            conversation.language || 'vi'
          );
        } else {
          // Fallback to template
          acknowledgement = typeof currentStep.acknowledgement === 'function'
            ? currentStep.acknowledgement(extractedValue)
            : `Đã ghi nhận: ${extractedValue}`;
        }
      } catch (error) {
        console.error("⚠️ Acknowledgement generation failed:", error.message);
        acknowledgement = typeof currentStep.acknowledgement === 'function'
          ? currentStep.acknowledgement(extractedValue)
          : `Đã ghi nhận: ${extractedValue}`;
      }
      
      // Add medical insights for symptom analysis
      if (currentStep.key === 'primaryConcern' && conversation.state._symptomAnalysis) {
        const analysis = conversation.state._symptomAnalysis;
        if (analysis.urgencyLevel === 'khẩn cấp') {
          acknowledgement += "\n\n⚠️ Tôi nhận thấy triệu chứng của bạn có thể cần được chú ý ngay. Nếu tình trạng nặng, hãy liên hệ cấp cứu 115.";
        } else if (analysis.matchedSymptoms && Array.isArray(analysis.matchedSymptoms) && analysis.matchedSymptoms.length > 0) {
          acknowledgement += `\n\nTôi hiểu bạn đang gặp vấn đề về: ${analysis.matchedSymptoms.slice(0, 2).join(", ")}. Điều này sẽ giúp tôi đề xuất chuyên khoa phù hợp.`;
        }
      }
      
      conversation.stepIndex += 1;

      if (conversation.stepIndex < STEPS.length) {
        const nextQuestion = STEPS[conversation.stepIndex].question;
        const assistantMessage = `${acknowledgement}\n\n${nextQuestion}`;
        conversation.history.push({ role: "assistant", content: assistantMessage });
        return {
          message: assistantMessage,
          followUp: true,
          state: conversation.state,
        };
      }

      conversation.status = "processing";
      
      // Merge early symptoms into primaryConcern if available
      if (conversation.state.earlySymptoms && conversation.state.earlySymptoms.length > 0) {
        const earlySymptomText = conversation.state.earlySymptoms.join(", ");
        if (conversation.state.primaryConcern) {
          conversation.state.primaryConcern = `${earlySymptomText}, ${conversation.state.primaryConcern}`;
        } else {
          conversation.state.primaryConcern = earlySymptomText;
        }
      }
      
      // Use enhanced medical knowledge for better analysis
      const enhancedAnalysis = medicalKnowledge.comprehensiveAnalysis(conversation.state);
      
      if (options && typeof options.radiusKm === 'number') {
        conversation.state.radiusKm = options.radiusKm;
      }
      const recommendations = await aiDoctorRecommendationService.getRecommendations(
        conversation.state
      );
      
      // Merge enhanced analysis with recommendations
      if (enhancedAnalysis) {
        recommendations.enhancedAnalysis = enhancedAnalysis;
        recommendations.medicalContext = enhancedAnalysis.medicalContext;
        if (enhancedAnalysis.urgencyLevel) {
          recommendations.medicalContext.urgencyLevel = enhancedAnalysis.urgencyLevel;
        }
      }

      const finalMessage = await this.generateFinalMessage(
        conversation.state,
        recommendations
      );

      conversation.status = "completed";
      conversation.recommendations = recommendations;
      conversation.history.push({ role: "assistant", content: finalMessage });

      return {
        message: finalMessage,
        followUp: false,
        state: conversation.state,
        recommendations,
      };
    }

    return {
      message:
        "Hiện tại tôi chưa cần thêm thông tin. Vui lòng đợi kết quả đề xuất của tôi nhé.",
      followUp: false,
      state: conversation.state,
    };
  }

  createStateSummary(state) {
    const entries = [
      state.gender ? `Giới tính: ${state.gender}` : null,
      state.age ? `Tuổi: ${state.age}` : null,
      state.location ? `Khu vực: ${state.location}` : null,
      state.primaryConcern ? `Triệu chứng chính: ${state.primaryConcern}` : null,
      state.symptomDuration
        ? `Thời gian diễn ra: ${state.symptomDuration}`
        : null,
      state.medicalHistory
        ? `Tiền sử sức khỏe: ${state.medicalHistory}`
        : null,
      state.currentMedications
        ? `Thuốc đang dùng: ${state.currentMedications}`
        : null,
      state.expectations ? `Mong muốn: ${state.expectations}` : null,
    ].filter(Boolean);

    return entries.join("\n");
  }

  createRecommendationSummary(recommendations) {
    if (!recommendations) return "";

    const lines = [];

    if (recommendations.specialties && Array.isArray(recommendations.specialties) && recommendations.specialties.length) {
      lines.push(
        `Chuyên khoa gợi ý: ${recommendations.specialties.join(", ")}.`
      );
    }

    if (recommendations.doctors?.length) {
      const doctorLines = recommendations.doctors.map((doctor, index) => {
        const hospital = doctor.hospitalName
          ? `, làm việc tại ${doctor.hospitalName}`
          : "";
        return `${index + 1}. ${doctor.name} (${doctor.specialty}${hospital})`;
      });
      lines.push("Bác sĩ đề xuất:\n" + doctorLines.join("\n"));
    }

    if (recommendations.hospitals?.length) {
      const hospitalLines = recommendations.hospitals.map(
        (hospital, index) =>
          `${index + 1}. ${hospital.name}${
            hospital.address ? ` - ${hospital.address}` : ""
          }`
      );
      lines.push("Cơ sở y tế gợi ý:\n" + hospitalLines.join("\n"));
    }

    return lines.join("\n\n");
  }

  async generateFinalMessage(state, recommendations) {
    const patientSummary = this.createStateSummary(state);
    const recommendationSummary =
      this.createRecommendationSummary(recommendations);

    try {
      // Try improved RAG LLM service first
      const response = await improvedRagLLM.generateAdvancedAdvice(state, recommendations, {
        stateSummary: patientSummary,
        recommendationSummary,
      });
      if (response) {
        // Store training data for future improvements
        await aiDoctorTraining.collectTrainingData(
          state.conversationId || 'unknown',
          state,
          { recommendations, confidence: recommendations.confidence || 0.8 },
          { helpful: null, accurate: null, rating: null } // Will be filled by user feedback
        );
        return response;
      }
    } catch (error) {
      console.error("❌ Advanced RAG LLM generation failed:", error.message);
      // Fallback to original service
      try {
        const response = await ragLLMService.generateAdvice(state, recommendations, {
          stateSummary: patientSummary,
          recommendationSummary,
        });
        if (response) {
          return response;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback RAG LLM generation failed:", fallbackError.message);
      }
    }

    const fallbackSummary = [
      "Cảm ơn bạn đã cung cấp đầy đủ thông tin. Dựa trên dữ liệu hiện có, tôi đề xuất bạn nên thăm khám tại các chuyên khoa và cơ sở sau:",
      recommendationSummary || "- Chúng tôi đang cập nhật thêm dữ liệu bác sĩ phù hợp.",
      "Vui lòng chuẩn bị sẵn các giấy tờ khám trước đây (nếu có), danh sách thuốc đang dùng và đến khám sớm nếu triệu chứng trở nên nặng, sốt cao, khó thở hoặc đau dữ dội.",
      "Lưu ý: Bác sĩ AI chỉ mang tính chất tham khảo, không thay thế chẩn đoán trực tiếp. Nếu tình trạng khẩn cấp, hãy liên hệ cấp cứu 115 hoặc đến cơ sở y tế gần nhất.",
    ].join("\n\n");

    return fallbackSummary;
  }

  // Validate and enhance user input
  validateAndEnhanceInput(stepKey, input) {
    if (!input) return { value: input, warnings: [] };
    
    const warnings = [];
    let enhancedValue = input;
    
    switch (stepKey) {
      case 'age':
        // Extract and validate age (support both Vietnamese and English)
        const ageMatch = input.match(/(\d+)/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          if (age > 0 && age <= 120) {
            enhancedValue = age.toString();
          } else {
            warnings.push('Tuổi không hợp lệ (phải từ 0-120)');
          }
        } else {
          warnings.push('Vui lòng cung cấp tuổi dưới dạng số');
        }
        break;
        
      case 'gender':
        // Normalize gender input (support both Vietnamese and English)
        const genderLower = input.toLowerCase();
        if (genderLower.includes('nam') && !genderLower.includes('nữ')) {
          enhancedValue = 'Nam';
        } else if (genderLower.includes('nữ')) {
          enhancedValue = 'Nữ';
        } else if (genderLower.includes('khác')) {
          enhancedValue = 'Khác';
        } else if (genderLower.includes('male') && !genderLower.includes('female')) {
          enhancedValue = 'Nam';
        } else if (genderLower.includes('female')) {
          enhancedValue = 'Nữ';
        } else if (genderLower.includes('other')) {
          enhancedValue = 'Khác';
        }
        break;
        
      case 'primaryConcern':
        // Basic medical term validation (minimum 3 characters for flexibility)
        if (input.length < 3) {
          warnings.push('Vui lòng mô tả chi tiết hơn về triệu chứng');
        }
        // Translate common English symptoms to Vietnamese for consistency
        const symptomTranslations = {
          'headache': 'đau đầu',
          'fever': 'sốt',
          'cough': 'ho',
          'pain': 'đau',
          'cold': 'cảm lạnh',
          'flu': 'cảm cúm'
        };
        
        let translatedSymptom = input;
        Object.keys(symptomTranslations).forEach(eng => {
          const regex = new RegExp(`\\b${eng}\\b`, 'gi');
          if (regex.test(translatedSymptom)) {
            translatedSymptom = translatedSymptom.replace(regex, symptomTranslations[eng]);
          }
        });
        
        if (translatedSymptom !== input) {
          enhancedValue = translatedSymptom;
        }
        break;
        
      case 'location':
        // Keep user's exact location text to maximize geocoding accuracy
        // Only trim excessive whitespace; do not override with generic city names
        enhancedValue = input.trim();
        break;
    }
    
    return { value: enhancedValue, warnings };
  }

  cleanUpExpiredConversations() {
    const now = Date.now();
    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.updatedAt > CONVERSATION_TTL_MS) {
        this.conversations.delete(id);
      }
    }
  }
}

module.exports = new AiDoctorConversationService();


