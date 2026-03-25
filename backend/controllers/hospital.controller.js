const hospitalService = require("../services/hospital.service");

exports.getAll = async (req, res) => {
  try {
    const baseURL = `${req.protocol}://${req.get("host")}`;
    const hospitals = await hospitalService.getAllHospitals();

    const mapped = hospitals.map((h) => ({
      ...h,
      logo: h.logo ? `${baseURL}${h.logo}` : "",
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const baseURL = `${req.protocol}://${req.get("host")}`;
    const hospital = await hospitalService.getHospitalById(req.params.id);
    if (!hospital) return res.status(404).json({ error: "Not found" });

    hospital.logo = hospital.logo ? `${baseURL}${hospital.logo}` : "";

    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      logo: req.file ? "/uploads/" + req.file.filename : "",
    };

    // Basic validation
    const name = (data.h_name || data.name || '').toString().trim();
    const address = (data.h_address || data.address || '').toString().trim();
    if (!name) {
      return res.status(400).json({ error: "Hospital name is required" });
    }
    if (!address) {
      return res.status(400).json({ error: "Hospital address is required" });
    }

    const hospital = await hospitalService.createHospital({
      ...data,
      h_name: name,
      h_address: address,
    });
    res.status(201).json(hospital);
  } catch (err) {
    console.error('Hospital create error:', err && err.message || err);
    res.status(500).json({ error: "Insert failed" });
  }
};

exports.update = async (req, res) => {
  try {
    const data = {
      ...req.body,
      logo: req.file ? "/uploads/" + req.file.filename : req.body.logo, // ✅ Giữ ảnh cũ nếu không upload
    };

    const hospital = await hospitalService.updateHospital(req.params.id, data);
    res.json(hospital);
  } catch (err) {
    console.error('Hospital update error:', err && err.message || err);
    res.status(500).json({ error: "Update failed" });
  }
};

exports.remove = async (req, res) => {
  try {
    await hospitalService.deleteHospital(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

exports.getSpecialties = async (req, res) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    
    const specialties = await hospitalService.getHospitalSpecialties(hospital.h_name);
    res.json(specialties);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// GET /hospitals/:id/nearby?radiusKm=100
exports.getNearby = async (req, res) => {
  try {
    const radiusKm = Number(req.query.radiusKm || 100);
    const includeExternal = String(req.query.includeExternal || 'false').toLowerCase() === 'true';
    const baseHospital = await hospitalService.getHospitalById(req.params.id);
    if (!baseHospital) return res.status(404).json({ error: 'Hospital not found' });
    if (!baseHospital.h_address) return res.status(400).json({ error: 'Hospital has no address' });

    // Resolve origin coordinates from the hospital's address
    const geoLocationService = require('../services/geoLocationService.service');
    const aiDoctorKnowledge = require('../services/aiDoctorKnowledge.service');

    const origin = await geoLocationService.parseLocationInput(baseHospital.h_address);
    if (!origin) {
      return res.status(502).json({ error: 'Could not resolve hospital address to coordinates' });
    }

    // Build candidate hospital list (knowledge base + DB + curated fallback)
    let allCandidates = [];
    try {
      const kb = await aiDoctorKnowledge.query('', { limit: 300 });
      allCandidates = kb?.map(r => r.doc || r) || [];
    } catch (e) {
      // ignore
    }

    // Merge DB hospitals
    const dbHospitals = await hospitalService.getAllHospitals();
    const mappedDb = (dbHospitals || []).map(h => ({
      id: h.h_id,
      name: h.h_name,
      hospitalAddress: h.h_address,
      specialty: h.h_description || 'Đa khoa',
      // coordinates: optional; will be geocoded lazily
      _db: true,
    }));

    // De-duplicate by normalized name
    const normalize = s => (s || '').toString().trim().toLowerCase();
    const seen = new Set();
    const merged = [];
    for (const item of [...allCandidates, ...mappedDb]) {
      const key = normalize(item.name || item.h_name);
      if (key && !seen.has(key)) { seen.add(key); merged.push(item); }
    }

    // Fallback if still empty
    if (merged.length === 0) {
      const lbr = require('../services/locationBasedRecommendation.service');
      const fall = lbr.getFallbackHospitalData?.() || [];
      merged.push(...fall);
    }

    // Find hospitals within radius from the origin
    const nearby = await geoLocationService.findHospitalsWithinRadius(origin, merged, radiusKm);

    // Build DB presence map
    const nameToId = new Map((dbHospitals || []).map(h => [normalize(h.h_name), h.h_id]));

    // Exclude the base hospital itself
    const baseKey = normalize(baseHospital.h_name);
    let results = nearby
      .filter(h => normalize(h.name || h.h_name) !== baseKey)
      .map(h => ({
        doc: h,
        distance: h.distance,
        distanceText: h.distanceText,
        inDatabase: nameToId.has(normalize(h.name || h.h_name)),
        dbId: nameToId.get(normalize(h.name || h.h_name)) || null,
      }));

    if (!includeExternal) {
      results = results.filter(r => r.inDatabase);
    }

    res.json({
      origin: { id: baseHospital.h_id, name: baseHospital.h_name, address: baseHospital.h_address, coordinates: { lat: origin.lat, lng: origin.lng } },
      radiusKm,
      totalFound: results.length,
      hospitals: results,
      includeExternal,
    });
  } catch (err) {
    console.error('getNearby error:', err && err.message || err);
    res.status(500).json({ error: 'Nearby search failed' });
  }
};
