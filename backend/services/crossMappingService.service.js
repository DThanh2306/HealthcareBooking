// Cross Mapping Service - Xử lý mapping chéo giữa triệu chứng, chuyên khoa và vùng cơ thể
class CrossMappingService {
  constructor() {
    // Cross-specialty mapping - triệu chứng có thể thuộc nhiều chuyên khoa
    this.crossSpecialtyMap = new Map([
      // Đau ngực - có thể là tim mạch, hô hấp, cơ xương khớp, tiêu hóa
      ['đau ngực', {
        primary: ['Tim mạch'],
        secondary: ['Hô hấp', 'Cơ Xương Khớp'],
        conditional: {
          'khi ăn': ['Tiêu hóa'],
          'khi vận động': ['Tim mạch'],
          'khi hít thở': ['Hô hấp'],
          'khi cử động': ['Cơ Xương Khớp'],
          'sau bữa ăn': ['Tiêu hóa']
        },
        combinedSymptoms: {
          'ho ra máu': { priority: ['Hô hấp'], urgency: 'khẩn cấp', reason: 'Nghi ngờ lao/ung thư phổi' },
          'ho khan': { priority: ['Hô hấp', 'Tim mạch'], urgency: 'cần khám sớm', reason: 'Hô hấp hoặc suy tim' },
          'ho có đờm': { priority: ['Hô hấp'], urgency: 'cần khám sớm', reason: 'Nhiễm trùng hô hấp' },
          'khó thở': { priority: ['Tim mạch', 'Hô hấp'], urgency: 'khẩn cấp', reason: 'Tim mạch cấp hoặc hen suyễn' },
          'mồ hôi lạnh': { priority: ['Tim mạch'], urgency: 'khẩn cấp', reason: 'Nghi ngờ nhồi máu cơ tim' },
          'đau lan ra tay trái': { priority: ['Tim mạch'], urgency: 'khẩn cấp', reason: 'Điển hình của đau tim' },
          'buồn nôn': { priority: ['Tim mạch', 'Tiêu hóa'], urgency: 'khẩn cấp', reason: 'Tim mạch ở nữ giới' }
        }
      }],
      
      // Khó thở - tim mạch, hô hấp, dị ứng
      ['khó thở', {
        primary: ['Hô hấp'],
        secondary: ['Tim mạch'],
        conditional: {
          'khi gắng sức': ['Tim mạch'],
          'khi nằm xuống': ['Tim mạch'],
          'khi tiếp xúc': ['Dị ứng - Miễn dịch'],
          'đột ngột': ['Cấp cứu', 'Hô hấp']
        },
        combinedSymptoms: {
          'đau ngực': { priority: ['Tim mạch', 'Hô hấp'], urgency: 'khẩn cấp', reason: 'Nhồi máu tim hoặc tràn khí' },
          'ho ra máu': { priority: ['Hô hấp'], urgency: 'khẩn cấp', reason: 'Xuất huyết phổi' },
          'phù chân': { priority: ['Tim mạch'], urgency: 'cần khám sớm', reason: 'Suy tim' },
          'tim đập nhanh': { priority: ['Tim mạch'], urgency: 'khẩn cấp', reason: 'Rối loạn nhịp tim' },
          'da tím tái': { priority: ['Hô hấp', 'Tim mạch'], urgency: 'khẩn cấp', reason: 'Thiếu oxy nghiêm trọng' }
        }
      }],

      // Ho - hô hấp, tai mũi họng, tim mạch, dược phẩm
      ['ho', {
        primary: ['Hô hấp', 'Tai Mũi Họng'],
        secondary: ['Tim mạch'],
        conditional: {
          'ban đêm': ['Tim mạch', 'Hô hấp'],
          'khi nằm': ['Tim mạch'],
          'có đờm': ['Hô hấp', 'Truyền nhiễm'],
          'khan': ['Tai Mũi Họng', 'Tim mạch'],
          'kéo dài': ['Hô hấp', 'Lao và Bệnh phổi']
        },
        combinedSymptoms: {
          'đau ngực': { priority: ['Hô hấp', 'Tim mạch'], urgency: 'cần khám sớm', reason: 'Viêm phổi hoặc suy tim' },
          'ra máu': { priority: ['Hô hấp', 'Lao và Bệnh phổi'], urgency: 'khẩn cấp', reason: 'Lao phổi/Ung thư phổi/Xuất huyết' },
          'sốt cao': { priority: ['Hô hấp', 'Truyền nhiễm'], urgency: 'cần khám sớm', reason: 'Viêm phổi nhiễm trùng' },
          'sụt cân': { priority: ['Lao và Bệnh phổi', 'Ung bướu'], urgency: 'cần khám sớm', reason: 'Lao hoặc ung thư' },
          'khó thở': { priority: ['Hô hấp', 'Tim mạch'], urgency: 'khẩn cấp', reason: 'Suy hô hấp' },
          'mệt mỏi': { priority: ['Tim mạch', 'Hô hấp'], urgency: 'cần khám sớm', reason: 'Suy tim hoặc bệnh phổi mãn' }
        }
      }],

      // Đau đầu - thần kinh, mắt, tai mũi họng, tim mạch
      ['đau đầu', {
        primary: ['Thần kinh'],
        secondary: ['Mắt', 'Tai Mũi Họng'],
        conditional: {
          'với mờ mắt': ['Mắt', 'Thần kinh'],
          'với cứng gáy': ['Thần kinh', 'Truyền nhiễm'],
          'với ù tai': ['Tai Mũi Họng'],
          'với huyết áp': ['Tim mạch'],
          'buổi sáng': ['Mắt', 'Tim mạch']
        }
      }],

      // Đau bụng - tiêu hóa, sản phụ khoa, niệu khoa, ngoại khoa
      ['đau bụng', {
        primary: ['Tiêu hóa'],
        secondary: ['Sản Phụ khoa', 'Niệu khoa'],
        conditional: {
          'hạ sườn phải': ['Tiêu hóa', 'Ngoại khoa'], // Gan, túi mật
          'hạ vị': ['Sản Phụ khoa', 'Niệu khoa'],
          'với nôn': ['Tiêu hóa', 'Ngoại khoa'],
          'với sốt': ['Ngoại khoa', 'Truyền nhiễm'],
          'kinh nguyệt': ['Sản Phụ khoa']
        }
      }],

      // Mệt mỏi - nội khoa, tim mạch, nội tiết, tâm thần
      ['mệt mỏi', {
        primary: ['Nội khoa'],
        secondary: ['Tim mạch', 'Nội tiết'],
        conditional: {
          'khi gắng sức': ['Tim mạch'],
          'với sụt cân': ['Nội tiết', 'Ung bướu'],
          'với buồn chán': ['Tâm thần'],
          'với khát nước': ['Nội tiết'],
          'với nhịp tim': ['Tim mạch']
        }
      }],

      // Chóng mặt - thần kinh, tai mũi họng, tim mạch
      ['chóng mặt', {
        primary: ['Thần kinh'],
        secondary: ['Tai Mũi Họng', 'Tim mạch'],
        conditional: {
          'khi đứng dậy': ['Tim mạch'],
          'với ù tai': ['Tai Mũi Họng'],
          'với đau đầu': ['Thần kinh'],
          'với huyết áp': ['Tim mạch'],
          'khi xoay đầu': ['Tai Mũi Họng']
        }
      }],

      // Sưng chân - tim mạch, thận, gan, tĩnh mạch
      ['sưng chân', {
        primary: ['Tim mạch'],
        secondary: ['Thận - Tiết niệu'],
        conditional: {
          'hai bên': ['Tim mạch', 'Thận - Tiết niệu'],
          'một bên': ['Phẫu thuật mạch máu'],
          'với đau': ['Cơ Xương Khớp'],
          'với đỏ': ['Da liễu', 'Truyền nhiễm'],
          'buổi chiều': ['Tim mạch']
        }
      }],

      // Tê tay - thần kinh, cơ xương khớp, tim mạch
      ['tê tay', {
        primary: ['Thần kinh'],
        secondary: ['Cơ Xương Khớp'],
        conditional: {
          'buổi sáng': ['Cơ Xương Khớp'], // Carpal tunnel
          'cả hai tay': ['Thần kinh'],
          'một bên': ['Thần kinh', 'Tim mạch'],
          'khi làm việc': ['Cơ Xương Khớp'],
          'với đau cổ': ['Thần kinh']
        }
      }]
    ]);

    // Anatomical cross-mapping - mapping theo vùng giải phẫu
    this.anatomicalCrossMap = new Map([
      // Vùng đầu cổ
      ['đầu_cổ', {
        symptoms: ['đau đầu', 'đau cổ', 'cứng cổ', 'chóng mặt'],
        specialties: ['Thần kinh', 'Cơ Xương Khớp', 'Tai Mũi Họng'],
        crossConnections: {
          'mắt': ['Mắt', 'Thần kinh'],
          'tai': ['Tai Mũi Họng'],
          'răng': ['Răng Hàm Mặt'],
          'cột_sống': ['Cơ Xương Khớp', 'Thần kinh']
        }
      }],

      // Vùng ngực
      ['ngực', {
        symptoms: ['đau ngực', 'khó thở', 'ho', 'tim đập nhanh'],
        specialties: ['Tim mạch', 'Hô hấp'],
        crossConnections: {
          'vai': ['Cơ Xương Khớp'],
          'lưng': ['Cơ Xương Khớp'],
          'bụng': ['Tiêu hóa'],
          'tay_trái': ['Tim mạch'] // Referred pain
        }
      }],

      // Vùng bụng
      ['bụng', {
        symptoms: ['đau bụng', 'nôn', 'tiêu chảy', 'chướng bụng'],
        specialties: ['Tiêu hóa', 'Sản Phụ khoa', 'Niệu khoa'],
        crossConnections: {
          'lưng': ['Thận - Tiết niệu'],
          'ngực': ['Tiêu hóa'], // Reflux
          'chậu': ['Sản Phụ khoa', 'Niệu khoa']
        }
      }],

      // Vùng tay
      ['tay', {
        symptoms: ['đau tay', 'tê tay', 'yếu tay', 'run tay'],
        specialties: ['Thần kinh', 'Cơ Xương Khớp'],
        crossConnections: {
          'cổ': ['Thần kinh'],
          'vai': ['Cơ Xương Khớp'],
          'ngực': ['Tim mạch'], // Referred pain từ tim
          'não': ['Thần kinh']
        }
      }],

      // Vùng chân
      ['chân', {
        symptoms: ['đau chân', 'sưng chân', 'tê chân', 'yếu chân'],
        specialties: ['Cơ Xương Khớp', 'Tim mạch', 'Thần kinh'],
        crossConnections: {
          'lưng': ['Thần kinh'], // Sciatica
          'tim': ['Tim mạch'], // Heart failure
          'thận': ['Thận - Tiết niệu'], // Edema
          'mạch_máu': ['Phẫu thuật mạch máu']
        }
      }]
    ]);

    // Age-based cross-mapping
    this.ageCrossMap = new Map([
      ['trẻ_em', {
        commonSymptoms: ['sốt', 'ho', 'tiêu chảy', 'quấy khóc'],
        specialtyPriority: ['Nhi khoa', 'Cấp cứu'],
        crossConsiderations: {
          'sốt': ['Nhi khoa', 'Truyền nhiễm'],
          'ho': ['Nhi khoa', 'Hô hấp'],
          'nôn': ['Nhi khoa', 'Tiêu hóa']
        }
      }],
      
      ['người_lớn', {
        commonSymptoms: ['đau đầu', 'đau lưng', 'mệt mỏi'],
        specialtyPriority: ['Nội khoa', 'Cơ Xương Khớp'],
        crossConsiderations: {
          'đau_ngực': ['Tim mạch', 'Hô hấp'],
          'mệt_mỏi': ['Nội khoa', 'Tim mạch', 'Tâm thần']
        }
      }],
      
      ['người_cao_tuổi', {
        commonSymptoms: ['chóng mặt', 'khó thở', 'đau khớp'],
        specialtyPriority: ['Lão khoa', 'Tim mạch', 'Cơ Xương Khớp'],
        crossConsiderations: {
          'ngã': ['Cơ Xương Khớp', 'Thần kinh'],
          'quên': ['Thần kinh', 'Lão khoa'],
          'yếu': ['Tim mạch', 'Nội khoa']
        }
      }]
    ]);

    // Gender-based cross-mapping
    this.genderCrossMap = new Map([
      ['nữ', {
        specificSymptoms: ['đau bụng kinh', 'khí hư', 'u vú'],
        crossSpecialties: ['Sản Phụ khoa', 'Vú', 'Nội tiết'],
        hormonalFactors: {
          'mãn_kinh': ['Nội tiết', 'Tim mạch'],
          'có_thai': ['Sản Phụ khoa'],
          'kinh_nguyệt': ['Sản Phụ khoa', 'Huyết học']
        }
      }],
      
      ['nam', {
        specificSymptoms: ['tiểu khó', 'đau tinh hoàn'],
        crossSpecialties: ['Nam khoa', 'Niệu khoa'],
        ageFactors: {
          'trên_50': ['Nam khoa', 'Tim mạch'],
          'dưới_30': ['Nam khoa', 'Nội tiết']
        }
      }]
    ]);

    // Temporal cross-mapping - theo thời gian xuất hiện
    this.temporalCrossMap = new Map([
      ['cấp_tính', {
        timeframe: '< 24 giờ',
        prioritySpecialties: ['Cấp cứu', 'Ngoại khoa'],
        crossPatterns: {
          'đau_đột_ngột': ['Cấp cứu'],
          'sốt_cao': ['Truyền nhiễm', 'Cấp cứu'],
          'khó_thở_đột_ngột': ['Hô hấp', 'Tim mạch', 'Cấp cứu']
        }
      }],
      
      ['bán_cấp', {
        timeframe: '1-7 ngày',
        prioritySpecialties: ['Nội khoa', 'chuyên khoa'],
        crossPatterns: {
          'sốt_kéo_dài': ['Truyền nhiễm', 'Nội khoa'],
          'đau_tăng_dần': ['chuyên khoa theo vị trí']
        }
      }],
      
      ['mãn_tính', {
        timeframe: '> 1 tháng',
        prioritySpecialties: ['chuyên khoa', 'Nội khoa'],
        crossPatterns: {
          'đau_mãn_tính': ['Cơ Xương Khớp', 'Thần kinh'],
          'mệt_mỏi_kéo_dài': ['Nội tiết', 'Tim mạch', 'Tâm thần']
        }
      }]
    ]);
  }

