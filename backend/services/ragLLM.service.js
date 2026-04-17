const aiDoctorKnowledge = require("./aiDoctorKnowledge.service");
const medicalLibrary = require("./medicalLibrary.service");
const llmService = require("./llm.service");

function normalizeNameForOutput(s) {
  if (!s) return '';
  return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

class RagLLMService {
  constructor() {
    this.contextLimit = Number(process.env.RAG_CONTEXT_DOCS ?? 6);
  }

  buildPatientQuery(state, recommendations) {
    const parts = [
      state.gender ? `Giới tính ${state.gender}` : "",
      state.age ? `Tuổi ${state.age}` : "",
      state.location ? `Khu vực ${state.location}` : "",
      state.primaryConcern ? `Triệu chứng ${state.primaryConcern}` : "",
      state.symptomDuration ? `Thời gian bị ${state.symptomDuration}` : "",
      state.medicalHistory ? `Tiền sử ${state.medicalHistory}` : "",
      state.currentMedications ? `Thuốc đang dùng ${state.currentMedications}` : "",
      state.expectations ? `Nhu cầu ${state.expectations}` : "",
      recommendations?.specialties?.length
        ? `Chuyên khoa hệ thống đề xuất ${recommendations.specialties.join(", ")}`
        : "",
    ];

    return parts.filter(Boolean).join(". ");
  }

  formatDocumentContext(doc, score, index) {
    if (!doc) return "";
    const prefix = doc.type === "doctor" ? "Bác sĩ" : "Cơ sở";
    const specialty = doc.specialty ? ` - Chuyên khoa ${doc.specialty}` : "";
    const location = doc.hospitalAddress ? ` - Địa chỉ: ${doc.hospitalAddress}` : "";
    const hospital = doc.hospitalName ? ` - Thuộc: ${doc.hospitalName}` : "";
    const price =
      doc.price != null
        ? ` - Giá tham khảo: ${Number(doc.price).toLocaleString("vi-VN")} đ/lần khám`
        : "";

    return `${index + 1}. ${prefix}: ${doc.name}${specialty}${hospital}${location}${price}. Điểm phù hợp: ${score.toFixed(
      2
    )}.`;
  }

  async buildContext(state, recommendations) {
    const query = this.buildPatientQuery(state, recommendations);
    if (!query) return { contextText: "", retrievedDocs: [] };

    const retrieved = await aiDoctorKnowledge.query(query, {
      limit: this.contextLimit,
      location: state.location,
    });

    if (!retrieved?.length) {
      return { contextText: "", retrievedDocs: [] };
    }

    const lines = retrieved.map(({ doc, score }, index) =>
      this.formatDocumentContext(doc, score, index)
    );

    return {
      contextText: lines.join("\n"),
      retrievedDocs: retrieved.map(({ doc }) => doc),
    };
  }

  buildMedicalInsights(primaryConcern) {
    if (!primaryConcern) {
      return { text: "", matches: [] };
    }

    const matches = medicalLibrary.searchBySymptoms(primaryConcern, {
      limit: 3,
    });

    if (!matches.length) return { text: "", matches: [] };

    const text = matches
      .map((entry, index) => {
        const lines = [
          `${index + 1}. ${entry.name} (${entry.category})`,
          entry.summary,
        ];

        if (entry.careTips?.length) {
          lines.push(`Gợi ý chăm sóc: ${entry.careTips.join("; ")}.`);
        }

        if (entry.warningSigns?.length) {
          lines.push(`Dấu hiệu cảnh báo: ${entry.warningSigns.join("; ")}.`);
        }

        if (entry.recommendedSpecialties?.length) {
          lines.push(
            `Nên thăm khám tại: ${entry.recommendedSpecialties.join(", ")}.`
          );
        }

        lines.push(`Độ ưu tiên: ${entry.urgencyLevel}.`);

        return lines.join("\n");
      })
      .join("\n\n");

    return { text, matches };
  }

  buildSafetyNotice(urgencyLevel) {
    switch (urgencyLevel) {
      case "khẩn cấp":
        return (
          "⚠️ Triệu chứng có dấu hiệu khẩn cấp. Hãy đến cơ sở y tế gần nhất " +
          "hoặc gọi 115 nếu có khó thở, đau ngực dữ dội, liệt hoặc bất kỳ biểu hiện nguy hiểm nào."
        );
      case "cần khám sớm":
        return (
          "Triệu chứng của bạn nên được bác sĩ kiểm tra trong 24-48 giờ tới. " +
          "Chuẩn bị các kết quả xét nghiệm, thuốc đang dùng và theo dõi sát diễn biến."
        );
      default:
        return (
          "Thông tin trên chỉ mang tính tham khảo. Nếu triệu chứng kéo dài, nặng hơn, " +
          "hoặc xuất hiện sốt cao, khó thở, đau dữ dội, hãy đi khám sớm."
        );
    }
  }

  composeAdvice({
    stateSummary,
    recommendationSummary,
    contextText,
    medicalInsights,
    safetyNotice,
  }) {
    const sections = [
      [
        "1) Đánh giá sơ bộ",
        stateSummary || "- Chưa thu thập đủ dữ liệu người dùng.",
      ].join("\n"),
      [
        "2) Gợi ý chuyên môn",
        recommendationSummary ||
          "- Hệ thống đang tổng hợp thêm thông tin chuyên khoa phù hợp.",
      ].join("\n"),
      [
        "3) Tài liệu y khoa truy hồi",
        contextText ||
          "- Chưa tìm thấy tài liệu khớp trong kho bác sĩ/cơ sở nội bộ.",
      ].join("\n"),
    ];

    if (medicalInsights) {
      sections.push(["4) Kiến thức y khoa nội bộ", medicalInsights].join("\n"));
    }

    sections.push(["5) Lưu ý an toàn", safetyNotice].join("\n"));

    return sections.join("\n\n");
  }

  async callGroqLLM(payload) {
    const { stateSummary, recommendationSummary, contextText, medicalInsights, safetyNotice } = payload;

    if (!llmService.isConfigured()) return null;

    const promptParts = [
      "Bạn là bác sĩ chuyên khoa đang tư vấn online cho bệnh nhân. Hãy trả lời bằng tiếng Việt, giọng chuyên nghiệp nhưng dễ hiểu.",
      "",
      "Thông tin bệnh nhân:",
      stateSummary || "- Chưa có nhiều thông tin.",
      "",
      "Kết quả phân tích & gợi ý hệ thống:",
      recommendationSummary || "- Chưa có gợi ý rõ ràng.",
      "",
      "Bối cảnh từ hệ thống RAG (bác sĩ / bệnh viện nội bộ):",
      contextText || "- Chưa tìm được tài liệu phù hợp.",
      "",
      "Kiến thức y khoa nội bộ (medical library):",
      medicalInsights || "- Chưa có dữ liệu khớp.",
      "",
      "Hướng dẫn an toàn ưu tiên:",
      safetyNotice,
      "",
      "YÊU CẦU:",
      "- Tóm tắt ngắn gọn tình hình bệnh nhân.",
      "- Nêu 1–3 chẩn đoán phân biệt có thể gặp (chỉ mang tính tham khảo).",
      "- Đề xuất 1–3 chuyên khoa nên đi khám, gợi ý loại cơ sở phù hợp.",
      "- Đưa khuyến cáo an toàn, thời điểm nên đi khám gấp nếu có dấu hiệu nặng.",
      "- Không tự ý kê đơn thuốc cụ thể.",
    ].join("\n");

    const messages = [
      {
        role: "system",
        content:
          "Bạn là bác sĩ nội khoa tổng quát, hỗ trợ định hướng chuyên khoa và mức độ ưu tiên khám cho bệnh nhân tại Việt Nam.",
      },
      { role: "user", content: promptParts },
    ];

    const text = await llmService.callChatCompletion({
      messages,
      temperature: 0.3,
      max_tokens: 700,
    });

    return text;
  }

  async generateAdvice(state, recommendations, helpers) {
    const { stateSummary, recommendationSummary } = helpers;
    const { contextText } = await this.buildContext(state, recommendations);

    const { text: medicalInsights, matches: libraryMatches } =
      this.buildMedicalInsights(state.primaryConcern);
    const urgencyLevel =
      recommendations?.medicalContext?.urgencyLevel ||
      libraryMatches[0]?.urgencyLevel ||
      state?._symptomAnalysis?.urgencyLevel ||
      "bình thường";

    const safetyNotice = this.buildSafetyNotice(urgencyLevel);

    try {
      const llmResult = await this.callGroqLLM({
        stateSummary,
        recommendationSummary,
        contextText,
        medicalInsights,
        safetyNotice,
      });

      if (llmResult) {
        return llmResult;
      }
    } catch (error) {
      console.error("❌ Groq LLM error:", error.message || error);
    }

    // Fallback: rule-based summary
    return this.composeAdvice({
      stateSummary,
      recommendationSummary,
      contextText,
      medicalInsights,
      safetyNotice,
    });
  }
}

module.exports = new RagLLMService();
