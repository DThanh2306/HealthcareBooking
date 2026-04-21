const aiDoctorKnowledge = require("./aiDoctorKnowledge.service");
const enhancedMedicalKnowledge = require("./enhancedMedicalKnowledge.service");
const medicalLibrary = require("./medicalLibrary.service");
const enhancedFallbackLLM = require("./enhancedFallbackLLM.service");
const axios = require("axios");

class ImprovedRagLLMService {
  constructor() {
    this.contextLimit = Number(process.env.RAG_CONTEXT_DOCS ?? 8); // Tăng số lượng context
    this.groqApiKey = process.env.GROQ_API_KEY || "";
    this.groqModel = process.env.GROQ_MODEL_NAME || process.env.GROQ_MODEL || "";
    
    // Cải thiện cấu hình LLM
    this.llmConfig = {
      temperature: 0.2, // Giảm temperature để câu trả lời ổn định hơn
      maxTokens: 1200, // Tăng token để phản hồi chi tiết hơn
      topP: 0.8,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    };

    // System prompt được cải thiện
    this.systemPrompt = `Bạn là bác sĩ chuyên khoa AI với kinh nghiệm lâm sàng phong phú tại Việt Nam. Nhiệm vụ của bạn là:

1. PHÂN TÍCH CHÍNH XÁC: Đánh giá triệu chứng dựa trên bằng chứng y khoa
2. TƯ VẤN AN TOÀN: Ưu tiên an toàn bệnh nhân, không bỏ qua dấu hiệu nguy hiểm
3. HƯỚNG DẪN RÕ RÀNG: Đưa ra lời khuyên cụ thể, dễ hiểu và thực tế
4. CHUYÊN NGHIỆP: Giữ thái độ chuyên nghiệp nhưng thân thiện

QUY TẮC QUAN TRỌNG:
- KHÔNG tự ý chẩn đoán xác định - chỉ đưa ra các khả năng cần xem xét
- KHÔNG kê đơn thuốc cụ thể - chỉ gợi ý loại thuốc chung
- LUÔN nhấn mạnh cần khám bác sĩ khi cần thiết
- ƯU TIÊN cảnh báo về các dấu hiệu nguy hiểm
- SỬ DỤNG ngôn ngữ dễ hiểu, tránh thuật ngữ y khoa phức tạp`;
  }

  // Xây dựng query thông minh hơn
  buildAdvancedPatientQuery(state, recommendations) {
    const queryParts = [];
    
    // Thông tin cơ bản
    if (state.age) queryParts.push(`tuổi ${state.age}`);
    if (state.gender) queryParts.push(`giới tính ${state.gender}`);
    if (state.location) queryParts.push(`khu vực ${state.location}`);

    // Triệu chứng chính với từ đồng nghĩa
    if (state.primaryConcern) {
      const expandedSymptoms = this.expandSymptoms(state.primaryConcern);
      queryParts.push(`triệu chứng ${expandedSymptoms}`);
    }

    // Thông tin bổ sung
    if (state.symptomDuration) queryParts.push(`thời gian ${state.symptomDuration}`);
    if (state.medicalHistory) queryParts.push(`tiền sử ${state.medicalHistory}`);
    if (state.currentMedications) queryParts.push(`thuốc hiện tại ${state.currentMedications}`);

    // Chuyên khoa được đề xuất
    if (recommendations?.specialties?.length) {
      queryParts.push(`chuyên khoa ${recommendations.specialties.join(" ")}`);
    }

    // Mức độ khẩn cấp
    if (recommendations?.medicalContext?.urgencyLevel) {
      queryParts.push(`mức độ ${recommendations.medicalContext.urgencyLevel}`);
    }

    return queryParts.join(". ");
  }

  // Mở rộng triệu chứng với từ đồng nghĩa
  expandSymptoms(symptoms) {
    if (!symptoms) return "";
    
    const synonyms = {
      "đau": ["nhức", "buốt", "tức", "cắn"],
      "khó thở": ["hụt hơi", "ngạt thở", "thở gấp"],
      "mệt mỏi": ["mệt lử", "kiệt sức", "uể oải"],
      "sốt": ["nóng sốt", "bị sốt", "có sốt"],
      "ho": ["khạc", "ho khan", "ho có đờm"],
      "chóng mặt": ["hoa mắt", "choáng váng"]
    };

    let expandedSymptoms = symptoms;
    for (const [key, values] of Object.entries(synonyms)) {
      if (symptoms.toLowerCase().includes(key)) {
        expandedSymptoms += " " + values.join(" ");
      }
    }

    return expandedSymptoms;
  }