  // Thực hiện cross-mapping cho một triệu chứng cụ thể
  performCrossMapping(symptom, contextFactors = {}) {
    const results = {
      primarySpecialties: [],
      secondarySpecialties: [],
      conditionalSpecialties: [],
      crossReferences: [],
      confidence: 0,
      mappingType: []
    };

    // 1. Cross-specialty mapping
    if (this.crossSpecialtyMap.has(symptom)) {
      const mapping = this.crossSpecialtyMap.get(symptom);
      results.primarySpecialties.push(...mapping.primary);
      results.secondarySpecialties.push(...mapping.secondary);
      results.mappingType.push('cross_specialty');

      // Check conditional factors
      for (const [condition, specialties] of Object.entries(mapping.conditional)) {
        if (this.checkCondition(condition, contextFactors)) {
          results.conditionalSpecialties.push(...specialties);
        }
      }
      
      // Check combined symptoms - PRIORITY FEATURE
      const combinedResults = this.checkCombinedSymptoms(symptom, contextFactors);
      combinedResults.forEach(combo => {
        // Combined symptoms get highest priority
        results.primarySpecialties.unshift(...combo.specialties);
        results.crossReferences.push({
          combination: combo.combination,
          specialties: combo.specialties,
          reason: combo.reason,
          urgency: combo.urgency,
          confidence: combo.confidence
        });
        
        // Adjust overall urgency if combination is more serious
        if (combo.urgency === 'khẩn cấp' && results.urgencyLevel !== 'khẩn cấp') {
          results.urgencyLevel = 'khẩn cấp';
        } else if (combo.urgency === 'cần khám sớm' && results.urgencyLevel === 'cần theo dõi') {
          results.urgencyLevel = 'cần khám sớm';
        }
      });
    }

    // 2. Anatomical cross-mapping
    const anatomicalRegion = this.identifyAnatomicalRegion(symptom);
    if (anatomicalRegion) {
      const anatMapping = this.anatomicalCrossMap.get(anatomicalRegion);
      if (anatMapping) {
        results.primarySpecialties.push(...anatMapping.specialties);
        results.mappingType.push('anatomical');
        
        // Check cross-connections
        for (const [connection, specialties] of Object.entries(anatMapping.crossConnections)) {
          if (this.hasRelatedSymptom(connection, contextFactors)) {
            results.crossReferences.push({
              connection,
              specialties,
              reason: `Anatomical connection: ${anatomicalRegion} → ${connection}`
            });
          }
        }
      }
    }

    // 3. Age-based cross-mapping
    const ageGroup = this.determineAgeGroup(contextFactors.age);
    if (ageGroup && this.ageCrossMap.has(ageGroup)) {
      const ageMapping = this.ageCrossMap.get(ageGroup);
      results.primarySpecialties.push(...ageMapping.specialtyPriority);
      results.mappingType.push('age_based');
    }

    // 4. Gender-based cross-mapping
    if (contextFactors.gender && this.genderCrossMap.has(contextFactors.gender)) {
      const genderMapping = this.genderCrossMap.get(contextFactors.gender);
      results.secondarySpecialties.push(...genderMapping.crossSpecialties);
      results.mappingType.push('gender_based');
    }

    // 5. Temporal cross-mapping
    const temporalPattern = this.determineTemporalPattern(contextFactors.duration, contextFactors.onset);
    if (temporalPattern && this.temporalCrossMap.has(temporalPattern)) {
      const tempMapping = this.temporalCrossMap.get(temporalPattern);
      results.primarySpecialties.unshift(...tempMapping.prioritySpecialties);
      results.mappingType.push('temporal');
    }

    // 6. Deduplicate và rank specialties
    results.primarySpecialties = [...new Set(results.primarySpecialties)];
    results.secondarySpecialties = [...new Set(results.secondarySpecialties)];
    results.conditionalSpecialties = [...new Set(results.conditionalSpecialties)];

    // 7. Calculate confidence based on number of mapping types
    results.confidence = Math.min(0.95, results.mappingType.length * 0.2 + 0.3);

    return results;
  }

