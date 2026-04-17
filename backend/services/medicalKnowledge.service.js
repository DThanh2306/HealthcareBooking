const advancedFuzzyVector = require('./advancedFuzzyVector.service');
const crossMappingService = require('./crossMappingService.service');
const locationBasedRecommendation = require('./locationBasedRecommendation.service');

class MedicalKnowledgeService {
  constructor() {
    this.symptomSpecialtyMap = new Map([
      ['đau ngực', ['Tim mạch', 'Nội khoa', 'Cấp cứu']],
      ['tức ngực', ['Tim mạch', 'Nội khoa']],
      ['khó thở', ['Tim mạch', 'Hô hấp', 'Nội khoa']],
      ['ho', ['Hô hấp', 'Tai Mũi Họng', 'Nội khoa']],
      ['đau bụng', ['Tiêu hóa', 'Nội khoa', 'Ngoại khoa']],
      ['đau đầu', ['Thần kinh', 'Nội khoa']],
      ['đau lưng', ['Cơ Xương Khớp', 'Thần kinh']],
      ['nổi mẩn', ['Da liễu']],
      ['rối loạn kinh nguyệt', ['Sản Phụ khoa']],
      ['tiểu đường', ['Nội tiết']]
    ]);

    // Extended datasets and heuristics
    this.urgencyKeywords = new Map([
      ['khẩn cấp', [
        'sốt cao trên 40', 'khó thở dữ dội', 'đau ngực dữ dội', 'ngất xíu', 'bất tỉnh',
        'co giật', 'liệt', 'chảy máu không cầm', 'đau bụng dữ dội'
      ]],
      ['cần khám sớm', ['sốt trên 38.5', 'đau đầu dữ dội', 'nôn mửa liên tục', 'đau bụng kéo dài']],
      ['cần theo dõi', ['ho nhẹ', 'sốt nhẹ', 'đau nhẹ']]
    ]);

    this.routineIndicators = ['nhẹ','mãn tính','ổn định','thường xuyên','từ từ','định kỳ'];

    this.ageSpecialtyMap = new Map([
      ['0-1', ['Nhi khoa', 'Sơ sinh']],
      ['1-15', ['Nhi khoa']],
      ['16-25', ['Y học gia đình','Nội khoa']],
      ['26-65', ['Nội khoa','Y học gia đình']],
      ['66-80', ['Lão khoa','Tim mạch']],
      ['80+', ['Lão khoa','Tim mạch','Thần kinh']]
    ]);

    this.genderSpecialtyMap = new Map([
      ['nữ', {
        general: ['Sản Phụ khoa', 'Nội tiết'],
        reproductive_age: ['Sản Phụ khoa', 'Nội tiết', 'Vú'],
        menopause: ['Sản Phụ khoa', 'Nội tiết', 'Tim mạch']
      }],
      ['nam', {
        general: ['Nam khoa'],
        elderly: ['Nam khoa', 'Niệu khoa', 'Tim mạch']
      }]
    ]);

    this.synonymMap = new Map([
      ['đau', ['nhức','buốt','tức','cắn','thắt']],
      ['khó thở', ['hụt hơi','ngạt thở','thở gấp']],
      ['mệt mỏi', ['mệt lử','kiệt sức','uể oải']]
    ]);

    this.systemSymptoms = new Map([
      ['tim_mạch', ['đau ngực','khó thở','đánh trống ngực','phù chân']],
      ['hô_hấp', ['ho','khó thở','đờm','viêm phổi']],
      ['tiêu_hóa', ['đau bụng','nôn','tiêu chảy']],
      ['thần_kinh', ['đau đầu','chóng mặt','tê bì','co giật']]
    ]);

    this.enhancedLibrary = this.loadEnhancedMedicalLibrary();
  }

