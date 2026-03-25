// GPS-based Hospital Distance Service
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GeoLocationService {
  constructor() {
    // Các API key có thể được config trong .env
    this.geocodingAPIs = {
      // OpenStreetMap Nominatim (free)
      nominatim: 'https://nominatim.openstreetmap.org',
      // Google Maps API (cần API key)
      // google: 'https://maps.googleapis.com/maps/api/geocode/json'
    };
    // Cache dữ liệu fallback tỉnh/thành (lazy-load)
    this._vnAdminCache = null;

    // Simple geocoding cache (address -> {lat,lng,...}) persisted to file
    this._geoCache = null;
    this._geoCachePath = path.join(__dirname, '..', 'data', 'geocode_cache.json');
  }

  /**
   * Chuyển đổi địa chỉ thành tọa độ GPS
   * @param {string} address - Địa chỉ cần geocoding
   * @returns {Object|null} {lat, lng, formatted_address, admin, level}
   */
  async geocodeAddress(address) {
    // Circuit breaker: if GEO_DISABLE_REMOTE is true, skip remote geocoding entirely
    if (String(process.env.GEO_DISABLE_REMOTE || '').toLowerCase() === 'true') {
      return null;
    }
    try {
      if (!address) return null;

      // lazy-load cache
      if (!this._geoCache) {
        try {
          const raw = fs.readFileSync(this._geoCachePath, 'utf-8');
          this._geoCache = JSON.parse(raw);
        } catch (_) {
          this._geoCache = {};
        }
      }

      // Normalize Vietnamese address
      const normalizedAddress = this.normalizeVietnameseAddress(address);
      const cacheKey = normalizedAddress.toLowerCase();

      // Return from cache if exists
      if (this._geoCache[cacheKey]) {
        return { ...this._geoCache[cacheKey], cached: true };
      }

      // Try OpenStreetMap Nominatim first (free)
      const doRequest = async (timeoutMs) => axios.get(`${this.geocodingAPIs.nominatim}/search`, {
        params: {
          q: normalizedAddress + ', Vietnam',
          format: 'json',
          limit: 5,
          addressdetails: 1,
          countrycodes: 'vn',
          'accept-language': 'vi',
          ...(process.env.GEO_CONTACT_EMAIL ? { email: process.env.GEO_CONTACT_EMAIL } : {})
        },
        timeout: timeoutMs,
        headers: {
          'User-Agent': process.env.GEO_USER_AGENT || 'bookingmedical/1.0 (contact: support@example.com)',
          'Accept-Language': 'vi',
          'Referer': process.env.APP_BASE_URL || 'http://localhost'
        }
      });

      let response;
      const maxRetries = Number(process.env.GEO_RETRIES || 2);
      const baseTimeout = Number(process.env.GEO_PRIMARY_TIMEOUT_MS || 6000);
      const retryTimeout = Number(process.env.GEO_RETRY_TIMEOUT_MS || 10000);
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const timeoutMs = attempt === 0 ? baseTimeout : retryTimeout + attempt * 2000;
          response = await doRequest(timeoutMs);
          break;
        } catch (e) {
          attempt++;
          const status = e && e.response && e.response.status;
          if (status === 403 || status === 429) {
            console.warn(`⚠️ Geocoding rejected by Nominatim (status ${status}). Falling back to local coordinates.`);
            return null;
          }
          if (attempt > maxRetries) {
            console.warn('Geocoding failed after retries:', e && (e.message || status));
            throw e;
          }
          // Backoff before next retry
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }

      if (response && response.data && response.data.length > 0) {
        // Ưu tiên kết quả cấp tỉnh/thành phố nếu input là tên tỉnh/thành phố
        const provinceLevel = response.data.find(item => {
          const className = item.class || item.type;
          const typeName = item.type;
          return (
            className === 'boundary' && (typeName === 'administrative' || typeName === 'province' || typeName === 'state')
          ) || typeName === 'province' || typeName === 'state' || typeName === 'city' || typeName === 'county';
        });
        const result = provinceLevel || response.data[0];
        const addr = result.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.hamlet || addr.county || null;
        const province = addr.province || addr.state || addr.region || null;
        const out = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          formatted_address: result.display_name,
          confidence: result.importance || 0.5,
          level: result.type,
          admin: {
            city,
            province,
            state: addr.state || null,
            county: addr.county || null,
          },
          raw_address: addr
        };
        // persist to cache
        try {
          this._geoCache[cacheKey] = out;
          fs.writeFileSync(this._geoCachePath, JSON.stringify(this._geoCache, null, 2), 'utf-8');
        } catch (e) {
          console.warn('Could not persist geocode cache:', e && e.message || e);
        }
        return out;
      }

      return null;
    } catch (error) {
      console.error('❌ Geocoding failed:', error.message);
      return null;
    }
  }

  /**
   * Tính khoảng cách giữa 2 điểm GPS (Haversine formula)
   * @returns {number|null} Khoảng cách tính bằng km
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;

    const R = 6371; // Bán kính trái đất (km)
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  degToRad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Tìm bệnh viện trong bán kính
   * @param {Object} userLocation - {lat, lng}
   * @param {Array} hospitals - Danh sách bệnh viện
   * @param {number} radiusKm - Bán kính tìm kiếm (default: 100km)
   * @returns {Array} Hospitals within radius, sorted by distance
   */
  async findHospitalsWithinRadius(userLocation, hospitals, radiusKm = 100) {
    const hospitalWithDistance = [];

    for (const hospital of hospitals) {
      try {
        // Get hospital coordinates
        let hospitalLocation = hospital.coordinates;

        // If no coordinates, try to geocode address (unless circuit breaker is enabled)
        if (!hospitalLocation && hospital.hospitalAddress) {
          if (String(process.env.GEO_DISABLE_REMOTE || '').toLowerCase() !== 'true') {
            hospitalLocation = await this.geocodeAddress(hospital.hospitalAddress);
            // Cache coordinates for future use
            hospital.coordinates = hospitalLocation;
          } else {
            // Skip geocoding in runtime to avoid remote calls
            hospitalLocation = null;
          }
        }

        if (hospitalLocation) {
          const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            hospitalLocation.lat, hospitalLocation.lng
          );

          if (distance <= radiusKm) {
            hospitalWithDistance.push({
              ...hospital,
              distance: distance,
              distanceText: `${distance}km`,
              coordinates: hospitalLocation
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not process hospital: ${hospital.name}`, error.message);
      }
    }

    // Sort by distance (gần nhất trước)
    return hospitalWithDistance.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Normalize Vietnamese address để geocoding tốt hơn
   */
  normalizeVietnameseAddress(address) {
    if (!address) return '';

    return address
      // Normalize leading house numbers (e.g., 12/3 Dinh Tien Hoang)
      .replace(/^(\d+\/?\d*)\s+/, '$1 ')
      // Expand city/district/ward abbreviations
      .replace(/\bTP\.?\s*/gi, 'Thành phố ')
      .replace(/\bTp\.?\s*/gi, 'Thành phố ')
      .replace(/\bQ\.?\s*/gi, 'Quận ')
      .replace(/\bP\.?\s*/gi, 'Phường ')
      // Expand compact forms like Q1, P10
      .replace(/\bQ(\d{1,2})\b/gi, 'Quận $1')
      .replace(/\bP(\d{1,2})\b/gi, 'Phường $1')
      // Normalize major city aliases
      .replace(/\bHCM\b/gi, 'Hồ Chí Minh')
      .replace(/\bTP HCM\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bTP\. HCM\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bTP\.HCM\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bSài Gòn\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bSai Gon\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bĐN\b/gi, 'Đà Nẵng')
      .replace(/\bHN\b/gi, 'Hà Nội')
      // Remove parenthetical notes like (Địa chỉ cũ: ...)
      .replace(/\([^\)]*\)/g, ' ')
      // Collapse multiple spaces and trim
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse user location input
   * @param {string} locationInput - User input về location
   * @returns {Object|null} Parsed location info
   */
  async parseLocationInput(locationInput) {
    if (!locationInput) return null;

    // Check if input looks like coordinates
    const coordMatch = String(locationInput).match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        type: 'coordinates',
        original: locationInput
      };
    }

    // Otherwise, treat as address and geocode
    const geocoded = await this.geocodeAddress(locationInput);
    if (geocoded) {
      return {
        ...geocoded,
        type: 'address',
        original: locationInput
      };
    }

    // Fallback: try local province/city coordinates
    const fallback = this.getLocalCityCoordinates(locationInput);
    if (fallback) {
      return {
        lat: fallback.lat,
        lng: fallback.lng,
        formatted_address: fallback.name,
        type: 'local_fallback',
        original: locationInput
      };
    }

    return null;
  }

  // Normalize Vietnamese (remove diacritics, punctuation)
  normalizeVietnamese(text) {
    if (!text) return '';
    return String(text).toLowerCase()
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

  // Local fallback for province/city coordinates (63 provinces)
  getLocalCityCoordinates(input) {
    if (!input) return null;
    try {
      if (!this._vnAdminCache) {
        const p = path.join(__dirname, '..', 'data', 'vietnam_admin_coords.json');
        const raw = fs.readFileSync(p, 'utf-8');
        const arr = JSON.parse(raw);
        this._vnAdminCache = arr.map(item => ({
          ...item,
          _nameNorm: this.normalizeVietnamese(item.name),
          _aliasNorm: (item.aliases || []).map(a => this.normalizeVietnamese(a))
        }));
      }
      const key = this.normalizeVietnamese(input);
      // exact match on name or alias
      let found = this._vnAdminCache.find(i => i._nameNorm === key || i._aliasNorm.includes(key));
      if (found) return { name: found.name, lat: found.lat, lng: found.lng };
      // contains match
      found = this._vnAdminCache.find(i => i._nameNorm.includes(key) || i._aliasNorm.some(a => a.includes(key) || key.includes(a)));
      if (found) return { name: found.name, lat: found.lat, lng: found.lng };
      return null;
    } catch (e) {
      return null;
    }
  }
}

module.exports = new GeoLocationService();