  // Kiểm tra điều kiện contextual và combined symptoms
  checkCondition(condition, contextFactors) {
    const context = JSON.stringify(contextFactors).toLowerCase();
    const normalizedCondition = condition.toLowerCase();
    
    return context.includes(normalizedCondition) || 
           contextFactors.additionalSymptoms?.some(s => 
             s.toLowerCase().includes(normalizedCondition)
           ) ||
           contextFactors.description?.toLowerCase().includes(normalizedCondition);
  }

  // Kiểm tra combined symptoms trong context
  checkCombinedSymptoms(primarySymptom, contextFactors) {
    if (!this.crossSpecialtyMap.has(primarySymptom)) return [];
    
    const mapping = this.crossSpecialtyMap.get(primarySymptom);
    const combinedResults = [];
    
    if (mapping.combinedSymptoms) {
      const allText = [
        contextFactors.primaryConcern || '',
        contextFactors.description || '',
        ...(contextFactors.additionalSymptoms || [])
      ].join(' ').toLowerCase();
      
      for (const [symptomCombo, config] of Object.entries(mapping.combinedSymptoms)) {
        if (allText.includes(symptomCombo.toLowerCase())) {
          combinedResults.push({
            combination: `${primarySymptom} + ${symptomCombo}`,
            specialties: config.priority,
            urgency: config.urgency,
            reason: config.reason,
            confidence: 0.9 // High confidence for specific combinations
          });
        }
      }
    }
    
    return combinedResults;
  }