  // Định dạng document context chi tiết hơn
  formatAdvancedDocumentContext(doc, score, index) {
    if (!doc) return "";

    const sections = [];
    const prefix = doc.type === "doctor" ? "🩺 Bác sĩ" : "🏥 Cơ sở";
    
    // Thông tin cơ bản
    sections.push(`${index + 1}. ${prefix}: **${doc.name}**`);
    
    // Chuyên khoa
    if (doc.specialty) {
      sections.push(`   - Chuyên khoa: ${doc.specialty}`);
    }
    
    // Địa chỉ và bệnh viện
    if (doc.hospitalName) {
      sections.push(`   - Thuộc: ${doc.hospitalName}`);
    }
    if (doc.hospitalAddress) {
      sections.push(`   - Địa chỉ: ${doc.hospitalAddress}`);
    }
    
    // Giá cả
    if (doc.price != null) {
      const formattedPrice = Number(doc.price).toLocaleString("vi-VN");
      sections.push(`   - Giá tham khảo: ${formattedPrice} đ/lần khám`);
    }
    
    // Điểm phù hợp
    const matchPercentage = (score * 100).toFixed(1);
    sections.push(`   - Độ phù hợp: ${matchPercentage}%`);
    
    return sections.join("\n");
  }

  // Xây dựng context nâng cao
  async buildAdvancedContext(state, recommendations) {
    const query = this.buildAdvancedPatientQuery(state, recommendations);
    if (!query) return { contextText: "", retrievedDocs: [], stats: {} };

    // Tìm kiếm với nhiều strategy
    const searchStrategies = [
      // Strategy 1: Tìm theo triệu chứng chính
      { query: state.primaryConcern, weight: 1.0, limit: 4 },
      // Strategy 2: Tìm theo chuyên khoa
      { 
        query: recommendations?.specialties?.join(" ") || "", 
        weight: 0.8, 
        limit: 2 
      },
      // Strategy 3: Tìm theo địa điểm
      { 
        query: state.location || "", 
        weight: 0.6, 
        limit: 2 
      }
    ];

    const allResults = new Map(); // Để tránh trùng lặp
    let totalSearched = 0;

    for (const strategy of searchStrategies) {
      if (!strategy.query.trim()) continue;
      
      try {
        const results = await aiDoctorKnowledge.query(strategy.query, {
          limit: strategy.limit,
          location: state.location,
        });

        totalSearched += results?.length || 0;

        results?.forEach(({ doc, score }) => {
          const key = `${doc.type}_${doc.name}_${doc.hospitalId || 'no_hospital'}`;
          const adjustedScore = score * strategy.weight;
          
          if (!allResults.has(key) || allResults.get(key).score < adjustedScore) {
            allResults.set(key, { doc, score: adjustedScore });
          }
        });
      } catch (error) {
        console.warn(`Search strategy failed for query: ${strategy.query}`, error.message);
      }
    }

    // Sắp xếp và giới hạn kết quả
    const sortedResults = Array.from(allResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.contextLimit);

    if (!sortedResults.length) {
      return { 
        contextText: "Không tìm thấy thông tin phù hợp trong cơ sở dữ liệu.", 
        retrievedDocs: [],
        stats: { searched: totalSearched, found: 0 }
      };
    }

    const contextLines = sortedResults.map(({ doc, score }, index) =>
      this.formatAdvancedDocumentContext(doc, score, index)
    );

    return {
      contextText: contextLines.join("\n\n"),
      retrievedDocs: sortedResults.map(({ doc }) => doc),
      stats: { 
        searched: totalSearched, 
        found: sortedResults.length,
        averageScore: (sortedResults.reduce((sum, r) => sum + r.score, 0) / sortedResults.length).toFixed(3)
      }
    };
  }

