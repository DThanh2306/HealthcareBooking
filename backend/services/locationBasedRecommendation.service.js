// Location-Based Hospital Recommendation Service
const aiDoctorKnowledge = require('./aiDoctorKnowledge.service');
const hospitalDb = require('./hospital.service');

const geoLocationService = require("./geoLocationService.service");

class LocationBasedRecommendationService {
  // Compute specialty relevance score [0..1]
  computeSpecialtyScore(hospital, recommendedSpecialties = []) {
    try {
      const specText = String(hospital.specialty || hospital.h_description || '').toLowerCase();
      const nameText = String(hospital.name || hospital.h_name || '').toLowerCase();
      if (!recommendedSpecialties || recommendedSpecialties.length === 0) return 0.5; // neutral when no target
      const rec = recommendedSpecialties.map(s => String(s || '').toLowerCase());
      const hasExact = rec.some(s => specText.includes(s) || nameText.includes(s));
      const isGeneral = specText.includes('đa khoa');
      if (hasExact) return 1.0;
      if (isGeneral) return 0.7;
      // partial keyword overlap
      const tokens = rec.flatMap(s => s.split(/\s+/g)).filter(Boolean);
      const partial = tokens.some(t => specText.includes(t) || nameText.includes(t));
      return partial ? 0.6 : 0.2;
    } catch {
      return 0.4;
    }
  }

  // Compute distance score [0..1] within given radius
  computeDistanceScore(distanceKm, radiusKm = 50) {
    if (typeof distanceKm !== 'number' || !isFinite(distanceKm)) return 0;
    const r = Math.max(1, Number(radiusKm) || 50);
    const score = Math.max(0, 1 - distanceKm / r);
    return Number(score.toFixed(4));
  }