  // Xác định vùng giải phẫu từ triệu chứng
  identifyAnatomicalRegion(symptom) {
    const symptomLower = symptom.toLowerCase();
    
    if (symptomLower.includes('đầu') || symptomLower.includes('cổ') || symptomLower.includes('gáy')) {
      return 'đầu_cổ';
    }
    if (symptomLower.includes('ngực') || symptomLower.includes('tim') || symptomLower.includes('phổi')) {
      return 'ngực';
    }
    if (symptomLower.includes('bụng') || symptomLower.includes('dạ dày') || symptomLower.includes('ruột')) {
      return 'bụng';
    }
    if (symptomLower.includes('tay') || symptomLower.includes('cánh tay') || symptomLower.includes('cổ tay')) {
      return 'tay';
    }
    if (symptomLower.includes('chân') || symptomLower.includes('bàn chân') || symptomLower.includes('gót')) {
      return 'chân';
    }
    
    return null;
  }

  // Kiểm tra triệu chứng liên quan
  hasRelatedSymptom(connection, contextFactors) {
    const allSymptoms = [
      contextFactors.primaryConcern || '',
      ...(contextFactors.additionalSymptoms || []),
      contextFactors.description || ''
    ].join(' ').toLowerCase();

    return allSymptoms.includes(connection.toLowerCase().replace('_', ' '));
  }