  // Xây dựng medical insights nâng cao
  buildAdvancedMedicalInsights(primaryConcern, patientData) {
    if (!primaryConcern) {
      return { text: "", matches: [], analysis: null };
    }

    // Sử dụng enhanced medical knowledge
    const analysis = enhancedMedicalKnowledge.comprehensiveAnalysis(patientData);
    
    // Tìm kiếm trong medical library
    const libraryMatches = medicalLibrary.searchBySymptoms(primaryConcern, {
      limit: 3,
    });

    if (!libraryMatches.length && !analysis) {
      return { text: "", matches: [], analysis: null };
    }

    const insights = [];

    // Thêm phân tích từ enhanced knowledge
    if (analysis) {
      insights.push("📊 **Phân tích thông minh từ hệ thống:**");
      
      if (analysis.recommendedSpecialties && Array.isArray(analysis.recommendedSpecialties)) {
        insights.push(`- Chuyên khoa đề xuất: ${analysis.recommendedSpecialties.join(", ")}`);
      }
      
      if (analysis.urgencyLevel) {
        insights.push(`- Mức độ khẩn cấp: ${analysis.urgencyLevel}`);
      }
      
      if (analysis.confidence !== undefined) {
        insights.push(`- Độ tin cậy: ${(analysis.confidence * 100).toFixed(1)}%`);
      }
      
      if (analysis.matchedSymptoms && Array.isArray(analysis.matchedSymptoms) && analysis.matchedSymptoms.length) {
        insights.push(`- Triệu chứng khớp: ${analysis.matchedSymptoms.join(", ")}`);
      }
      
      if (analysis.systemsAffected && Array.isArray(analysis.systemsAffected) && analysis.systemsAffected.length) {
        insights.push(`- Hệ thống ảnh hưởng: ${analysis.systemsAffected.join(", ")}`);
      }

      insights.push("");
    }

    // Thêm thông tin từ medical library
    if (libraryMatches.length) {
      insights.push("📚 **Kiến thức y khoa tham khảo:**");
      
      libraryMatches.forEach((entry, index) => {
        insights.push(`${index + 1}. **${entry.category}**`);
        insights.push(`   ${entry.summary}`);

        if (entry.careTips && Array.isArray(entry.careTips) && entry.careTips.length) {
          insights.push(`   🔧 Chăm sóc: ${entry.careTips.slice(0, 2).join("; ")}`);
        }

        if (entry.warningSigns && Array.isArray(entry.warningSigns) && entry.warningSigns.length) {
          insights.push(`   ⚠️ Cảnh báo: ${entry.warningSigns.slice(0, 2).join("; ")}`);
        }

        if (entry.recommendedSpecialties && Array.isArray(entry.recommendedSpecialties) && entry.recommendedSpecialties.length) {
          insights.push(`   🏥 Nên khám: ${entry.recommendedSpecialties.join(", ")}`);
        }

        insights.push("");
      });
    }

    return { 
      text: insights.join("\n"), 
      matches: libraryMatches, 
      analysis: analysis 
    };
  }

  // Xây dựng safety notice thông minh hơn
  buildAdvancedSafetyNotice(urgencyLevel, patientData, analysis) {
    const age = parseInt(patientData.age) || 25;
    const isHighRisk = age < 5 || age > 65;
    
    let notice = [];

    switch (urgencyLevel) {
      case 'khẩn cấp':
        notice.push("🚨 **CẢNH BÁO KHẨN CẤP**");
        notice.push("- Đến bệnh viện hoặc gọi 115 NGAY LẬP TỨC");
        notice.push("- KHÔNG chờ đợi hoặc tự điều trị tại nhà");
        if (isHighRisk) {
          notice.push("- Đặc biệt nguy hiểm do tuổi tác - cần cấp cứu ưu tiên");
        }
        break;
        
      case 'cần khám sớm':
        notice.push("⚠️ **CẦN KHÁM SỚM**");
        notice.push("- Đặt lịch khám trong 24-48 giờ tới");
        notice.push("- Theo dõi sát diễn biến, đi cấp cứu nếu nặng thêm");
        if (isHighRisk) {
          notice.push("- Do tuổi tác, nên khám sớm hơn (trong 12-24h)");
        }
        break;
        
      default:
        notice.push("ℹ️ **THEO DÕI VÀ QUAN SÁT**");
        notice.push("- Theo dõi triệu chứng 3-5 ngày");
        notice.push("- Nghỉ ngơi, uống nước đầy đủ");
        notice.push("- Đi khám nếu không cải thiện hoặc nặng lên");
    }

    // Thêm hướng dẫn cụ thể từ analysis
    if (analysis?.medicalContext?.recommendedActions) {
      notice.push("");
      notice.push("📋 **HƯỚNG DẪN CỤ THỂ:**");
      analysis.medicalContext.recommendedActions.forEach(action => {
        notice.push(`- ${action}`);
      });
    }

    notice.push("");
    notice.push("⚕️ **LƯU Ý QUAN TRỌNG:**");
    notice.push("- Thông tin này chỉ mang tính tham khảo");
    notice.push("- Không thay thế việc khám và điều trị của bác sĩ");
    notice.push("- Khi nghi ngờ, hãy tìm đến cơ sở y tế");

    return notice.join("\n");
  }