  // Combine with weights (medical-first)
  compositeHospitalScore(h, recommendedSpecialties = [], radiusKm = 50) {
    const MED_W = Number(process.env.MEDICAL_WEIGHT || 0.75);
    const DIST_W = Number(process.env.DISTANCE_WEIGHT || 0.25);
    const specScore = this.computeSpecialtyScore(h, recommendedSpecialties);
    const distScore = this.computeDistanceScore(h.distance, radiusKm);
    const sumW = (isFinite(MED_W) ? MED_W : 0) + (isFinite(DIST_W) ? DIST_W : 0);
    let score = sumW > 0 ? ((MED_W * specScore + DIST_W * distScore) / sumW) : 0;
    if (!isFinite(score)) score = 0;
    // Clamp to [0,1]
    score = Math.max(0, Math.min(1, score));
    return Number(score.toFixed(4));
  }
  constructor() {
    // Vietnamese provinces and major cities mapping
    this.vietnameseLocations = new Map([
      // Miền Bắc
      ['hà nội', { 
        region: 'miền bắc', 
        province: 'Hà Nội',
        keywords: ['hà nội', 'hanoi', 'thủ đô', 'ba đình', 'hoàn kiếm', 'đống đa', 'hai bà trưng', 'cầu giấy', 'thanh xuân', 'hoàng mai', 'long biên', 'nam từ liêm', 'bắc từ liêm', 'tây hồ']
      }],
      ['hải phòng', { 
        region: 'miền bắc', 
        province: 'Hải Phòng',
        keywords: ['hải phòng', 'haiphong', 'cát bà', 'lê chân', 'ngô quyền', 'hồng bàng', 'kiến an']
      }],
      ['hải dương', { 
        region: 'miền bắc', 
        province: 'Hải Dương',
        keywords: ['hải dương', 'haiduong', 'chí linh', 'nam sách']
      }],
      ['hưng yên', { 
        region: 'miền bắc', 
        province: 'Hưng Yên',
        keywords: ['hưng yên', 'hung yen', 'mỹ hào', 'văn lâm']
      }],
      ['bắc ninh', { 
        region: 'miền bắc', 
        province: 'Bắc Ninh',
        keywords: ['bắc ninh', 'bac ninh', 'từ sơn', 'thuận thành']
      }],
      ['quảng ninh', { 
        region: 'miền bắc', 
        province: 'Quảng Ninh',
        keywords: ['quảng ninh', 'quang ninh', 'hạ long', 'móng cái', 'cẩm phả']
      }],
      ['thái bình', { 
        region: 'miền bắc', 
        province: 'Thái Bình',
        keywords: ['thái bình', 'thai binh']
      }],
      ['nam định', { 
        region: 'miền bắc', 
        province: 'Nam Định',
        keywords: ['nam định', 'nam dinh']
      }],
      ['ninh bình', { 
        region: 'miền bắc', 
        province: 'Ninh Bình',
        keywords: ['ninh bình', 'ninh binh', 'tam cốc']
      }],

      // Miền Trung
      ['đà nẵng', { 
        region: 'miền trung', 
        province: 'Đà Nẵng',
        keywords: ['đà nẵng', 'da nang', 'danang', 'hải châu', 'thanh khê', 'sơn trà', 'ngũ hành sơn', 'liên chiểu', 'cẩm lệ']
      }],
      ['huế', { 
        region: 'miền trung', 
        province: 'Thừa Thiên Huế',
        keywords: ['huế', 'hue', 'thừa thiên huế', 'thừa thiên', 'phong điền']
      }],
      ['quảng nam', { 
        region: 'miền trung', 
        province: 'Quảng Nam',
        keywords: ['quảng nam', 'quang nam', 'hội an', 'tam kỳ']
      }],
      ['quảng ngãi', { 
        region: 'miền trung', 
        province: 'Quảng Ngãi',
        keywords: ['quảng ngãi', 'quang ngai']
      }],
      ['bình định', { 
        region: 'miền trung', 
        province: 'Bình Định',
        keywords: ['bình định', 'binh dinh', 'quy nhon', 'quy nhơn']
      }],
      ['phú yên', { 
        region: 'miền trung', 
        province: 'Phú Yên',
        keywords: ['phú yên', 'phu yen', 'tuy hòa']
      }],
      ['khánh hòa', { 
        region: 'miền trung', 
        province: 'Khánh Hòa',
        keywords: ['khánh hòa', 'khanh hoa', 'nha trang', 'cam ranh']
      }],
      ['ninh thuận', { 
        region: 'miền trung', 
        province: 'Ninh Thuận',
        keywords: ['ninh thuận', 'ninh thuan', 'phan rang']
      }],
      ['bình thuận', { 
        region: 'miền trung', 
        province: 'Bình Thuận',
        keywords: ['bình thuận', 'binh thuan', 'phan thiết']
      }],

      // Miền Nam
      ['tp hồ chí minh', { 
        region: 'miền nam', 
        province: 'TP Hồ Chí Minh',
        keywords: ['tp hồ chí minh', 'hồ chí minh', 'ho chi minh', 'sài gòn', 'saigon', 'tphcm', 'hcmc', 'quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 'bình thạnh', 'gò vấp', 'phú nhuận', 'tân bình', 'tân phú', 'thủ đức', 'bình tân']
      }],
      ['bình dương', { 
        region: 'miền nam', 
        province: 'Bình Dương',
        keywords: ['bình dương', 'binh duong', 'thủ dầu một', 'dĩ an', 'thuận an', 'bến cát']
      }],
      ['đồng nai', { 
        region: 'miền nam', 
        province: 'Đồng Nai',
        keywords: ['đồng nai', 'dong nai', 'biên hòa', 'long thành']
      }],
      ['bà rịa vũng tàu', { 
        region: 'miền nam', 
        province: 'Bà Rịa Vũng Tàu',
        keywords: ['bà rịa vũng tàu', 'ba ria vung tau', 'vũng tàu', 'bà rịa', 'côn đảo']
      }],
      ['long an', { 
        region: 'miền nam', 
        province: 'Long An',
        keywords: ['long an', 'tân an', 'đức hòa']
      }],
      ['tây ninh', { 
        region: 'miền nam', 
        province: 'Tây Ninh',
        keywords: ['tây ninh', 'tay ninh']
      }],
      ['bình phước', { 
        region: 'miền nam', 
        province: 'Bình Phước',
        keywords: ['bình phước', 'binh phuoc', 'đồng xoài']
      }],
      ['cần thơ', { 
        region: 'miền nam', 
        province: 'Cần Thơ',
        keywords: ['cần thơ', 'can tho', 'ninh kiều', 'bình thủy', 'cái răng', 'ô môn', 'thốt nốt']
      }],
      ['an giang', { 
        region: 'miền nam', 
        province: 'An Giang',
        keywords: ['an giang', 'long xuyên', 'châu đốc']
      }],
      ['kiên giang', { 
        region: 'miền nam', 
        province: 'Kiên Giang',
        keywords: ['kiên giang', 'kien giang', 'rạch giá', 'phú quốc']
      }],
      ['đồng tháp', { 
        region: 'miền nam', 
        province: 'Đồng Tháp',
        keywords: ['đồng tháp', 'dong thap', 'cao lãnh', 'sa đéc']
      }],
      ['tiền giang', { 
        region: 'miền nam', 
        province: 'Tiền Giang',
        keywords: ['tiền giang', 'tien giang', 'mỹ tho']
      }],
      ['bến tre', { 
        region: 'miền nam', 
        province: 'Bến Tre',
        keywords: ['bến tre', 'ben tre']
      }],
      ['vĩnh long', { 
        region: 'miền nam', 
        province: 'Vĩnh Long',
        keywords: ['vĩnh long', 'vinh long']
      }],
      ['trà vinh', { 
        region: 'miền nam', 
        province: 'Trà Vinh',
        keywords: ['trà vinh', 'tra vinh']
      }],
      ['sóc trăng', { 
        region: 'miền nam', 
        province: 'Sóc Trăng',
        keywords: ['sóc trăng', 'soc trang']
      }],
      ['bạc liêu', { 
        region: 'miền nam', 
        province: 'Bạc Liêu',
        keywords: ['bạc liêu', 'bac lieu']
      }],
      ['cà mau', { 
        region: 'miền nam', 
        province: 'Cà Mau',
        keywords: ['cà mau', 'ca mau']
      }]
    ]);

    // Priority keywords for location detection
    this.locationKeywords = [
      'gần nhà', 'gần chỗ tôi', 'gần đây', 'địa phương', 'trong khu vực',
      'tại', 'ở', 'tỉnh', 'thành phố', 'quận', 'huyện', 'xã', 'phường'
    ];

    // Preference mapping
    this.preferenceMap = new Map([
      ['gần nhà', 'location_priority'],
      ['gần chỗ tôi', 'location_priority'],
      ['gần đây', 'location_priority'],
      ['tư vấn từ xa', 'telemedicine'],
      ['tư vấn online', 'telemedicine'],
      ['khám từ xa', 'telemedicine'],
      ['khám gấp', 'urgent_care'],
      ['cấp cứu', 'emergency'],
      ['khẩn cấp', 'emergency'],
      ['bác sĩ giỏi', 'quality_priority'],
      ['chuyên gia', 'specialist_priority'],
      ['giá rẻ', 'cost_priority'],
      ['phù hợp túi tiền', 'cost_priority']
    ]);
  }

  // Extract location từ user input
  extractLocation(userInput) {
    if (!userInput) return null;

    const normalizedInput = this.normalizeVietnamese(userInput.toLowerCase());
    
    // Check for explicit location mentions
    for (const [locationKey, locationData] of this.vietnameseLocations) {
      for (const keyword of locationData.keywords) {
        if (normalizedInput.includes(this.normalizeVietnamese(keyword))) {
          return {
            detected: locationKey,
            province: locationData.province,
            region: locationData.region,
            confidence: 0.9,
            matchedKeyword: keyword
          };
        }
      }
    }

    return null;
  }

  // Extract preferences từ user input
  extractPreferences(userInput) {
    if (!userInput) return [];

    const normalizedInput = this.normalizeVietnamese(userInput.toLowerCase());
    const preferences = [];

    for (const [keyword, preferenceType] of this.preferenceMap) {
      if (normalizedInput.includes(this.normalizeVietnamese(keyword))) {
        preferences.push({
          type: preferenceType,
          keyword: keyword,
          priority: this.getPreferencePriority(preferenceType)
        });
      }
    }

    return preferences;
  }

  // Get priority score cho preferences
  getPreferencePriority(preferenceType) {
    const priorityMap = {
      'emergency': 10,
      'urgent_care': 9,
      'location_priority': 8,
      'specialist_priority': 7,
      'quality_priority': 6,
      'telemedicine': 5,
      'cost_priority': 4
    };
    return priorityMap[preferenceType] || 1;
  }

  // Find hospitals dựa trên location và preferences
  async findLocationBasedHospitals(patientLocation, specialties, preferences = [], options = {}) {
    try {
      const searchOptions = {
        limit: options.limit || 10,
        location: patientLocation?.province,
        specialties: specialties
      };

      // NEW: GPS-based search if patientLocation is a string address OR an object with location fields
      if (typeof patientLocation === 'string' || (patientLocation && typeof patientLocation === 'object')) {
        const queryText = typeof patientLocation === 'string'
          ? patientLocation
          : (patientLocation.original || patientLocation.address || patientLocation.city || patientLocation.district || patientLocation.province || '');
        if (!queryText) {
          console.log('ℹ️ No geocodable text from patientLocation, falling back to text-based search.');
        }
        const logText = queryText || JSON.stringify(patientLocation);
        console.log(`🔍 Attempting GPS-based search for: ${logText}`);
        
        const userGeoLocation = queryText ? await geoLocationService.parseLocationInput(queryText) : null;
        
        if (userGeoLocation) {
          console.log(`📍 User coordinates: ${userGeoLocation.lat}, ${userGeoLocation.lng}`);

          const includeExternal = options && options.includeExternal === true;

          // If only hospitals in hệ thống are allowed, compute directly from DB for accuracy
          if (!includeExternal) {
            try {
              const dbItems = await hospitalDb.getAllHospitals();
              let hospitalList = (dbItems || []).map(h => ({
                id: h.h_id,
                name: h.h_name,
                hospitalAddress: h.h_address,
                specialty: h.h_description || 'Đa khoa',
                coordinates: (h.h_lat && h.h_lng) ? { lat: Number(h.h_lat), lng: Number(h.h_lng) } : h.coordinates
              }));

              // Compute distances within radius
              const nearbyHospitals = await geoLocationService.findHospitalsWithinRadius(
                userGeoLocation,
                hospitalList,
                options.radiusKm || 100
              );

              // Specialty filtering using name or description
              let filteredHospitals = specialties.length > 0
                ? nearbyHospitals.filter(hospital =>
                    specialties.some(specialty => {
                      const s = String(specialty || '').toLowerCase();
                      const name = String(hospital.name || '').toLowerCase();
                      const spec = String(hospital.specialty || '').toLowerCase();
                      // Treat 'đa khoa' as acceptable for most specialties
                      const isGeneral = spec.includes('đa khoa');
                      return (
                        name.includes(s) || spec.includes(s) || isGeneral
                      );
                    })
                  )
                : nearbyHospitals;

              // If specialty filter yields too few results, broaden to nearest hospitals
              const minResults = Math.min(searchOptions.limit, Number(process.env.LOCATION_MIN_RESULTS || 10));
              if (specialties.length > 0 && filteredHospitals.length < minResults) {
                const byId = new Set(filteredHospitals.map(h => h.id || h.name));
                for (const h of nearbyHospitals) {
                  const key = h.id || h.name;
                  if (!byId.has(key)) {
                    filteredHospitals.push(h);
                    byId.add(key);
                  }
                  if (filteredHospitals.length >= searchOptions.limit) break;
                }
              }

              // Build results (all are inDatabase true) with medical-first scoring
              const radiusKm = options.radiusKm || 100;
              const gpsResults = filteredHospitals.map(h => ({
                doc: h,
                score: this.compositeHospitalScore(h, specialties, radiusKm),
                distance: h.distance,
                distanceText: h.distanceText,
                locationMatch: (h.distance || 999) <= 10 ? 'same_city' : 'same_province',
                preferenceMatch: this.getPreferenceMatchLevel(h, preferences),
                inDatabase: true,
                dbId: h.id
              }))
              .sort((a, b) => b.score - a.score);

              // Dynamic expansion: if many strong specialty matches nearby, increase limit up to LOCATION_EXPAND_MAX
              const strongThreshold = Number(process.env.LOCATION_STRONG_THRESHOLD || 0.7);
              const strongCount = gpsResults.filter(x => (x.score || 0) >= strongThreshold).length;
              const expandMax = Number(process.env.LOCATION_EXPAND_MAX || 20);
              const effectiveLimit = strongCount > searchOptions.limit
                ? Math.min(strongCount, expandMax)
                : searchOptions.limit;

              return {
                hospitals: gpsResults.slice(0, effectiveLimit),
                location: { province: userGeoLocation.formatted_address, coordinates: userGeoLocation },
                preferences: preferences,
                totalFound: gpsResults.length,
                method: 'gps_db_only'
              };
            } catch (e) {
              console.warn('DB-based GPS search failed, falling back to knowledge base:', e && e.message || e);
            }
          }

          // Get hospitals from aiDoctorKnowledge with fallback 
          const allResults = await aiDoctorKnowledge.query('', { limit: 200 });
          
          // If no results from knowledge base, create fallback hospital data
          let hospitalList = allResults?.map(r => r.doc || r) || [];
          
          if (hospitalList.length === 0) {
            console.log('⚠️ No hospitals in knowledge base, using fallback data');
            hospitalList = this.getFallbackHospitalData?.() || []; console.warn('Using fallback hospital dataset');
          }

          // Build DB presence map (to flag which results exist in our DB)
          let dbPresence = new Map();
          try {
            const hospitalDb = require('./hospital.service');
            const dbItems = await hospitalDb.getAllHospitals();
            const normalize = (s) => (s || '').toString().trim().toLowerCase();

            // Map DB hospitals to unified schema and merge into candidate list
            const mappedDb = (dbItems || []).map(h => ({
              id: h.h_id,
              name: h.h_name,
              hospitalAddress: h.h_address,
              specialty: h.h_description || 'Đa khoa',
              _db: true
            }));
            const seen = new Set(hospitalList.map(h => normalize(h.name || h.h_name)));
            for (const item of mappedDb) {
              const key = normalize(item.name || item.h_name);
              if (key && !seen.has(key)) { hospitalList.push(item); seen.add(key); }
            }

            const nameToId = new Map();
            for (const h of dbItems || []) {
              nameToId.set(normalize(h.h_name), h.h_id);
            }
            for (const h of hospitalList) {
              const key = normalize(h.name || h.h_name);
              if (key && nameToId.has(key)) {
                dbPresence.set(key, { inDb: true, id: nameToId.get(key) });
              } else {
                dbPresence.set(key, { inDb: false, id: null });
              }
            }
          } catch (e) {
            console.warn('Could not build DB presence map:', e && e.message || e);
          }

          const nearbyHospitals = await geoLocationService.findHospitalsWithinRadius(
            userGeoLocation,
            hospitalList,
            options.radiusKm || 100
          );
          
          // Filter by specialties if provided
          let filteredHospitals = specialties.length > 0 
            ? nearbyHospitals.filter(hospital => 
                specialties.some(specialty => {
                  const s = String(specialty || '').toLowerCase();
                  return (
                    String(hospital.name || '').toLowerCase().includes(s) ||
                    String(hospital.specialty || '').toLowerCase().includes(s)
                  );
                })
              )
            : nearbyHospitals;

          // If specialty filter yields no results, fall back to distance-only results
          if (specialties.length > 0 && filteredHospitals.length === 0) {
            console.warn('No hospitals matched the requested specialties. Falling back to nearest hospitals.');
            filteredHospitals = nearbyHospitals;
          }

          // Enforce DB-only results unless explicitly allowed
          const normalizeKey = (s) => (s || '').toString().trim().toLowerCase();
          if (!includeExternal && dbPresence && dbPresence.size) {
            filteredHospitals = filteredHospitals.filter(h => {
              const key = normalizeKey(h.name || h.h_name);
              const p = dbPresence.get(key);
              return p && p.inDb === true;
            });
          }

          console.log(`🏥 Found ${filteredHospitals.length} GPS-based hospitals within ${options.radiusKm || 100}km`);
          
          const normalizeKey2 = (s) => (s || '').toString().trim().toLowerCase();
          const gpsResults = filteredHospitals.map(hospital => {
            const key = normalizeKey2(hospital.name || hospital.h_name);
            const presence = (typeof dbPresence !== 'undefined' && dbPresence.get(key)) || { inDb: false, id: null };
            return {
              doc: hospital,
              score: (100 - hospital.distance) / 100,
              distance: hospital.distance,
              distanceText: hospital.distanceText,
              locationMatch: hospital.distance <= 10 ? 'same_city' : 'same_province',
              preferenceMatch: this.getPreferenceMatchLevel(hospital, preferences),
              inDatabase: presence.inDb,
              dbId: presence.id
            };
          });

          return {
            hospitals: gpsResults.slice(0, searchOptions.limit),
            location: { province: userGeoLocation.formatted_address, coordinates: userGeoLocation },
            preferences: preferences,
            totalFound: gpsResults.length,
            method: 'gps'
          };
        }
      }

      // Fallback to text-based search
      console.log('📝 Using text-based location search');
      const results = await aiDoctorKnowledge.query(
        specialties.join(' '), 
        searchOptions
      );

      if (!results || results.length === 0) {
        return this.createFallbackRecommendations(patientLocation, specialties);
      }

      // Filter và rank dựa trên location và preferences
      const rankedResults = this.rankHospitalsByLocationAndPreferences(
        results, 
        patientLocation, 
        preferences
      );

      return {
        hospitals: rankedResults.slice(0, searchOptions.limit),
        location: patientLocation,
        preferences: preferences,
        totalFound: rankedResults.length
      };

    } catch (error) {
      console.error('❌ Location-based hospital search failed:', error.message);
      return this.createFallbackRecommendations(patientLocation, specialties);
    }
  }

  // Rank hospitals dựa trên location proximity và preferences
  rankHospitalsByLocationAndPreferences(hospitals, patientLocation, preferences) {
    return hospitals.map(result => {
      let score = result.score || 0;
      const hospital = result.doc;

      // Location proximity boost
      if (patientLocation && hospital.hospitalAddress) {
        const locationBoost = this.calculateLocationScore(
          patientLocation, 
          hospital.hospitalAddress
        );
        score += locationBoost;
      }

      // Preference-based scoring
      for (const preference of preferences) {
        const preferenceBoost = this.calculatePreferenceScore(
          hospital, 
          preference
        );
        score += preferenceBoost;
      }

      return {
        ...result,
        score: score,
        locationMatch: this.getLocationMatchLevel(patientLocation, hospital.hospitalAddress),
        preferenceMatch: this.getPreferenceMatchLevel(hospital, preferences)
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Extract province from free-text using known Vietnamese locations map
  extractProvinceFromText(text) {
    if (!text) return null;
    const normalized = this.normalizeVietnamese(String(text).toLowerCase());
    // Try exact province names first
    for (const [, loc] of this.vietnameseLocations) {
      const provinceNorm = this.normalizeVietnamese(loc.province.toLowerCase());
      if (normalized.includes(provinceNorm)) return loc.province;
    }
    // Try keywords as fallback (districts/cities within province)
    for (const [, loc] of this.vietnameseLocations) {
      for (const kw of loc.keywords) {
        if (normalized.includes(this.normalizeVietnamese(kw))) {
          return loc.province;
        }
      }
    }
    return null;
  }

  // Quick compare user input with a hospital address at province/city granularity
  compareUserInputWithHospitalAddress(userInput, hospitalAddress) {
    if (!userInput || !hospitalAddress) return { level: 'unknown' };

    // Use existing extraction for user input
    const userLoc = this.extractLocation(userInput);
    const userProvince = userLoc?.province || this.extractProvinceFromText(userInput);

    const hospitalProvince = this.extractProvinceFromText(hospitalAddress);

    if (userProvince && hospitalProvince) {
      const up = this.normalizeVietnamese(userProvince.toLowerCase());
      const hp = this.normalizeVietnamese(hospitalProvince.toLowerCase());
      if (up === hp) return { level: 'same_province', userProvince, hospitalProvince };
      // Same region check
      const userRegion = [...this.vietnameseLocations.values()].find(v => v.province === userProvince)?.region;
      const hospRegion = [...this.vietnameseLocations.values()].find(v => v.province === hospitalProvince)?.region;
      if (userRegion && hospRegion && userRegion === hospRegion) {
        return { level: 'same_region', userProvince, hospitalProvince };
      }
      return { level: 'different_region', userProvince, hospitalProvince };
    }

    return { level: 'unknown' };
  }

  // Quick compare with doctor's hospital address/name
  compareUserInputWithDoctorHospital(userInput, doctor) {
    const hospAddress = doctor?.hospitalAddress || doctor?.dr_h_name || doctor?.hospitalName || '';
    return this.compareUserInputWithHospitalAddress(userInput, hospAddress);
  }

  // Calculate location proximity score
  calculateLocationScore(patientLocation, hospitalAddress) {
    if (!patientLocation || !hospitalAddress) return 0;

    const normalizedAddress = this.normalizeVietnamese(String(hospitalAddress || '').toLowerCase());

    // Support both string and object for patientLocation
    let provinceText = '';
    let region = null;
    if (typeof patientLocation === 'string') {
      provinceText = this.extractProvinceFromText(patientLocation) || patientLocation;
    } else if (patientLocation && typeof patientLocation === 'object') {
      provinceText = patientLocation.province || patientLocation.city || '';
      region = patientLocation.region || null;
    }
    const patientProvince = this.normalizeVietnamese(String(provinceText || '').toLowerCase());

    // Exact province match
    if (normalizedAddress.includes(patientProvince)) {
      return 2.0; // High boost for same province
    }

    // Same region match
    if (patientLocation.region) {
      const sameRegionProvinces = Array.from(this.vietnameseLocations.values())
        .filter(loc => loc.region === patientLocation.region)
        .map(loc => this.normalizeVietnamese(loc.province.toLowerCase()));

      for (const province of sameRegionProvinces) {
        if (normalizedAddress.includes(province)) {
          return 1.0; // Medium boost for same region
        }
      }
    }

    return 0; // No location boost
  }

  // Calculate preference-based score
  calculatePreferenceScore(hospital, preference) {
    const baseScore = preference.priority * 0.1;

    switch (preference.type) {
      case 'emergency':
        // Prefer hospitals với emergency services
        if (hospital.specialty && hospital.specialty.toLowerCase().includes('cấp cứu')) {
          return baseScore * 2;
        }
        return baseScore;

      case 'urgent_care':
        return baseScore;

      case 'location_priority':
        return baseScore; // Already handled in location scoring

      case 'specialist_priority':
        // Prefer specialized hospitals
        if (hospital.specialty && !hospital.specialty.toLowerCase().includes('đa khoa')) {
          return baseScore * 1.5;
        }
        return baseScore;

      case 'quality_priority':
        // Prefer higher-rated hospitals (if rating available)
        return baseScore;

      case 'telemedicine':
        // Prefer hospitals với telemedicine services
        return baseScore;

      case 'cost_priority':
        // Prefer lower-cost options
        if (hospital.price && hospital.price < 200000) {
          return baseScore * 1.5;
        }
        return baseScore;

      default:
        return baseScore;
    }
  }

  // Get location match level
  getLocationMatchLevel(patientLocation, hospitalAddress) {
    if (!patientLocation || !hospitalAddress) return 'unknown';

    const locationScore = this.calculateLocationScore(patientLocation, hospitalAddress);
    
    if (locationScore >= 2.0) return 'same_province';
    if (locationScore >= 1.0) return 'same_region';
    return 'different_region';
  }

  // Get preference match level  
  getPreferenceMatchLevel(hospital, preferences) {
    if (!preferences.length) return 'no_preferences';

    const totalScore = preferences.reduce((sum, pref) => 
      sum + this.calculatePreferenceScore(hospital, pref), 0
    );

    if (totalScore >= 2.0) return 'high_match';
    if (totalScore >= 1.0) return 'medium_match';
    return 'low_match';
  }

  getFallbackHospitalData() {
    // Minimal curated fallback hospitals with coordinates for GPS distance
    return [
      { id: 'vl_01', name: 'Bệnh viện Đa khoa Vĩnh Long', hospitalAddress: '207 Phạm Hùng, Phường 9, Vĩnh Long', specialty: 'Đa khoa', coordinates: { lat: 10.2438, lng: 105.9719 } },
      { id: 'vl_02', name: 'Bệnh viện Xuyên Á Vĩnh Long', hospitalAddress: 'QL1A, Tân Ngãi, TP. Vĩnh Long', specialty: 'Đa khoa', coordinates: { lat: 10.2749, lng: 105.9783 } },
      { id: 'ct_01', name: 'Bệnh viện Quân Y Cần Thơ', hospitalAddress: 'Số 01, Đường 30/4, Phường Ninh Kiều, Thành phố Cần Thơ', specialty: 'Đa khoa', coordinates: { lat: 10.0336, lng: 105.7805 } },
      { id: 'ct_02', name: 'Bệnh viện Đa khoa Trung ương Cần Thơ', hospitalAddress: '315 Nguyễn Văn Linh, Ninh Kiều, Cần Thơ', specialty: 'Đa khoa', coordinates: { lat: 10.0384, lng: 105.7702 } },
      { id: 'hcm_01', name: 'Bệnh viện Chợ Rẫy', hospitalAddress: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM', specialty: 'Đa khoa', coordinates: { lat: 10.7546, lng: 106.6594 } },
      { id: 'hn_01', name: 'Bệnh viện Bạch Mai', hospitalAddress: '78 Giải Phóng, Đống Đa, Hà Nội', specialty: 'Đa khoa', coordinates: { lat: 21.0001, lng: 105.8406 } }
    ];
  }

  // Create fallback recommendations khi không tìm thấy
  createFallbackRecommendations(patientLocation, specialties) {
    const fallbackHospitals = [
      {
        name: 'Bệnh viện Đa khoa tỉnh',
        specialty: 'Đa khoa',
        address: `${patientLocation?.province || 'Khu vực của bạn'}`,
        type: 'public',
        recommendation: 'Bệnh viện công lập tại tỉnh'
      },
      {
        name: 'Phòng khám Đa khoa tư nhân',
        specialty: specialties[0] || 'Đa khoa',
        address: `${patientLocation?.province || 'Khu vực của bạn'}`,
        type: 'private',
        recommendation: 'Phòng khám tư nhân gần nhà'
      }
    ];

    return {
      hospitals: fallbackHospitals,
      location: patientLocation,
      preferences: [],
      totalFound: fallbackHospitals.length,
      isFallback: true,
      message: 'Không tìm thấy bệnh viện cụ thể. Đây là gợi ý chung.'
    };
  }

  // Main function để process user request
  async processLocationBasedRequest(userInput, recommendedSpecialties, patientData = {}) {
    // Extract location và preferences từ user input
    const extractedLocation = this.extractLocation(userInput) || 
                            this.extractLocation(patientData.location) ||
                            this.extractLocation(patientData.address);
    
    const preferences = this.extractPreferences(userInput);

    // Find hospitals based on location và preferences
    const hospitalRecommendations = await this.findLocationBasedHospitals(
      extractedLocation,
      recommendedSpecialties,
      preferences,
      { limit: Number(process.env.LOCATION_DEFAULT_LIMIT || 10) }
    );

    // Generate user-friendly response
    return this.generateLocationBasedResponse(
      hospitalRecommendations,
      extractedLocation,
      preferences,
      userInput
    );
  }

  // Generate user-friendly response
  generateLocationBasedResponse(hospitalRecommendations, location, preferences, originalInput) {
    const response = {
      locationDetected: location,
      preferencesDetected: preferences,
      hospitals: hospitalRecommendations.hospitals,
      summary: this.createLocationSummary(location, preferences),
      recommendations: this.createLocationRecommendations(hospitalRecommendations),
      originalRequest: originalInput
    };

    return response;
  }

  // Create location summary
  createLocationSummary(location, preferences) {
    let summary = '';

    if (location) {
      summary += `📍 Vị trí: ${location.province} (${location.region})`;
    }

    if (preferences.length) {
      const prefText = preferences.map(p => p.keyword).join(', ');
      summary += `\n🎯 Ưu tiên: ${prefText}`;
    }

    return summary || '🔍 Tìm kiếm bệnh viện phù hợp cho bạn';
  }

  // Create location-based recommendations
  createLocationRecommendations(hospitalRecommendations) {
    const recommendations = [];

    for (const hospital of hospitalRecommendations.hospitals.slice(0, 3)) {
      const rec = {
        name: hospital.doc?.name || hospital.name,
        specialty: hospital.doc?.specialty || hospital.specialty,
        address: hospital.doc?.hospitalAddress || hospital.address,
        distance: this.getDistanceDescription(hospital.locationMatch),
        match: this.getMatchDescription(hospital.preferenceMatch),
        score: hospital.score?.toFixed(1) || 'N/A'
      };

      recommendations.push(rec);
    }

    return recommendations;
  }

  // Get distance description
  getDistanceDescription(locationMatch) {
    switch (locationMatch) {
      case 'same_province': return '🏠 Cùng tỉnh/thành phố';
      case 'same_region': return '🌏 Cùng miền';
      case 'different_region': return '✈️ Miền khác';
      default: return '📍 Vị trí chưa xác định';
    }
  }

  // Get match description
  getMatchDescription(preferenceMatch) {
    switch (preferenceMatch) {
      case 'high_match': return '⭐⭐⭐ Rất phù hợp';
      case 'medium_match': return '⭐⭐ Phù hợp';
      case 'low_match': return '⭐ Ít phù hợp';
      default: return '➖ Chưa đánh giá';
    }
  }

  // Normalize Vietnamese text
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
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new LocationBasedRecommendationService();