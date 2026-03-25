const doctorService = require("../services/doctor.service");
const hospitalService = require("../services/hospital.service");

/**
 * Tìm kiếm cả bác sĩ và bệnh viện theo từ khóa gần đúng
 * GET /api/all/:keyword
 */
exports.searchAllDoctorsAndHospitals = async (req, res) => {
  try {
    const keyword = req.params.keyword || "";
    const baseURL = `${req.protocol}://${req.get("host")}`;

    // Gọi song song cả hai dịch vụ
    const [doctors, hospitals] = await Promise.all([
      doctorService.searchDoctorsByName(keyword),
      hospitalService.searchHospitalsByName(keyword),
    ]);

    const mappedDoctors = doctors.map((d) => ({
      id: d.dr_id,
      type: "doctor",
      name: d.dr_name,
      specialty: d.specialty,
      image: d.image ? `${baseURL}${d.image}` : "",
    }));

    const mappedHospitals = hospitals.map((h) => ({
      id: h.h_id,
      type: "hospital",
      ten_bv: h.h_name,
      address: h.h_address,
      logo: h.logo ? `${baseURL}${h.logo}` : "",
    }));

    res.json({
      doctors: mappedDoctors,
      hospitals: mappedHospitals,
    });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
