// Enhanced Medical Knowledge Base Service
class MedicalKnowledgeService {
  constructor() {
    // Comprehensive symptom to specialty mapping
    this.symptomSpecialtyMap = new Map([
      // Cardiovascular
      ['đau ngực', ['Tim mạch', 'Nội khoa']],
      ['khó thở', ['Tim mạch', 'Hô hấp', 'Nội khoa']],
      ['đánh trống ngực', ['Tim mạch', 'Nội khoa']],
      ['huyết áp cao', ['Tim mạch', 'Nội khoa']],
      ['huyết áp thấp', ['Tim mạch', 'Nội khoa']],
      ['đau tim', ['Tim mạch', 'Cấp cứu']],
      ['nhồi máu cơ tim', ['Tim mạch', 'Cấp cứu']],
      
      // Respiratory
      ['ho', ['Hô hấp', 'Nội khoa', 'Tai Mũi Họng']],
      ['ho ra máu', ['Hô hấp', 'Nội khoa']],
      ['khò khè', ['Hô hấp', 'Nội khoa']],
      ['viêm phổi', ['Hô hấp', 'Nội khoa']],
      ['hen suyễn', ['Hô hấp', 'Nội khoa']],
      ['lao phổi', ['Hô hấp', 'Lao và Bệnh phổi']],
      
      // Gastrointestinal
      ['đau bụng', ['Tiêu hóa', 'Nội khoa', 'Ngoại khoa']],
      ['nôn mửa', ['Tiêu hóa', 'Nội khoa']],
      ['tiêu chảy', ['Tiêu hóa', 'Nội khoa']],
      ['táo bón', ['Tiêu hóa', 'Nội khoa']],
      ['đau dạ dày', ['Tiêu hóa', 'Nội khoa']],
      ['viêm ruột thừa', ['Ngoại khoa', 'Cấp cứu']],
      ['xuất huyết tiêu hóa', ['Tiêu hóa', 'Cấp cứu']],
      ['viêm gan', ['Tiêu hóa', 'Truyền nhiễm']],
      
      // Neurological
      ['đau đầu', ['Thần kinh', 'Nội khoa']],
      ['chóng mặt', ['Thần kinh', 'Tai Mũi Họng', 'Nội khoa']],
      ['co giật', ['Thần kinh', 'Cấp cứu']],
      ['liệt nửa người', ['Thần kinh', 'Cấp cứu']],
      ['mất trí nhớ', ['Thần kinh', 'Tâm thần']],
      ['rối loạn giấc ngủ', ['Thần kinh', 'Tâm thần']],
      ['động kinh', ['Thần kinh']],
      ['đột quỵ', ['Thần kinh', 'Cấp cứu']],
      
      // Orthopedic
      ['đau lưng', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau khớp', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['gãy xương', ['Cơ Xương Khớp', 'Ngoại khoa']],
      ['thoái hóa khớp', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['viêm khớp', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['đau cột sống', ['Cơ Xương Khớp', 'Thần kinh']],
      
      // Dermatological
      ['nổi mẩn', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['ngứa da', ['Da liễu']],
      ['viêm da', ['Da liễu']],
      ['mụn', ['Da liễu']],
      ['nám', ['Da liễu']],
      ['zona', ['Da liễu', 'Thần kinh']],
      
      // Gynecological
      ['rối loạn kinh nguyệt', ['Sản Phụ khoa']],
      ['đau bụng kinh', ['Sản Phụ khoa']],
      ['khí hư bất thường', ['Sản Phụ khoa']],
      ['u xơ tử cung', ['Sản Phụ khoa']],
      ['viêm âm đạo', ['Sản Phụ khoa']],
      
      // Urological
      ['đau khi tiểu tiện', ['Niệu khoa', 'Nội khoa']],
      ['tiểu rắt', ['Niệu khoa', 'Nội khoa']],
      ['sỏi thận', ['Niệu khoa']],
      ['viêm đường tiết niệu', ['Niệu khoa', 'Nội khoa']],
      
      // ENT
      ['đau họng', ['Tai Mũi Họng']],
      ['nghẹt mũi', ['Tai Mũi Họng']],
      ['viêm amidan', ['Tai Mũi Họng']],
      ['ù tai', ['Tai Mũi Họng']],
      ['chảy máu cam', ['Tai Mũi Họng']],
      
      // Ophthalmological
      ['mờ mắt', ['Mắt']],
      ['đau mắt', ['Mắt']],
      ['khô mắt', ['Mắt']],
      ['tăng nhãn áp', ['Mắt']],
      ['cận thị', ['Mắt']],
      
      // Psychiatric
      ['trầm cảm', ['Tâm thần']],
      ['lo âu', ['Tâm thần']],
      ['mất ngủ', ['Tâm thần', 'Thần kinh']],
      ['rối loạn tâm thần', ['Tâm thần']],
      
      // Endocrine
      ['tiểu đường', ['Nội tiết']],
      ['tăng cân', ['Nội tiết', 'Dinh dưỡng']],
      ['sụt cân', ['Nội tiết', 'Nội khoa']],
      ['rối loạn tuyến giáp', ['Nội tiết']],
      
      // Pediatric specific
      ['sốt ở trẻ', ['Nhi khoa']],
      ['tiêu chảy ở trẻ', ['Nhi khoa']],
      ['ho ở trẻ', ['Nhi khoa']],
      ['chậm phát triển', ['Nhi khoa']],
      
      // Emergency symptoms
      ['sốt cao', ['Cấp cứu', 'Nội khoa']],
      ['ngất xíu', ['Cấp cứu', 'Tim mạch', 'Thần kinh']],
      ['khó thở dữ dội', ['Cấp cứu', 'Hô hấp']],
      ['đau ngực dữ dội', ['Cấp cứu', 'Tim mạch']],
      ['chảy máu không cầm', ['Cấp cứu', 'Ngoại khoa']],
    ]);

    // Age-specific specialty preferences
    this.ageSpecialtyMap = new Map([
      ['0-15', ['Nhi khoa']],
      ['16-65', []],
      ['65+', ['Lão khoa', 'Tim mạch']]
    ]);

    // Gender-specific considerations
    this.genderSpecialtyMap = new Map([
      ['nữ', ['Sản Phụ khoa', 'Nội tiết']],
      ['nam', ['Nam khoa']],
    ]);

    // Urgency levels
    this.urgencyKeywords = new Map([
      ['khẩn cấp', ['sốt cao', 'khó thở dữ dội', 'đau ngực dữ dội', 'ngất xíu', 'co giật', 'chảy máu không cầm', 'đau bụng dữ dội']],
      ['cần khám sớm', ['sốt', 'đau đầu dữ dội', 'nôn mửa liên tục', 'đau bụng kéo dài']],
      ['có thể đợi', ['ho nhẹ', 'nghẹt mũi', 'đau nhẹ']]
    ]);
  }

  // Normalize Vietnamese text for better matching
  normalizeVietnamese(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Enhanced symptom analysis
  analyzeSymptoms(symptoms) {
    const normalizedSymptoms = this.normalizeVietnamese(symptoms);
    const possibleSpecialties = new Set();
    const urgencyLevel = this.assessUrgency(symptoms);
    const matchedSymptoms = [];

    // Check for EXACT symptom matches - CHỈ match chính xác 100%
    for (const [symptom, specialties] of this.symptomSpecialtyMap) {
      const normalizedSymptom = this.normalizeVietnamese(symptom);
      if (normalizedSymptoms === normalizedSymptom) {
        specialties.forEach(s => possibleSpecialties.add(s));
        matchedSymptoms.push(symptom);
      }
    }

    // TẮT fuzzy matching để tránh false positive
    // if (matchedSymptoms.length === 0) {
    //   for (const [symptom, specialties] of this.symptomSpecialtyMap) {
    //     const normalizedSymptom = this.normalizeVietnamese(symptom);
    //     const words = normalizedSymptom.split(' ');
    //     if (words.some(word => normalizedSymptoms.includes(word) && word.length > 2)) {
    //       specialties.forEach(s => possibleSpecialties.add(s));
    //       matchedSymptoms.push(symptom);
    //     }
    //   }
    // }

    return {
      specialties: Array.from(possibleSpecialties),
      matchedSymptoms,
      urgencyLevel,
      confidence: this.calculateConfidence(matchedSymptoms, normalizedSymptoms)
    };
  }

  // Assess urgency based on keywords
  assessUrgency(symptoms) {
    const normalizedSymptoms = this.normalizeVietnamese(symptoms);
    
    for (const [level, keywords] of this.urgencyKeywords) {
      for (const keyword of keywords) {
        if (normalizedSymptoms.includes(this.normalizeVietnamese(keyword))) {
          return level;
        }
      }
    }
    
    return 'bình thường';
  }

  // Calculate confidence score
  calculateConfidence(matchedSymptoms, normalizedInput) {
    if (matchedSymptoms.length === 0) return 0.1;
    
    const totalWords = normalizedInput.split(' ').filter(w => w.length > 2).length;
    const matchedWords = matchedSymptoms.reduce((count, symptom) => {
      return count + this.normalizeVietnamese(symptom).split(' ').length;
    }, 0);
    
    return Math.min(0.95, Math.max(0.3, matchedWords / Math.max(totalWords, 1)));
  }

  // Get age-specific recommendations
  getAgeSpecificSpecialties(age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return [];
    
    if (ageNum <= 15) return this.ageSpecialtyMap.get('0-15') || [];
    if (ageNum >= 65) return this.ageSpecialtyMap.get('65+') || [];
    return this.ageSpecialtyMap.get('16-65') || [];
  }

  // Get gender-specific recommendations
  getGenderSpecificSpecialties(gender) {
    const normalizedGender = this.normalizeVietnamese(gender);
    if (normalizedGender.includes('nu')) return this.genderSpecialtyMap.get('nữ') || [];
    if (normalizedGender.includes('nam')) return this.genderSpecialtyMap.get('nam') || [];
    return [];
  }

  // Comprehensive analysis
  analyzePatientData(patientData) {
    const { primaryConcern, age, gender, symptomDuration, medicalHistory } = patientData;
    
    // Analyze primary symptoms
    const symptomAnalysis = this.analyzeSymptoms(primaryConcern || '');
    
    // Add age-specific specialties
    const ageSpecialties = this.getAgeSpecificSpecialties(age);
    
    // Add gender-specific specialties
    const genderSpecialties = this.getGenderSpecificSpecialties(gender);
    
    // Combine all specialties with weights
    const allSpecialties = new Map();
    
    // Primary symptoms get highest weight
    symptomAnalysis.specialties.forEach(specialty => {
      allSpecialties.set(specialty, (allSpecialties.get(specialty) || 0) + 1.0);
    });
    
    // Age-specific gets medium weight
    ageSpecialties.forEach(specialty => {
      allSpecialties.set(specialty, (allSpecialties.get(specialty) || 0) + 0.5);
    });
    
    // Gender-specific gets lower weight
    genderSpecialties.forEach(specialty => {
      allSpecialties.set(specialty, (allSpecialties.get(specialty) || 0) + 0.3);
    });
    
    // Sort by weight and return top specialties
    const sortedSpecialties = Array.from(allSpecialties.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([specialty]) => specialty);
    
    return {
      recommendedSpecialties: sortedSpecialties.slice(0, 5),
      urgencyLevel: symptomAnalysis.urgencyLevel,
      confidence: symptomAnalysis.confidence,
      matchedSymptoms: symptomAnalysis.matchedSymptoms,
      analysisDetails: {
        symptomSpecialties: symptomAnalysis.specialties,
        ageSpecialties,
        genderSpecialties
      }
    };
  }
}

module.exports = new MedicalKnowledgeService();