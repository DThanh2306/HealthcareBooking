const aiDoctorKnowledge = require("./aiDoctorKnowledge.service");
const locationBasedRecommendation = require("./locationBasedRecommendation.service");
const medicalKnowledge = require("./medicalKnowledge.service");
const medicalLibrary = require("./medicalLibrary.service");
const hospitalService = require("./hospital.service");

function shortlistUnique(items, key, limit) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const value = item[key];
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function normalizeName(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class AiDoctorRecommendationService {
  async getRecommendations(state) {
    await aiDoctorKnowledge.initialize();

    // Load hospital list from DB to ensure addresses come from authoritative source
    let allHospitals = [];
    try {
      allHospitals = await hospitalService.getAllHospitals();
    } catch (e) {
      console.warn('⚠️ Could not load hospitals from DB, will fallback to knowledge base only');
    }
    const hospitalById = new Map((allHospitals || []).map(h => [h.h_id, h]));
    const hospitalByNameMulti = new Map();
    (allHospitals || [])
      .filter(h => h && h.h_name)
      .forEach(h => {
        const keys = new Set([
          String(h.h_name).trim().toLowerCase(),
          normalizeName(h.h_name)
        ]);
        keys.forEach(k => {
          if (!k) return;
          if (!hospitalByNameMulti.has(k)) hospitalByNameMulti.set(k, []);
          hospitalByNameMulti.get(k).push(h);
        });
      });

    const resolveHospital = (doc) => {
      if (!doc) return null;

      // Prepare name-based candidates first
      let nameCandidates = [];
      if (doc.hospitalName) {
        const key1 = String(doc.hospitalName).trim().toLowerCase();
        const key2 = normalizeName(doc.hospitalName);
        nameCandidates = [
          ...(hospitalByNameMulti.get(key1) || []),
          ...(hospitalByNameMulti.get(key2) || [])
        ];
      }

      // Prefer DB by ID when it agrees with the name (to avoid stale/wrong id)
      const idHospital = (doc.hospitalId && hospitalById.get(doc.hospitalId))
        || (doc.hospitalId && aiDoctorKnowledge.getHospitalById(doc.hospitalId))
        || null;

      if (idHospital) {
        if (nameCandidates.length === 0) {
          return idHospital; // No name to contradict, use ID
        }
        const idNameNorm = normalizeName(idHospital.h_name);
        const hasAgreement = nameCandidates.some(h => normalizeName(h.h_name) === idNameNorm);
        if (hasAgreement) {
          return idHospital; // ID and Name agree
        }
        // If ID disagrees with name, trust name to prevent address drift
      }

      // Resolve by name candidates
      if (nameCandidates.length === 1) return nameCandidates[0];
      if (nameCandidates.length > 1) {
        // Disambiguate by address/location hints
        const docAddr = String(doc.hospitalAddress || '').toLowerCase();
        const exact = nameCandidates.find(h => docAddr && h.h_address && docAddr.includes(String(h.h_address).split(',').pop().trim().toLowerCase()));
        if (exact) return exact;
        const userLoc = String(state?.location || '').toLowerCase();
        const heur = nameCandidates.find(h => userLoc && h.h_address && h.h_address.toLowerCase().includes(userLoc));
        if (heur) return heur;
        return nameCandidates[0];
      }

      // Lastly, fallback to ID if present
      if (idHospital) return idHospital;

      return null;
    };

    // Enhanced medical analysis
    const medicalAnalysis = medicalKnowledge.analyzePatientData(state);
    console.log("🔍 Medical Analysis:", medicalAnalysis);

    const libraryMatches = medicalLibrary.searchBySymptoms(
      state.primaryConcern || "",
      { limit: 3 }
    );

    const librarySpecialties = Array.from(
      new Set(
        libraryMatches.flatMap(
          (match) => match.recommendedSpecialties || []
        )
      )
    );

    const combinedSpecialties = this.mergeSpecialties(
      medicalAnalysis.recommendedSpecialties,
      librarySpecialties
    );
    // Preserve primary medical analysis specialties for display; use combined for search/scoring
    medicalAnalysis._combinedSpecialties = combinedSpecialties;

    // Build enhanced query with medical context
    const queryParts = [
      state.gender ? `Giới tính ${state.gender}` : "",
      state.age ? `Tuổi ${state.age}` : "",
      state.location ? `Khu vực ${state.location}` : "",
      state.primaryConcern ? `Triệu chứng ${state.primaryConcern}` : "",
      state.symptomDuration ? `Thời gian bị ${state.symptomDuration}` : "",
      state.medicalHistory ? `Tiền sử ${state.medicalHistory}` : "",
      state.currentMedications ? `Thuốc đang dùng ${state.currentMedications}` : "",
      state.expectations ? `Nhu cầu ${state.expectations}` : "",
      // Add medical context
      combinedSpecialties.length > 0
        ? `Chuyên khoa phù hợp ${combinedSpecialties.join(" ")}`
        : "",
    ]
      .filter(Boolean)
      .join(". ");

    // Get doctor matches with enhanced scoring
    const doctorMatches = await this.getEnhancedDoctorMatches(
      queryParts, 
      state, 
      medicalAnalysis
    );

    // 1) GPS-based hospital search if location provided (PRIORITIZED)
    let hospitalMatches = [];
    if (state.location) {
      console.log(`🔍 Searching hospitals near: ${state.location}`);
      
      // Use GPS-based location search
      const locationResults = await locationBasedRecommendation.findLocationBasedHospitals(
        state.location,
        combinedSpecialties, 
        [], // no specific preferences
        { limit: 10, radiusKm: state.radiusKm || 50, includeExternal: false }
      );
      
      if (locationResults.hospitals && locationResults.hospitals.length > 0) {
        console.log(`🏥 Found ${locationResults.hospitals.length} location-based hospitals`);
        hospitalMatches = locationResults.hospitals.map(hospital => ({
          doc: hospital.doc || hospital,
          score: hospital.score || 0.5,
          distance: hospital.distance,
          distanceText: hospital.distanceText
        }));
      }
    }
    
    // Fallback to general search if no location-based results
    if (hospitalMatches.length === 0) {
      console.log('📝 Using fallback hospital search');
      hospitalMatches = await aiDoctorKnowledge.query(queryParts, {
        limit: 5,
        type: "hospital",
        location: state.location,
      });

      // Enrich fallback hospitals with GPS distance if possible
      try {
        if (state.location && hospitalMatches && hospitalMatches.length) {
          const geoLocationService = require('./geoLocationService.service');
          const userGeo = await geoLocationService.parseLocationInput(state.location);
          if (userGeo) {
            const hospitalList = hospitalMatches.map(({ doc }) => {
              const h = doc?.raw || doc || {};
              return {
                id: h.h_id || h.id,
                name: h.h_name || h.name || h.hospitalName,
                hospitalAddress: h.h_address || h.hospitalAddress || h.address,
                coordinates: h.coordinates,
                specialty: h.specialty,
              };
            }).filter(h => h.hospitalAddress || h.coordinates);

            const nearby = await geoLocationService.findHospitalsWithinRadius(
              userGeo,
              hospitalList,
              state.radiusKm || 100
            );

            // remap distances back into hospitalMatches using id or name as key
            const byId = new Map(nearby.filter(h => h.id).map(h => [h.id, h]));
            const byName = new Map(nearby.filter(h => h.name).map(h => [h.name, h]));
            hospitalMatches = hospitalMatches.map(({ doc, score }) => {
              const h = doc?.raw || doc || {};
              const id = h.h_id || h.id;
              const keyName = h.h_name || h.name || h.hospitalName;
              const enriched = (id && byId.get(id)) || (keyName && byName.get(keyName));
              return {
                doc,
                score,
                distance: enriched?.distance,
                distanceText: enriched?.distanceText,
              };
            });
          }
        }
      } catch (enrichErr) {
        console.warn('⚠️ Could not enrich fallback hospitals with distance:', enrichErr.message);
      }
    }

    // 2) Build doctor list, BOOST those in nearby hospitals
    // Collect nearby hospital IDs for boosting and map distances
    const nearbyHospitalIds = new Set(
      hospitalMatches
        .filter(h => !!(h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id))
        .map(h => h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id)
    );
    const hospitalDistanceById = new Map(
      hospitalMatches
        .filter(h => !!(h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id))
        .map(h => [h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id, { distance: h.distance, distanceText: h.distanceText }])
    );
    // Also index by normalized hospital name to handle missing/mismatched IDs (with fuzzy support)
    const hospitalDistanceByName = new Map(
      hospitalMatches
        .map(h => {
          const name = h.doc?.raw?.h_name || h.doc?.h_name || h.doc?.name || h.doc?.hospitalName;
          const key = normalizeName(name || '');
          return key ? [key, { distance: h.distance, distanceText: h.distanceText, id: h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id, name, norm: key }] : null;
        })
        .filter(Boolean)
    );

    // Fuzzy name helper (Jaro-Winkler-like simplified)
    function similarity(a, b) {
      a = (a || '').toLowerCase();
      b = (b || '').toLowerCase();
      if (!a || !b) return 0;
      if (a === b) return 1;
      const setA = new Set(a.split(/\s+/g));
      const setB = new Set(b.split(/\s+/g));
      const common = Array.from(setA).filter(x => setB.has(x)).length;
      const denom = Math.max(setA.size, setB.size);
      return denom ? common / denom : 0;
    }
    function findByFuzzyName(name, threshold = Number(process.env.HOSPITAL_NAME_SIM_THRESHOLD || 0.75)) {
      const key = normalizeName(name || '');
      if (!key) return null;
      if (hospitalDistanceByName.has(key)) return hospitalDistanceByName.get(key);
      // Try fuzzy scan
      let best = null;
      let bestScore = 0;
      for (const [k, v] of hospitalDistanceByName.entries()) {
        const score = similarity(k, key);
        if (score > bestScore) { bestScore = score; best = v; }
      }
      return bestScore >= threshold ? best : null;
    }

  // Dynamic expansion for doctors: if many strong specialty matches nearby hospitals, increase count
  const DOCTOR_STRONG_THRESHOLD = Number(process.env.DOCTOR_STRONG_THRESHOLD || 0.65);
  const DOCTOR_EXPAND_MAX = Number(process.env.DOCTOR_EXPAND_MAX || 20);

  // Build enriched doctors list with distance and specialty flags
  const norm = (s) => (s ? String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() : '');
  const recCombinedNorm = (medicalAnalysis._combinedSpecialties || medicalAnalysis.recommendedSpecialties).map(norm);
  const recPrimaryNorm = (medicalAnalysis.recommendedSpecialties || []).map(norm);
  // Specialty keyword dictionary (accent-insensitive)
  const SPECIALTY_KEYWORDS = {
    'tieu hoa': ['tieu hoa', 'tieu hoa gan mat', 'bao tu', 'da day', 'gan', 'mat', 'ruot', 'gan mat'],
    'noi khoa': ['noi khoa', 'noi tong quat', 'noi', 'tang huyet ap', 'tieu duong'],
    'than kinh': ['than kinh', 'than kinh hoc', 'noi than kinh', 'dau dau', 'migraine', 'dong kinh', 'parkinson', 'than kinh cot song'],
    'co xuong khop': ['co xuong khop', 'xuong khop', 'cot song', 'thoai hoa', 'chan thuong chinh hinh', 'phau thuat chinh hinh'],
    'tai mui hong': ['tai mui hong', 'tmh', 'xoang', 'viem hong', 'viem mui'],
    'nhi khoa': ['nhi khoa', 'tre em', 'nhi'],
    'san phu khoa': ['san phu khoa', 'san khoa', 'phu khoa', 'san'],
    'da lieu': ['da lieu', 'mun', 'viem da', 'viem da co dia', 'nam', 'ngua'],
    'nam khoa': ['nam khoa', 'nam hoc', 'tiet nieu', 'nieu khoa', 'tien liet tuyen', 'urology', 'uro', 'roi loan cuong duong', 'xuat tinh som'],
    'mat': ['mat', 'nhan khoa', 'can thi', 'vien thi', 'loan thi', 'giac mac', 'ket mac', 'glaucoma', 'khan uot', 'do mat', 'vien mat']
  };

  const hasWord = (text, word) => {
    const w = word.trim();
    if (!w) return false;
    const re = new RegExp(`(^|\\s)${w}(\\s|$)`);
    return re.test(text);
  };

  const canonical = (s) => {
    const x = norm(s);
    if (!x) return '';
    // Order matters: check specific specialties before general ones
    if (hasWord(x, 'than') && hasWord(x, 'kinh')) return 'than kinh';
    if (x.includes('tieu hoa') || hasWord(x, 'bao tu') || hasWord(x, 'da day') || hasWord(x, 'gan')) return 'tieu hoa';
    if (x.includes('tai mui hong') || x.includes('tmh')) return 'tai mui hong';
    if (x.includes('da lieu')) return 'da lieu';
    if (x.includes('san') || x.includes('phu khoa')) return 'san phu khoa';
    if (x.includes('mat') || x.includes('nhan khoa')) return 'mat';
    if (x.includes('xuong khop') || x.includes('cot song') || x.includes('chinh hinh')) return 'co xuong khop';
    if (hasWord(x, 'nhi')) return 'nhi khoa';
    if (hasWord(x, 'noi') || x.includes('noi khoa')) return 'noi khoa';
    return x;
  };

  const isSpecialtyMatch = (docSpec, recSpecs) => {
    const d = norm(docSpec);
    if (!d) return false;

    // canonical comparison first to avoid substring false positives
    const dCanon = canonical(d);
    for (const r of recSpecs) {
      const rCanon = canonical(r);
      if (rCanon && dCanon && rCanon === dCanon) return true;

      const keywords = SPECIALTY_KEYWORDS[rCanon];
      if (keywords && keywords.some(k => hasWord(d, k))) return true;

      // as a last resort, allow whole-word direct match
      if (hasWord(d, r)) return true;
    }
    return false;
  };


  const doctorsRaw = doctorMatches.map(({ doc, score }) => {
    // Boost doctors who work at nearby hospitals
    let finalScore = score;
    let distance, distanceText;
    if (doc.hospitalId && nearbyHospitalIds.has(doc.hospitalId)) {
      finalScore += 0.15; // modest boost; prioritize specialty over distance
      const d = hospitalDistanceById.get(doc.hospitalId);
      if (d) {
        distance = d.distance;
        distanceText = d.distanceText;
      }
    } else {
      // Fallback by hospital name when ID mismatches (with fuzzy)
      const d2 = findByFuzzyName(doc.hospitalName);
      if (d2) {
        distance = d2.distance;
        distanceText = d2.distanceText;
        finalScore += 0.1; // light boost when matched by name
      }
    }

    const hospital = resolveHospital(doc) || aiDoctorKnowledge.getHospitalById(doc.hospitalId) || doc.raw || {};
    const provinceCmp = locationBasedRecommendation.compareUserInputWithDoctorHospital(state.location, { hospitalAddress: hospital.h_address, dr_h_name: doc.hospitalName, hospitalName: doc.hospitalName });
    return {
      dr_id: doc.raw?.dr_id || doc.dr_id || null,
      id: doc.raw?.dr_id || doc.dr_id || null, // keep legacy id for FE fallback
      name: doc.name,
      specialty: doc.specialty,
      hospitalName: doc.hospitalName,
      hospitalAddress:
        hospital.h_address || doc.hospitalAddress || "Đang cập nhật",
      price: doc.price,
      matchScore: Math.max(0, Math.min(1, Number(finalScore.toFixed(3)))), // clamp 0..1
      image: doc.image,
      description: doc.description,
      distance,
      distanceText,
      sameProvince: provinceCmp?.level === 'same_province',
      regionLevel: provinceCmp?.level,
      strongSpecialty: isSpecialtyMatch(doc.specialty, recCombinedNorm),
      strongPrimarySpecialty: recPrimaryNorm.length ? isSpecialtyMatch(doc.specialty, recPrimaryNorm) : isSpecialtyMatch(doc.specialty, recCombinedNorm)
    };
  });

    // Apply specialty filter (medical-first) and nearby hospital constraint
    const DOCTOR_NEARBY_ONLY = String(process.env.DOCTOR_NEARBY_ONLY || 'true').toLowerCase() === 'true';
    // Strictly align displayed doctors with primary analysis specialties when available
    let doctors = doctorsRaw.filter(d => d.strongPrimarySpecialty === true);
    if (DOCTOR_NEARBY_ONLY) {
      doctors = doctors.filter(d => d && d.hospitalName && d.distance !== undefined);
    }

    // If too few results, try radius expansion
    const MIN_RESULTS = Number(process.env.DOCTOR_MIN_RESULTS || 6);
    if (doctors.length < MIN_RESULTS && state.location) {
      try {
        const factor = Number(process.env.DOCTOR_EXPAND_RADIUS_FACTOR || 1.5);
        const expanded = await locationBasedRecommendation.findLocationBasedHospitals(
          state.location,
          combinedSpecialties,
          [],
          { limit: 12, radiusKm: Math.round((state.radiusKm || 50) * factor), includeExternal: false }
        );
        const expandedNearbyIds = new Set(
          (expanded.hospitals || [])
            .map(h => h.doc?.raw?.h_id || h.doc?.h_id || h.doc?.id)
            .filter(Boolean)
        );
        doctors = doctorsRaw
          .filter(d => d.strongPrimarySpecialty === true)
          .filter(d => {
            // Keep if belongs to expanded nearby hospitals (by name match with earlier map)
            const h = resolveHospital({ hospitalName: d.hospitalName }) || {};
            return h && expandedNearbyIds.has(h.h_id);
          });
      } catch (e) {
        console.warn('doctor radius expansion failed:', e && e.message || e);
      }
    }

    const specialties = Array.from(
      new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean))
    ).slice(0, 5);

    // Expand doctor results dynamically if many strong matches
    const strongDoctorCount = doctors.filter(d => d.strongSpecialty === true).length;
    const defaultDoctorLimit = 5;
    const targetDoctorLimit = strongDoctorCount > defaultDoctorLimit
      ? Math.min(strongDoctorCount, DOCTOR_EXPAND_MAX)
      : defaultDoctorLimit;

    // Build hospitals list strictly from DB when possible to avoid address drift
    // Put GPS-derived hospitals first to preserve distance fields during de-duplication
    const hospitals = shortlistUnique(
      [
        ...hospitalMatches.map(({ doc, score, distance, distanceText }) => {
          const id = doc.raw?.h_id || doc.h_id || doc.id;
          const dbHospital = aiDoctorKnowledge.getHospitalById(id) || doc.raw || {};
          const address = dbHospital.h_address || doc.hospitalAddress || doc.address;
          const provinceCmp = locationBasedRecommendation.compareUserInputWithHospitalAddress(state.location, address);
          return {
            h_id: dbHospital.h_id || id,
            id: dbHospital.h_id || id,
            name: dbHospital.h_name || doc.name || doc.hospitalName,
            address,
            score: Number(score.toFixed(3)),
            phone: dbHospital.h_phone || doc.phone,
            description: dbHospital.h_description || doc.description,
            distance,
            distanceText,
            locationMethod: typeof distance === 'number' ? 'gps' : 'text',
            sameProvince: provinceCmp?.level === 'same_province',
            regionLevel: provinceCmp?.level
          };
        }),
        ...doctorMatches.map(({ doc, score }) => {
          const hospital = resolveHospital(doc) || aiDoctorKnowledge.getHospitalById(doc.hospitalId) || {};
          const hid = hospital.h_id || doc.hospitalId;
          const d = hid ? hospitalDistanceById.get(hid) : null;
          const address = hospital.h_address || doc.hospitalAddress;
          const provinceCmp = locationBasedRecommendation.compareUserInputWithHospitalAddress(state.location, address);
          return {
            h_id: hid,
            id: hid,
            name: hospital.h_name || doc.hospitalName,
            address,
            score: Number(score.toFixed(3)),
            phone: hospital.h_phone,
            description: hospital.h_description,
            distance: d?.distance,
            distanceText: d?.distanceText,
            locationMethod: d?.distance ? 'gps' : 'text',
            sameProvince: provinceCmp?.level === 'same_province',
            regionLevel: provinceCmp?.level
          };
        }),
      ].filter((item) => item && item.name && item.id),
      "id",
      5 // Increase to 5 để hiển thị nhiều options hơn
    );

    const noDoctorsFound = doctors.length === 0;
    return {
      specialties: (medicalAnalysis.recommendedSpecialties && medicalAnalysis.recommendedSpecialties.length > 0)
        ? medicalAnalysis.recommendedSpecialties.slice(0, 5)
        : (combinedSpecialties.length > 0 ? combinedSpecialties.slice(0, 5) : specialties),
      doctors: doctors.slice(0, targetDoctorLimit),
      hospitals,
      noDoctorsFound,
      medicalContext: {
        urgencyLevel: medicalAnalysis.urgencyLevel,
        confidence: medicalAnalysis.confidence,
        matchedSymptoms: medicalAnalysis.matchedSymptoms,
        libraryInsights: libraryMatches,
      },
    };
  }

  mergeSpecialties(primary = [], supplemental = []) {
    const scoreMap = new Map();
    primary.forEach((specialty, index) => {
      if (!specialty) return;
      const weight = 2 + Math.max(0, 3 - index) * 0.1;
      scoreMap.set(specialty, (scoreMap.get(specialty) || 0) + weight);
    });

    supplemental.forEach((specialty) => {
      if (!specialty) return;
      scoreMap.set(specialty, (scoreMap.get(specialty) || 0) + 1);
    });

    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([specialty]) => specialty);
  }

  // Enhanced doctor matching with medical intelligence
  async getEnhancedDoctorMatches(queryParts, state, medicalAnalysis) {
    const baseMatches = await aiDoctorKnowledge.query(queryParts, {
      limit: 15, // Get more initially for better filtering
      type: "doctor",
      location: state.location,
    });

    // Re-score based on medical context
    const enhancedMatches = baseMatches.map(({ doc, score }) => {
      let enhancedScore = score;

      const recommendedSet = new Set(medicalAnalysis._combinedSpecialties || medicalAnalysis.recommendedSpecialties);
      // Boost if specialty matches medical analysis (medical-first)
      if (recommendedSet.has(doc.specialty)) {
        enhancedScore += 0.5;
      }

      // Boost for urgency-appropriate specialties
      if (medicalAnalysis.urgencyLevel === 'khẩn cấp' && 
          (doc.specialty === 'Cấp cứu' || doc.specialty === 'Nội khoa')) {
        enhancedScore += 0.4;
      }

      // Age-specific boosts
      const age = parseInt(state.age);
      if (!isNaN(age)) {
        if (age <= 15 && doc.specialty === 'Nhi khoa') {
          enhancedScore += 0.25;
        }
        if (age >= 65 && (doc.specialty === 'Lão khoa' || doc.specialty === 'Tim mạch')) {
          enhancedScore += 0.2;
        }
      }

      // Gender-specific boosts
      if (state.gender && state.gender.toLowerCase().includes('nữ') && 
          doc.specialty === 'Sản Phụ khoa') {
        enhancedScore += 0.2;
      }

      // Medical terms matching boost
      if (doc.medicalTerms && medicalAnalysis.matchedSymptoms) {
        const termMatches = doc.medicalTerms.filter(term => 
          medicalAnalysis.matchedSymptoms.some(symptom => 
            symptom.toLowerCase().includes(term.toLowerCase())
          )
        ).length;
        enhancedScore += termMatches * 0.1;
      }

      return { doc, score: enhancedScore };
    });

    // Sort by enhanced score and return top matches
    return enhancedMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }
}

module.exports = new AiDoctorRecommendationService();

