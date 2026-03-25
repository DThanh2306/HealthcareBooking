// Enhanced Fallback LLM Service - Không phụ thuộc external APIs
const enhancedMedicalKnowledge = require('./enhancedMedicalKnowledge.service');
const medicalLibrary = require('./medicalLibrary.service');

class EnhancedFallbackLLMService {
  constructor() {
    // Medical response templates
    this.responseTemplates = {
      emergency: {
        intro: "🚨 **TÌNH HUỐNG KHẨN CẤP** - Cần can thiệp y tế ngay lập tức",
        actions: [
          "Gọi 115 hoặc đến cơ sở y tế gần nhất NGAY",
          "Không chờ đợi hoặc tự điều trị",
          "Chuẩn bị thông tin bệnh sử và thuốc đang dùng"
        ]
      },
      urgent: {
        intro: "⚠️ **CẦN KHÁM SỚM** - Triệu chứng cần được bác sĩ đánh giá",
        actions: [
          "Đặt lịch khám trong 24-48 giờ",
          "Theo dõi sát diễn biến triệu chứng",
          "Đi cấp cứu nếu tình trạng trở nặng"
        ]
      },
      routine: {
        intro: "ℹ️ **THEO DÕI** - Triệu chứng cần quan sát",
        actions: [
          "Theo dõi trong 3-5 ngày",
          "Nghỉ ngơi và chăm sóc tại nhà",
          "Đặt lịch khám nếu không cải thiện"
        ]
      }
    };

    // Medical advice patterns
    this.advicePatterns = {
      cardiovascular: {
        care: ["Nghỉ ngơi, tránh gắng sức", "Kiểm tra huyết áp thường xuyên", "Hạn chế muối và chất béo"],
        warning: "Đi cấp cứu ngay nếu đau ngực dữ dội, khó thở hoặc ngất"
      },
      respiratory: {
        care: ["Uống nhiều nước ấm", "Giữ ấm, tránh khói bụi", "Hít hơi nước muối"],
        warning: "Đi khám ngay nếu ho ra máu, sốt cao không giảm"
      },
      gastrointestinal: {
        care: ["Ăn nhẹ, dễ tiêu", "Bổ sung nước điện giải", "Tránh thức ăn cay nóng"],
        warning: "Đi cấp cứu nếu đau bụng dữ dội, nôn ra máu"
      },
      neurological: {
        care: ["Nghỉ ngơi trong môi trường yên tĩnh", "Tránh ánh sáng chói", "Quản lý stress"],
        warning: "Đi cấp cứu ngay nếu đau đầu dữ dội, co giật, yếu liệt"
      },
      musculoskeletal: {
        care: ["Áp dụng nguyên tắc RICE", "Tránh vận động mạnh", "Massage nhẹ nhàng"],
        warning: "Đi khám nếu đau không giảm, sưng tấy, mất chức năng"
      }
    };
  }

  // Tạo medical response thông minh không cần external LLM
  generateAdvancedMedicalResponse(state, recommendations, helpers) {
    const { stateSummary, recommendationSummary } = helpers;
    
    // 1. Phân tích medical context
    const analysis = enhancedMedicalKnowledge.comprehensiveAnalysis(state);
    
    // 2. Xác định urgency và template
    const urgencyLevel = analysis?.urgencyLevel || 'routine';
    const template = this.getResponseTemplate(urgencyLevel);
    
    // 3. Xác định hệ thống y tế chính
    const primarySystem = this.identifyPrimarySystem(analysis, state.primaryConcern);
    
    // 4. Tạo structured response
    const response = this.buildStructuredResponse({
      template,
      analysis,
      primarySystem,
      stateSummary,
      recommendationSummary,
      state
    });

    return response;
  }

  getResponseTemplate(urgencyLevel) {
    switch (urgencyLevel) {
      case 'khẩn cấp':
        return this.responseTemplates.emergency;
      case 'cần khám sớm':
        return this.responseTemplates.urgent;
      default:
        return this.responseTemplates.routine;
    }
  }