  // Tạo prompt nâng cao cho LLM
  buildAdvancedPrompt(payload) {
    const { 
      stateSummary, 
      recommendationSummary, 
      contextText, 
      medicalInsights, 
      safetyNotice,
      stats 
    } = payload;

    const promptSections = [
      "🏥 **THÔNG TIN BỆNH NHÂN:**",
      stateSummary || "- Thông tin chưa đầy đủ",
      "",
      "🔍 **PHÂN TÍCH VÀ ĐỀ XUẤT HỆ THỐNG:**",
      recommendationSummary || "- Hệ thống đang phân tích",
      "",
      "💾 **DỮ LIỆU BÁC SĨ/BỆNH VIỆN (RAG):**",
      contextText || "- Không tìm thấy dữ liệu phù hợp",
      "",
      "📊 **KIẾN THỨC Y KHOA CHUYÊN MÔN:**",
      medicalInsights || "- Chưa có dữ liệu chi tiết",
      "",
      "🛡️ **HƯỚNG DẪN AN TOÀN:**",
      safetyNotice,
      "",
      "📝 **YÊU CẦU TƯ VẤN:**",
      "1. Tóm tắt tình hình sức khỏe dựa trên thông tin đã cung cấp",
      "2. Phân tích 2-3 khả năng cần xem xét (KHÔNG chẩn đoán xác định)",
      "3. Đề xuất 2-3 chuyên khoa phù hợp và lý do",
      "4. Hướng dẫn chăm sóc ban đầu an toàn tại nhà",
      "5. Cảnh báo rõ ràng về thời điểm cần đi khám gấp",
      "6. Lời khuyên về theo dõi và tái khám",
      "",
      "⚠️ **QUAN TRỌNG:**",
      "- KHÔNG kê đơn thuốc cụ thể",
      "- LUÔN khuyến khích khám bác sĩ khi cần",
      "- Ưu tiên an toàn bệnh nhân"
    ];

    return promptSections.join("\n");
  }