  // Xác định nhóm tuổi
  determineAgeGroup(age) {
    const ageNum = parseInt(age) || 0;
    if (ageNum < 18) return 'trẻ_em';
    if (ageNum >= 65) return 'người_cao_tuổi';
    return 'người_lớn';
  }

  // Xác định pattern temporal
  determineTemporalPattern(duration, onset) {
    if (onset?.toLowerCase().includes('đột ngột') || duration?.toLowerCase().includes('giờ')) {
      return 'cấp_tính';
    }
    if (duration?.toLowerCase().includes('ngày') || duration?.toLowerCase().includes('tuần')) {
      return 'bán_cấp';
    }
    if (duration?.toLowerCase().includes('tháng') || duration?.toLowerCase().includes('năm')) {
      return 'mãn_tính';
    }
    return null;
  }

  // Multi-symptom cross-mapping
  performMultiSymptomCrossMapping(symptoms, contextFactors = {}) {
    const allResults = symptoms.map(symptom => 
      this.performCrossMapping(symptom, contextFactors)
    );

    // Merge results with weighting
    const mergedResults = {
      primarySpecialties: new Map(),
      secondarySpecialties: new Map(),
      conditionalSpecialties: new Map(),
      crossReferences: [],
      totalConfidence: 0,
      mappingTypes: []
    };

    allResults.forEach((result, index) => {
      const weight = 1.0 - (index * 0.1); // Giảm trọng số cho triệu chứng phụ

      // Weight primary specialties
      result.primarySpecialties.forEach(specialty => {
        const current = mergedResults.primarySpecialties.get(specialty) || 0;
        mergedResults.primarySpecialties.set(specialty, current + weight);
      });

      // Weight secondary specialties  
      result.secondarySpecialties.forEach(specialty => {
        const current = mergedResults.secondarySpecialties.get(specialty) || 0;
        mergedResults.secondarySpecialties.set(specialty, current + weight * 0.7);
      });

      // Weight conditional specialties
      result.conditionalSpecialties.forEach(specialty => {
        const current = mergedResults.conditionalSpecialties.get(specialty) || 0;
        mergedResults.conditionalSpecialties.set(specialty, current + weight * 0.5);
      });

      mergedResults.crossReferences.push(...result.crossReferences);
      mergedResults.totalConfidence += result.confidence * weight;
      mergedResults.mappingTypes.push(...result.mappingType);
    });

    // Sort specialties by weight
    const sortedPrimary = Array.from(mergedResults.primarySpecialties.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([specialty, weight]) => ({ specialty, weight: weight.toFixed(2) }));

    const sortedSecondary = Array.from(mergedResults.secondarySpecialties.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([specialty, weight]) => ({ specialty, weight: weight.toFixed(2) }));

    return {
      rankedSpecialties: [
        ...sortedPrimary.slice(0, 5),
        ...sortedSecondary.slice(0, 3)
      ],
      crossReferences: mergedResults.crossReferences,
      confidence: Math.min(0.95, mergedResults.totalConfidence / symptoms.length),
      mappingTypes: [...new Set(mergedResults.mappingTypes)]
    };
  }