  identifyPrimarySystem(analysis, symptoms) {
    if (!symptoms) return 'general';
    
    const systemKeywords = {
      cardiovascular: ['tim', 'ngực', 'mạch', 'huyết áp', 'đánh trống'],
      respiratory: ['ho', 'thở', 'phổi', 'đờm', 'nghẹt'],
      gastrointestinal: ['bụng', 'nôn', 'tiêu chảy', 'dạ dày', 'ruột'],
      neurological: ['đầu', 'chóng mặt', 'co giật', 'liệt', 'thần kinh'],
      musculoskeletal: ['khớp', 'xương', 'cơ', 'lưng', 'vai']
    };

    const normalizedSymptoms = symptoms.toLowerCase();
    
    for (const [system, keywords] of Object.entries(systemKeywords)) {
      if (keywords.some(keyword => normalizedSymptoms.includes(keyword))) {
        return system;
      }
    }
    
    return 'general';
  }

  buildStructuredResponse({ template, analysis, primarySystem, stateSummary, recommendationSummary, state }) {
    const sections = [];

    // 1. Header với urgency
    sections.push(template.intro);
    sections.push("");

    // 2. Patient summary
    sections.push("👤 **THÔNG TIN BỆNH NHÂN:**");
    sections.push(stateSummary || "Thông tin cơ bản đã được ghi nhận");
    sections.push("");

    // 3. Medical analysis
    if (analysis) {
      sections.push("🔍 **PHÂN TÍCH Y KHOA:**");
      
      if (analysis.recommendedSpecialties && Array.isArray(analysis.recommendedSpecialties) && analysis.recommendedSpecialties.length) {
        sections.push(`• **Chuyên khoa đề xuất:** ${analysis.recommendedSpecialties.slice(0, 3).join(", ")}`);
      }
      
      if (analysis.urgencyLevel) {
        sections.push(`• **Mức độ ưu tiên:** ${analysis.urgencyLevel}`);
      }
      
      if (analysis.confidence !== undefined) {
        sections.push(`• **Độ tin cậy phân tích:** ${(analysis.confidence * 100).toFixed(1)}%`);
      }
      
      if (analysis.matchedSymptoms && Array.isArray(analysis.matchedSymptoms) && analysis.matchedSymptoms.length) {
        sections.push(`• **Triệu chứng đã nhận diện:** ${analysis.matchedSymptoms.slice(0, 3).join(", ")}`);
      }
      
      if (analysis.systemsAffected && Array.isArray(analysis.systemsAffected) && analysis.systemsAffected.length) {
        sections.push(`• **Hệ thống có thể liên quan:** ${analysis.systemsAffected.join(", ")}`);
      }
      sections.push("");
    }

    // 4. Recommendations
    if (recommendationSummary) {
      sections.push("🏥 **KHUYẾN NGHỊ CHUYÊN KHOA:**");
      sections.push(recommendationSummary);
      sections.push("");
    }

    // 5. System-specific care advice
    const systemAdvice = this.advicePatterns[primarySystem];
    if (systemAdvice) {
      sections.push("💡 **HƯỚNG DẪN CHĂM SÓC:**");
      systemAdvice.care.forEach(advice => {
        sections.push(`• ${advice}`);
      });
      sections.push("");
    }

    // 6. Action plan
    sections.push("📋 **KẾ HOẠCH HÀNH ĐỘNG:**");
    template.actions.forEach((action, index) => {
      sections.push(`${index + 1}. ${action}`);
    });
    sections.push("");

    // 7. Warning signs
    if (systemAdvice?.warning) {
      sections.push("⚠️ **DẤU HIỆU CẢNH BÁO:**");
      sections.push(systemAdvice.warning);
      sections.push("");
    }

    // 8. Risk assessment for high-risk groups
    const age = parseInt(state.age) || 25;
    if (age < 5 || age > 65) {
      sections.push("🔴 **LƯU Ý ĐẶC BIỆT:**");
      if (age < 5) {
        sections.push("Trẻ nhỏ có thể diễn biến nhanh - cần theo dõi sát và khám sớm hơn");
      } else {
        sections.push("Người cao tuổi có nguy cơ biến chứng cao - nên thận trọng và khám định kỳ");
      }
      sections.push("");
    }

    // 9. Follow-up guidance
    sections.push("🔄 **THEO DÕI VÀ TÁI KHÁM:**");
    const followUpAdvice = this.getFollowUpAdvice(analysis?.urgencyLevel, primarySystem);
    followUpAdvice.forEach(advice => {
      sections.push(`• ${advice}`);
    });
    sections.push("");

    // 10. Medical disclaimer
    sections.push("⚕️ **QUAN TRỌNG:**");
    sections.push("• Thông tin này chỉ mang tính tham khảo và hỗ trợ");
    sections.push("• Không thay thế việc khám và chẩn đoán của bác sĩ");
    sections.push("• Khi có nghi ngờ, luôn tìm đến cơ sở y tế uy tín");
    sections.push("• Trong trường hợp khẩn cấp, gọi 115 ngay lập tức");

    return sections.join("\n");
  }