  // Gọi Groq LLM với cải thiện và error handling
  async callAdvancedGroqLLM(payload) {
    if (!this.groqApiKey || !this.groqModel) {
      console.warn("⚠️ Groq API not configured, using fallback response");
      return null;
    }

    // Check if organization is restricted (cached check)
    // Reset sau 5 phút để retry
    if (this._organizationRestricted) {
      const now = Date.now();
      if (now - this._restrictedAt < 5 * 60 * 1000) {
        console.warn("⚠️ Groq restricted (cooling down), using fallback");
        return null;
      }
      // Hết cooldown → thử lại
      this._organizationRestricted = false;
      console.log("🔄 Groq cooldown expired, retrying...");
    }

    const promptContent = this.buildAdvancedPrompt(payload);

    const requestBody = {
      model: this.groqModel,
      messages: [
        {
          role: "system",
          content: this.systemPrompt
        },
        { 
          role: "user", 
          content: promptContent 
        }
      ],
      temperature: this.llmConfig.temperature,
      max_tokens: this.llmConfig.maxTokens,
      top_p: this.llmConfig.topP,
      frequency_penalty: this.llmConfig.frequencyPenalty,
      presence_penalty: this.llmConfig.presencePenalty,
      stop: ["Human:", "Assistant:"] // Ngăn model tiếp tục tự hỏi đáp
    };

    try {
      const baseUrl = process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com";
      const normalizedBase = baseUrl.replace(/\/+$/, "");
      const url = `${normalizedBase}/openai/v1/chat/completions`;

      const response = await axios.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: Number(process.env.GROQ_TIMEOUT_MS ?? 20000), // Tăng timeout
      });

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        console.warn("⚠️ Empty response from Groq LLM");
        return null;
      }

      // Log usage statistics
      if (response.data?.usage) {
        console.log("📊 LLM Usage:", {
          prompt_tokens: response.data.usage.prompt_tokens,
          completion_tokens: response.data.usage.completion_tokens,
          total_tokens: response.data.usage.total_tokens
        });
      }

      return content;
    } catch (error) {
      console.error("❌ Groq LLM Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      // Handle organization restriction
      if (error.response?.status === 400 && 
          error.response?.data?.error?.message?.includes('organization_restricted')) {
        console.warn("🔒 Groq organization restricted - caching this state");
        this._organizationRestricted = true;
        this._restrictedAt = Date.now();
      }

      return null;
    }
  }

  // Tạo fallback response cải tiến
  createAdvancedFallbackResponse(payload) {
    const { 
      stateSummary, 
      recommendationSummary, 
      contextText, 
      medicalInsights, 
      safetyNotice 
    } = payload;

    const sections = [
      "🏥 **ĐÁNH GIÁ SƠ BỘ**",
      stateSummary || "Cần thêm thông tin để đánh giá chính xác hơn.",
      "",
      "🎯 **GỢI Ý CHUYÊN KHOA**",
      recommendationSummary || "Hệ thống đang phân tích để đưa ra gợi ý phù hợp.",
      "",
      "🔍 **BÁC SĨ/BỆNH VIỆN ĐƯỢC ĐỀ XUẤT**",
      contextText || "Không tìm thấy bác sĩ/bệnh viện phù hợp trong khu vực.",
      ""
    ];

    if (medicalInsights) {
      sections.push("📚 **KIẾN THỨC Y KHOA**");
      sections.push(medicalInsights);
      sections.push("");
    }

    sections.push("🛡️ **HƯỚNG DẪN AN TOÀN**");
    sections.push(safetyNotice);
    sections.push("");
    sections.push("💡 **LỜI KHUYÊN**");
    sections.push("Để có thông tin chính xác và đầy đủ nhất, bạn nên:");
    sections.push("- Đặt lịch khám với bác sĩ chuyên khoa");
    sections.push("- Chuẩn bị đầy đủ thông tin triệu chứng và tiền sử");
    sections.push("- Không trì hoãn nếu có dấu hiệu báo động");

    return sections.join("\n");
  }

  // Hàm chính tạo advice cải tiến
  async generateAdvancedAdvice(state, recommendations, helpers) {
    const { stateSummary, recommendationSummary } = helpers;
    
    console.log("🚀 Starting advanced advice generation...");
    
    // 1. Xây dựng context nâng cao
    const { contextText, retrievedDocs, stats } = await this.buildAdvancedContext(state, recommendations);
    console.log("📊 Context stats:", stats);
    
    // 2. Xây dựng medical insights nâng cao
    const { text: medicalInsights, analysis } = this.buildAdvancedMedicalInsights(
      state.primaryConcern, 
      state
    );
    
    // 3. Xác định urgency level
    const urgencyLevel = analysis?.urgencyLevel || 
                        recommendations?.medicalContext?.urgencyLevel || 
                        'cần theo dõi';
    
    // 4. Xây dựng safety notice nâng cao
    const safetyNotice = this.buildAdvancedSafetyNotice(urgencyLevel, state, analysis);
    
    const payload = {
      stateSummary,
      recommendationSummary,
      contextText,
      medicalInsights,
      safetyNotice,
      stats
    };

    // 5. Thử gọi LLM trước
    try {
      console.log("🤖 Calling advanced LLM...");
      const llmResponse = await this.callAdvancedGroqLLM(payload);
      
      if (llmResponse) {
        console.log("✅ LLM response received successfully");
        return llmResponse;
      }
    } catch (error) {
      console.error("❌ LLM generation failed:", error.message);
    }

    // 6. Enhanced fallback response nếu LLM không khả dụng
    console.log("🔄 Using enhanced fallback response");
    try {
      return enhancedFallbackLLM.generateAdvancedMedicalResponse(state, recommendations, helpers);
    } catch (fallbackError) {
      console.error("❌ Enhanced fallback failed:", fallbackError.message);
      return this.createAdvancedFallbackResponse(payload);
    }
  }
}

module.exports = new ImprovedRagLLMService();