  // Tích hợp với enhanced medical knowledge
  enhanceWithCrossMapping(originalAnalysis, contextFactors = {}) {
    if (!originalAnalysis.matchedSymptoms?.length) {
      return originalAnalysis;
    }

    const crossMappingResult = this.performMultiSymptomCrossMapping(
      originalAnalysis.matchedSymptoms,
      contextFactors
    );

    // Merge với kết quả gốc
    const enhancedSpecialties = new Map();
    
    // Add original specialties with base weight
    originalAnalysis.recommendedSpecialties.forEach((specialty, index) => {
      const baseWeight = 1.0 - (index * 0.1);
      enhancedSpecialties.set(specialty, baseWeight);
    });

    // Add cross-mapped specialties
    crossMappingResult.rankedSpecialties.forEach(({ specialty, weight }) => {
      const current = enhancedSpecialties.get(specialty) || 0;
      enhancedSpecialties.set(specialty, current + parseFloat(weight) * 0.8);
    });

    // Sort final results
    const finalSpecialties = Array.from(enhancedSpecialties.entries())
      .sort((a, b) => b[1] - a[1]);

    // Apply focused filtering để chỉ lấy 1-2 specialties most relevant
    const focusedSpecialties = this.applyFocusedFiltering(finalSpecialties, originalAnalysis);

    return {
      ...originalAnalysis,
      recommendedSpecialties: focusedSpecialties,
      crossMappingInsights: {
        crossReferences: crossMappingResult.crossReferences,
        mappingTypes: crossMappingResult.mappingTypes,
        crossMappingConfidence: crossMappingResult.confidence
      },
      confidence: Math.max(originalAnalysis.confidence, crossMappingResult.confidence)
    };
  }

