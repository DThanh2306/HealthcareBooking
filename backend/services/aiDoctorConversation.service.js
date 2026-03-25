const { randomUUID } = require("crypto");
const aiDoctorRecommendationService = require("./aiDoctorRecommendation.service");
const enhancedMedicalKnowledge = require("./enhancedMedicalKnowledge.service");
const improvedRagLLM = require("./improvedRagLLM.service");
const aiDoctorTraining = require("./aiDoctorTraining.service");
const ragLLMService = require("./ragLLM.service");

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
      // Validate and enhance user input
      const validatedInput = this.validateAndEnhanceInput(currentStep.key, userMessage.trim());
      conversation.state[currentStep.key] = validatedInput.value;
      
      // Add medical context if it's a symptom step
      if (currentStep.key === 'primaryConcern' && validatedInput.value) {
        const symptomAnalysis = enhancedMedicalKnowledge.analyzeSymptoms(validatedInput.value);
        conversation.state._symptomAnalysis = symptomAnalysis;
      }
      
      let acknowledgement = currentStep.acknowledgement(validatedInput.value);
      
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
      // Use enhanced medical knowledge for better analysis
      const enhancedAnalysis = enhancedMedicalKnowledge.comprehensiveAnalysis(conversation.state);
      
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
        // Extract and validate age
        const ageMatch = input.match(/(\d+)/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          if (age > 0 && age <= 120) {
            enhancedValue = age.toString();
          } else {
            warnings.push('Tuổi không hợp lệ');
          }
        } else {
          warnings.push('Vui lòng cung cấp tuổi dưới dạng số');
        }
        break;
        
      case 'gender':
        // Normalize gender input
        const genderLower = input.toLowerCase();
        if (genderLower.includes('nam') && !genderLower.includes('nữ')) {
          enhancedValue = 'Nam';
        } else if (genderLower.includes('nữ')) {
          enhancedValue = 'Nữ';
        } else if (genderLower.includes('khác')) {
          enhancedValue = 'Khác';
        }
        break;
        
      case 'primaryConcern':
        // Basic medical term validation
        if (input.length < 10) {
          warnings.push('Vui lòng mô tả chi tiết hơn về triệu chứng');
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


