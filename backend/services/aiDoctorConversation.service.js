const { randomUUID } = require("crypto");
const aiDoctorRecommendationService = require("./aiDoctorRecommendation.service");
const enhancedMedicalKnowledge = require("./enhancedMedicalKnowledge.service");
const improvedRagLLM = require("./improvedRagLLM.service");
const aiDoctorTraining = require("./aiDoctorTraining.service");
const ragLLMService = require("./ragLLM.service");
const conversationIntelligence = require("./conversationIntelligence.service");

const CONVERSATION_TTL_MS = 30 * 60 * 1000;
const GROQ_CONVERSATION_PROMPT = `Bạn là Bác sĩ AI của BookingCare - trợ lý y tế thân thiện tại Việt Nam.

NHIỆM VỤ: Thu thập đủ 5 thông tin sau một cách TỰ NHIÊN, không hỏi theo thứ tự cứng nhắc:
- gender: giới tính (Nam/Nữ/Khác)
- age: tuổi
- location: địa chỉ/khu vực muốn khám
- primaryConcern: triệu chứng chính
- symptomDuration: triệu chứng kéo dài bao lâu

THÔNG TIN ĐÃ CÓ: {COLLECTED}

QUY TẮC:
- Nếu user đã cung cấp thông tin nào → ghi nhận và hỏi thông tin còn thiếu
- Nếu user hỏi lạc đề → trả lời ngắn rồi redirect
- Nếu có dấu hiệu KHẨN CẤP (khó thở, đau ngực dữ dội, bất tỉnh) → cảnh báo gọi 115 NGAY
- Hỏi tự nhiên, có thể gộp 2 câu hỏi ngắn vào 1 tin nhắn
- Trả lời bằng tiếng Việt

KHI ĐÃ ĐỦ CẢ 5 THÔNG TIN → chỉ trả về đúng format này, không thêm gì khác:
<READY>{"gender":"...","age":"...","location":"...","primaryConcern":"...","symptomDuration":"..."}</READY>`;
const STEPS = [
  
  {
    key: "gender",
    question:
      "Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn (nam, nữ hoặc khác)?",
    acknowledgement: (answer) =>
      `Đã ghi nhận giới tính của bạn là "${answer}".`,
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
const INPUT_CONFIGS = {
  gender: {
    type: "single",
    options: ["Nam", "Nữ", "Khác"],
    allowFreetext: false,
  },
  age: {
    type: "single",
    options: ["Dưới 18", "18–35", "36–60", "Trên 60"],
    allowFreetext: true,
    freetextPlaceholder: "Hoặc nhập tuổi cụ thể, vd: 42",
  },
  location: {
    type: "location",
    options: [],
    allowFreetext: true,
    freetextPlaceholder: "Nhập địa chỉ, vd: 123 Lê Lợi, Quận 1, TP.HCM",
    allowGPS: true,
  },
  primaryConcern: {
    type: "multi",
    options: [
      "Đau đầu / chóng mặt",
      "Sốt",
      "Ho / khó thở",
      "Đau ngực",
      "Đau bụng / tiêu hóa",
      "Đau lưng / xương khớp",
      "Mệt mỏi kéo dài",
      "Da liễu (mụn, ngứa, phát ban)",
      "Mắt / tai / mũi / họng",
      "Tâm lý / mất ngủ",
      "Khác...",
    ],
    allowFreetext: true,
    freetextPlaceholder: "Mô tả thêm triệu chứng nếu muốn...",
  },
  symptomDuration: {
    type: "single",
    options: ["Hôm nay", "2–3 ngày", "Khoảng 1 tuần", "Hơn 2 tuần", "Hơn 1 tháng"],
    allowFreetext: true,
    freetextPlaceholder: "Hoặc nhập cụ thể...",
  },
};
class AiDoctorConversationService {
  constructor() {
    this.conversations = new Map();
    setInterval(
      () => this.cleanUpExpiredConversations(),
      10 * 60 * 1000,
    ).unref();
  }
  getInputConfig(stepKey) {
    return INPUT_CONFIGS[stepKey] || { type: "freetext", allowFreetext: true };
  }
  /**
   * Detect user's preferred language from their message
   */
  async callGroqConversation(conversation) {
    const groqApiKey = process.env.GROQ_API_KEY || "";
    const groqModel =
      process.env.GROQ_MODEL_NAME || process.env.GROQ_MODEL || "";

    if (!groqApiKey || !groqModel) {
      return null;
    }

    // Tóm tắt thông tin đã thu thập
    const collected =
      Object.entries(conversation.state)
        .filter(([k]) =>
          [
            "gender",
            "age",
            "location",
            "primaryConcern",
            "symptomDuration",
          ].includes(k),
        )
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ") || "Chưa có";

    const systemPrompt = GROQ_CONVERSATION_PROMPT.replace(
      "{COLLECTED}",
      collected,
    );

    // Chỉ lấy 10 tin nhắn gần nhất để tiết kiệm token
    const recentHistory = conversation.history.slice(-10);

    try {
      const baseUrl = (
        process.env.GROQ_BASE_URL || "https://api.groq.com"
      ).replace(/\/+$/, "");
      const response = await axios.post(
        `${baseUrl}/openai/v1/chat/completions`,
        {
          model: groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentHistory,
          ],
          temperature: 0.4,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      return content || null;
    } catch (error) {
      // KHÔNG cache lỗi, để retry lần sau
      console.error(
        "⚠️ Groq conversation error:",
        error.response?.status,
        error.message,
      );
      return null;
    }
  }

  async callGroqConversation(conversation) {
    const groqApiKey = process.env.GROQ_API_KEY || "";
    const groqModel =
      process.env.GROQ_MODEL_NAME || process.env.GROQ_MODEL || "";

    if (!groqApiKey || !groqModel) {
      return null;
    }

    // Tóm tắt thông tin đã thu thập
    const collected =
      Object.entries(conversation.state)
        .filter(([k]) =>
          [
            "gender",
            "age",
            "location",
            "primaryConcern",
            "symptomDuration",
          ].includes(k),
        )
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ") || "Chưa có";

    const systemPrompt = GROQ_CONVERSATION_PROMPT.replace(
      "{COLLECTED}",
      collected,
    );

    // Chỉ lấy 10 tin nhắn gần nhất để tiết kiệm token
    const recentHistory = conversation.history.slice(-10);

    try {
      const baseUrl = (
        process.env.GROQ_BASE_URL || "https://api.groq.com"
      ).replace(/\/+$/, "");
      const response = await axios.post(
        `${baseUrl}/openai/v1/chat/completions`,
        {
          model: groqModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentHistory,
          ],
          temperature: 0.4,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      return content || null;
    } catch (error) {
      // KHÔNG cache lỗi, để retry lần sau
      console.error(
        "⚠️ Groq conversation error:",
        error.response?.status,
        error.message,
      );
      return null;
    }
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
      inputConfig: this.getInputConfig(STEPS[0].key),  // gender
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
          "Cuộc trò chuyện đã hoàn tất. Nếu cần hỗ trợ thêm, hãy bắt đầu cuộc trò chuyện mới.",
        followUp: false,
        state: conversation.state,
        recommendations: conversation.recommendations,
      };
    }

    // Thêm tin nhắn user vào history
    conversation.history.push({ role: "user", content: userMessage });

    // Gọi Groq để xử lý hội thoại tự nhiên
    const groqReply = await this.callGroqConversation(conversation);

    if (groqReply) {
      // Kiểm tra xem đã đủ thông tin chưa
      const readyMatch = groqReply.match(/<READY>([\s\S]*?)<\/READY>/);

      if (readyMatch) {
        // Parse state từ Groq
        try {
          const extracted = JSON.parse(readyMatch[1].trim());
          conversation.state = { ...conversation.state, ...extracted };
          console.log("✅ Đủ thông tin:", conversation.state);
        } catch (e) {
          console.error("❌ Parse state lỗi:", e.message);
        }

        // Chạy recommendation như cũ
        return await this.runRecommendation(conversation, options);
      }

      // Chưa đủ → tiếp tục hội thoại
      conversation.history.push({ role: "assistant", content: groqReply });
      const nextMissingKey = this._detectNextMissingField(conversation.state);
      return {
        message: groqReply,
        followUp: true,
        state: conversation.state,
        inputConfig: this.getInputConfig(nextMissingKey),
      };
    }

    // Groq lỗi → fallback về STEPS cũ
    console.log("🔄 Groq unavailable, fallback to STEPS");
    return this.processWithSteps(conversation, userMessage, options);
  }
  createStateSummary(state) {
    const entries = [
      state.gender ? `Giới tính: ${state.gender}` : null,
      state.age ? `Tuổi: ${state.age}` : null,
      state.location ? `Khu vực: ${state.location}` : null,
      state.primaryConcern
        ? `Triệu chứng chính: ${state.primaryConcern}`
        : null,
      state.symptomDuration
        ? `Thời gian diễn ra: ${state.symptomDuration}`
        : null,
      state.medicalHistory ? `Tiền sử sức khỏe: ${state.medicalHistory}` : null,
      state.currentMedications
        ? `Thuốc đang dùng: ${state.currentMedications}`
        : null,
      state.expectations ? `Mong muốn: ${state.expectations}` : null,
    ].filter(Boolean);

    return entries.join("\n");
  }
  // Chạy recommendation (tách ra để dùng chung)
  async runRecommendation(conversation, options = {}) {
    conversation.status = "processing";

    if (options?.radiusKm) conversation.state.radiusKm = options.radiusKm;

    const enhancedAnalysis = enhancedMedicalKnowledge.comprehensiveAnalysis(
      conversation.state,
    );
    const recommendations =
      await aiDoctorRecommendationService.getRecommendations(
        conversation.state,
      );

    if (enhancedAnalysis) {
      recommendations.enhancedAnalysis = enhancedAnalysis;
      recommendations.medicalContext = enhancedAnalysis.medicalContext;
      if (enhancedAnalysis.urgencyLevel) {
        recommendations.medicalContext.urgencyLevel =
          enhancedAnalysis.urgencyLevel;
      }
    }

    const finalMessage = await this.generateFinalMessage(
      conversation.state,
      recommendations,
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

  // Fallback về STEPS cũ khi Groq lỗi
  async processWithSteps(conversation, userMessage, options) {
    const currentStep = STEPS[conversation.stepIndex];

    if (!currentStep) {
      return await this.runRecommendation(conversation, options);
    }

    // Detect emergency đơn giản
    const emergencyKeywords = [
      "khó thở",
      "đau ngực",
      "bất tỉnh",
      "ngã",
      "tai nạn",
      "chảy máu nhiều",
    ];
    if (emergencyKeywords.some((k) => userMessage.toLowerCase().includes(k))) {
      const emergencyMsg =
        "🚨 Đây có thể là tình huống khẩn cấp! Hãy gọi 115 hoặc đến cơ sở y tế gần nhất NGAY LẬP TỨC.";
      conversation.history.push({ role: "assistant", content: emergencyMsg });
      return {
        message: emergencyMsg,
        followUp: true,
        state: conversation.state,
      };
    }

    // Lưu answer vào state
    const validated = this.validateAndEnhanceInput(
      currentStep.key,
      userMessage.trim(),
    );
    conversation.state[currentStep.key] = validated.value;
    conversation.stepIndex += 1;

    if (conversation.stepIndex < STEPS.length) {
      const ack =
        typeof currentStep.acknowledgement === "function"
          ? currentStep.acknowledgement(validated.value)
          : `Đã ghi nhận: ${validated.value}`;
      const nextQ = STEPS[conversation.stepIndex].question;
      const msg = `${ack}\n\n${nextQ}`;
      conversation.history.push({ role: "assistant", content: msg });
      const nextStep = STEPS[conversation.stepIndex];
      return {
        message: msg,
        followUp: true,
        state: conversation.state,
        inputConfig: this.getInputConfig(nextStep.key),
      };
    }

    // Đủ 5 bước → recommend
    return await this.runRecommendation(conversation, options);
  }
  _detectNextMissingField(state) {
    const order = ["gender", "age", "location", "primaryConcern", "symptomDuration"];
    for (const key of order) {
      if (!state[key]) return key;
    }
    return null; // tất cả đã đủ
  }
  createRecommendationSummary(recommendations) {
    if (!recommendations) return "";

    const lines = [];

    if (
      recommendations.specialties &&
      Array.isArray(recommendations.specialties) &&
      recommendations.specialties.length
    ) {
      lines.push(
        `Chuyên khoa gợi ý: ${recommendations.specialties.join(", ")}.`,
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
          }`,
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
      const response = await improvedRagLLM.generateAdvancedAdvice(
        state,
        recommendations,
        {
          stateSummary: patientSummary,
          recommendationSummary,
        },
      );
      if (response) {
        // Store training data for future improvements
        await aiDoctorTraining.collectTrainingData(
          state.conversationId || "unknown",
          state,
          { recommendations, confidence: recommendations.confidence || 0.8 },
          { helpful: null, accurate: null, rating: null }, // Will be filled by user feedback
        );
        return response;
      }
    } catch (error) {
      console.error("❌ Advanced RAG LLM generation failed:", error.message);
      // Fallback to original service
      try {
        const response = await ragLLMService.generateAdvice(
          state,
          recommendations,
          {
            stateSummary: patientSummary,
            recommendationSummary,
          },
        );
        if (response) {
          return response;
        }
      } catch (fallbackError) {
        console.error(
          "❌ Fallback RAG LLM generation failed:",
          fallbackError.message,
        );
      }
    }

    const fallbackSummary = [
      "Cảm ơn bạn đã cung cấp đầy đủ thông tin. Dựa trên dữ liệu hiện có, tôi đề xuất bạn nên thăm khám tại các chuyên khoa và cơ sở sau:",
      recommendationSummary ||
        "- Chúng tôi đang cập nhật thêm dữ liệu bác sĩ phù hợp.",
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
      case "age":
        // Extract and validate age (support both Vietnamese and English)
        const ageMatch = input.match(/(\d+)/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          if (age > 0 && age <= 120) {
            enhancedValue = age.toString();
          } else {
            warnings.push("Tuổi không hợp lệ (phải từ 0-120)");
          }
        } else {
          warnings.push("Vui lòng cung cấp tuổi dưới dạng số");
        }
        break;

      case "gender":
        // Normalize gender input (support both Vietnamese and English)
        const genderLower = input.toLowerCase();
        if (genderLower.includes("nam") && !genderLower.includes("nữ")) {
          enhancedValue = "Nam";
        } else if (genderLower.includes("nữ")) {
          enhancedValue = "Nữ";
        } else if (genderLower.includes("khác")) {
          enhancedValue = "Khác";
        } else if (
          genderLower.includes("male") &&
          !genderLower.includes("female")
        ) {
          enhancedValue = "Nam";
        } else if (genderLower.includes("female")) {
          enhancedValue = "Nữ";
        } else if (genderLower.includes("other")) {
          enhancedValue = "Khác";
        }
        break;

      case "primaryConcern":
        // Basic medical term validation (minimum 3 characters for flexibility)
        if (input.length < 3) {
          warnings.push("Vui lòng mô tả chi tiết hơn về triệu chứng");
        }
        // Translate common English symptoms to Vietnamese for consistency
        const symptomTranslations = {
          headache: "đau đầu",
          fever: "sốt",
          cough: "ho",
          pain: "đau",
          cold: "cảm lạnh",
          flu: "cảm cúm",
        };

        let translatedSymptom = input;
        Object.keys(symptomTranslations).forEach((eng) => {
          const regex = new RegExp(`\\b${eng}\\b`, "gi");
          if (regex.test(translatedSymptom)) {
            translatedSymptom = translatedSymptom.replace(
              regex,
              symptomTranslations[eng],
            );
          }
        });

        if (translatedSymptom !== input) {
          enhancedValue = translatedSymptom;
        }
        break;

      case "location":
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