  getFollowUpAdvice(urgencyLevel, primarySystem) {
    const baseAdvice = [];
    
    switch (urgencyLevel) {
      case 'khẩn cấp':
        return ["Không cần theo dõi - cần can thiệp y tế ngay lập tức"];
        
      case 'cần khám sớm':
        baseAdvice.push("Theo dõi trong 12-24 giờ tới");
        baseAdvice.push("Ghi chép diễn biến triệu chứng");
        baseAdvice.push("Đi khám ngay nếu triệu chứng nặng lên");
        break;
        
      default:
        baseAdvice.push("Quan sát trong 3-5 ngày");
        baseAdvice.push("Ghi nhật ký triệu chứng nếu kéo dài");
        baseAdvice.push("Đặt lịch khám nếu không cải thiện sau 1 tuần");
    }

    // Add system-specific follow-up
    const systemSpecific = {
      cardiovascular: "Kiểm tra huyết áp và nhịp tim hàng ngày",
      respiratory: "Theo dõi nhiệt độ và tình trạng khó thở",
      gastrointestinal: "Ghi chép chế độ ăn uống và đại tiện",
      neurological: "Theo dõi mức độ đau đầu và khả năng vận động",
      musculoskeletal: "Đánh giá mức độ đau và khả năng cử động"
    };

    if (systemSpecific[primarySystem]) {
      baseAdvice.push(systemSpecific[primarySystem]);
    }

    return baseAdvice;
  }

  // Enhanced medical library search with better formatting
  getEnhancedMedicalInsights(symptoms, patientData) {
    if (!symptoms) return "";

    const libraryMatches = medicalLibrary.searchBySymptoms(symptoms, { limit: 2 });
    if (!libraryMatches.length) return "";

    const insights = ["📚 **KIẾN THỨC Y KHOA THAM KHẢO:**", ""];

    libraryMatches.forEach((entry, index) => {
      insights.push(`**${index + 1}. ${entry.category}**`);
      insights.push(entry.summary);
      
      if (entry.careTips && Array.isArray(entry.careTips) && entry.careTips.length) {
        insights.push("🔧 *Chăm sóc:* " + entry.careTips.slice(0, 2).join("; "));
      }
      
      if (entry.warningSigns && Array.isArray(entry.warningSigns) && entry.warningSigns.length) {
        insights.push("⚠️ *Cảnh báo:* " + entry.warningSigns.slice(0, 1).join("; "));
      }
      
      insights.push("");
    });

    return insights.join("\n");
  }
}

module.exports = new EnhancedFallbackLLMService();