  // Apply focused filtering để chỉ lấy 1-2 specialties most relevant
  applyFocusedFiltering(sortedSpecialties, originalAnalysis) {
    if (sortedSpecialties.length === 0) return [];
    
    const topSpecialty = sortedSpecialties[0];
    const topScore = topSpecialty[1];
    
    // Nếu chỉ có 1 specialty có score cao rõ ràng
    if (sortedSpecialties.length === 1 || topScore >= 3.0) {
      return [topSpecialty[0]];
    }
    
    // Kiểm tra urgency level để quyết định số specialty
    const urgencyLevel = originalAnalysis.urgencyLevel;
    
    // Emergency cases: Chỉ focus vào 1 specialty chính
    if (urgencyLevel === 'khẩn cấp') {
      return [topSpecialty[0]];
    }
    
    // Non-emergency: Có thể lấy 2 nếu scores gần bằng nhau
    if (sortedSpecialties.length > 1) {
      const secondSpecialty = sortedSpecialties[1];
      const secondScore = secondSpecialty[1];
      const scoreDifference = topScore - secondScore;
      
      // Nếu score khác nhau quá nhiều (>1.5), chỉ lấy top 1
      if (scoreDifference > 1.5) {
        return [topSpecialty[0]];
      }
      
      // Nếu scores gần bằng nhau và cả 2 đều có score đủ cao, lấy 2 specialties
      if (scoreDifference <= 0.8 && secondScore >= 1.2) {
        return [topSpecialty[0], secondSpecialty[0]];
      }
    }
    
    // Default: chỉ lấy top 1
    return [topSpecialty[0]];
  }
}

module.exports = new CrossMappingService();