  loadEnhancedMedicalLibrary() {
    try {
      const fs = require('fs');
      const path = require('path');
      const libraryPath = path.join(__dirname, '../data/enhanced_medical_library.json');
      if (fs.existsSync(libraryPath)) {
        const data = fs.readFileSync(libraryPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load enhanced medical library, using fallback');
    }
    return [];
  }

  normalizeVietnamese(text) {
    if (!text) return '';
    return String(text).toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,'e')
      .replace(/ì|í|ị|ỉ|ĩ/g,'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g,'y')
      .replace(/đ/g,'d')
      .replace(/[^a-z0-9\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  analyzeSymptoms(symptoms) {
    const normalized = this.normalizeVietnamese(symptoms || '');
    const matched = [];
    const possible = new Map();

    for (const [symptom, specialties] of this.symptomSpecialtyMap) {
      if (normalized === this.normalizeVietnamese(symptom)) {
        matched.push(symptom);
        specialties.forEach(s => possible.set(s, (possible.get(s)||0)+1));
      }
    }

    const urgency = this.assessUrgency(normalized);
    const confidence = this.calculateAdvancedConfidence(matched, normalized.split(' '), []);

    return {
      specialties: Array.from(possible.keys()),
      matchedSymptoms: matched,
      urgencyLevel: urgency,
      confidence
    };
  }

  assessUrgency(normalizedSymptoms) {
    const text = this.normalizeVietnamese(normalizedSymptoms||'');
    for (const [level, keywords] of this.urgencyKeywords) {
      for (const kw of keywords) {
        if (text.includes(this.normalizeVietnamese(kw))) return level;
      }
    }
    return 'bình thường';
  }

  calculateAdvancedConfidence(matchedSymptoms, inputWords, systemsAffected) {
    if (!matchedSymptoms.length) return 0.1;
    let score = Math.min(0.6, matchedSymptoms.length * 0.2);
    score += Math.min(0.2, inputWords.length * 0.02);
    score += Math.min(0.2, (systemsAffected?.length||0) * 0.1);
    return Math.min(0.95, Math.max(0.1, score));
  }

  getAdvancedAgeRecommendations(age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return [];
    if (ageNum < 1) return this.ageSpecialtyMap.get('0-1') || [];
    if (ageNum <= 15) return this.ageSpecialtyMap.get('1-15') || [];
    if (ageNum <= 25) return this.ageSpecialtyMap.get('16-25') || [];
    if (ageNum <= 65) return this.ageSpecialtyMap.get('26-65') || [];
    if (ageNum <= 80) return this.ageSpecialtyMap.get('66-80') || [];
    return this.ageSpecialtyMap.get('80+') || [];
  }

  getAdvancedGenderRecommendations(gender, age) {
    const g = this.normalizeVietnamese(gender||'');
    const ageNum = parseInt(age) || 25;
    if (g.includes('nu')||g.includes('nữ')) {
      const femaleMap = this.genderSpecialtyMap.get('nữ');
      if (ageNum >= 15 && ageNum <= 45) return femaleMap.reproductive_age;
      if (ageNum > 45) return femaleMap.menopause;
      return femaleMap.general;
    }
    if (g.includes('nam')) {
      const maleMap = this.genderSpecialtyMap.get('nam');
      if (ageNum > 50) return maleMap.elderly;
      return maleMap.general;
    }
    return [];
  }

  async comprehensiveAnalysis(patientData) {
    const { primaryConcern, age, gender, symptomDuration, medicalHistory, location } = patientData;
    const symptomAnalysis = this.analyzeSymptoms(primaryConcern || '');
    const ageRecommendations = this.getAdvancedAgeRecommendations(age);
    const genderRecommendations = this.getAdvancedGenderRecommendations(gender, age);

    const finalSpecialties = new Map();
    symptomAnalysis.specialties.forEach((specialty, idx) => {
      const weight = 1.0 - (idx * 0.1);
      finalSpecialties.set(specialty, (finalSpecialties.get(specialty)||0) + weight);
    });
    ageRecommendations.forEach(s => finalSpecialties.set(s, (finalSpecialties.get(s)||0) + 0.4));
    genderRecommendations.forEach(s => finalSpecialties.set(s, (finalSpecialties.get(s)||0) + 0.3));

    const ranked = Array.from(finalSpecialties.entries()).sort((a,b) => b[1]-a[1]).slice(0,5).map(([s,score])=>({specialty:s,score:score.toFixed(2)}));

    const focused = this.filterTopRelevantSpecialties(Array.from(finalSpecialties.entries()).sort((a,b)=>b[1]-a[1]), { urgencyLevel: symptomAnalysis.urgencyLevel });

    const baseAnalysis = {
      recommendedSpecialties: focused,
      specialtyScores: ranked.slice(0,3),
      urgencyLevel: symptomAnalysis.urgencyLevel,
      confidence: symptomAnalysis.confidence,
      matchedSymptoms: symptomAnalysis.matchedSymptoms,
      systemsAffected: symptomAnalysis.systemAffected || [],
      medicalContext: {
        patientProfile: { age, gender, location },
        riskLevel: this.assessRiskLevel(symptomAnalysis.urgencyLevel, age),
        recommendedActions: this.getRecommendedActions(symptomAnalysis.urgencyLevel),
        followUpInstructions: this.getFollowUpInstructions(symptomAnalysis.urgencyLevel)
      }
    };

    const enhancedAnalysis = crossMappingService.enhanceWithCrossMapping(baseAnalysis, {
      age, gender, location, primaryConcern, duration: symptomDuration, medicalHistory
    });

    enhancedAnalysis.locationBasedRecommendations = await this.getLocationBasedRecommendations(primaryConcern, enhancedAnalysis.recommendedSpecialties, { age, gender, location, primaryConcern }).catch(()=>null);

    return enhancedAnalysis;
  }

  async getLocationBasedRecommendations(userInput, recommendedSpecialties, patientData) {
    try {
      if (!this.checkLocationPreference(userInput)) return null;
      return await locationBasedRecommendation.processLocationBasedRequest(userInput, recommendedSpecialties.slice(0,3), patientData);
    } catch (err) {
      console.error('❌ Location-based recommendation failed:', err.message);
      return null;
    }
  }

  checkLocationPreference(userInput) {
    if (!userInput) return false;
    const locationKeywords = ['gần nhà','gần chỗ tôi','gần đây','địa phương','trong khu vực','khám gần','bệnh viện gần'];
    const normalized = (userInput||'').toLowerCase();
    return locationKeywords.some(k => normalized.includes(k));
  }

  assessRiskLevel(urgencyLevel, age) {
    const ageNum = parseInt(age) || 25;
    let riskMultiplier = 1;
    if (ageNum < 5 || ageNum > 65) riskMultiplier = 1.5;
    if (ageNum > 80) riskMultiplier = 2;
    switch (urgencyLevel) {
      case 'khẩn cấp': return Math.min(10, 9 * riskMultiplier);
      case 'cần khám sớm': return Math.min(10, 6 * riskMultiplier);
      case 'cần theo dõi': return Math.min(10, 3 * riskMultiplier);
      default: return 2;
    }
  }

  getRecommendedActions(urgencyLevel) {
    switch (urgencyLevel) {
      case 'khẩn cấp':
        return ['Đến cơ sở y tế gần nhất ngay lập tức','Gọi 115 nếu có triệu chứng nguy hiểm','Không tự điều trị tại nhà','Chuẩn bị thông tin bệnh sử và thuốc đang dùng'];
      case 'cần khám sớm':
        return ['Đặt lịch khám trong 24-48 giờ tới','Theo dõi sát diễn biến','Chuẩn bị danh sách thuốc và tiền sử','Đến cấp cứu nếu nặng'];
      default:
        return ['Theo dõi triệu chứng trong vài ngày','Nghỉ ngơi đầy đủ và uống nước','Đặt lịch khám nếu không cải thiện','Ghi chép diễn biến để báo bác sĩ'];
    }
  }

  getFollowUpInstructions(urgencyLevel) {
    switch (urgencyLevel) {
      case 'khẩn cấp': return 'Cần can thiệp y tế ngay lập tức - không chờ đợi';
      case 'cần khám sớm': return 'Theo dõi trong 12-24 giờ, đi khám nếu không cải thiện';
      default: return 'Theo dõi 3-5 ngày, đi khám nếu triệu chứng kéo dài hoặc nặng lên';
    }
  }

  filterTopRelevantSpecialties(sortedSpecialties, enhancedAnalysis) {
    if (!sortedSpecialties.length) return [];
    const top = sortedSpecialties[0];
    const topScore = top[1];
    if (sortedSpecialties.length === 1 || topScore >= 2.0) return [top[0]];
    const second = sortedSpecialties[1] || [null,0];
    const diff = topScore - second[1];
    const urgency = enhancedAnalysis?.urgencyLevel;
    if (urgency === 'khẩn cấp') return [top[0]];
    if (diff > 1.0) return [top[0]];
    if (diff <= 0.5 && second[1] >= 1.0) return [top[0], second[0]];
    return [top[0]];
  }
}

module.exports = new MedicalKnowledgeService();