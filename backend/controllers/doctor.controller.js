const doctorService = require("../services/doctor.service");
const scheduleService = require("../services/schedule.service");
const hospitalService = require("../services/hospital.service");
function formatPrice(rawPrice) {
  const num = parseInt(rawPrice, 10);
  if (isNaN(num)) return "0";
  return num.toLocaleString("vi-VN");
}

exports.getAllDoctors = async (req, res) => {
  try {
    const baseURL = `${req.protocol}://${req.get("host")}`;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const specialty = req.query.specialty; // Query parameter cho specialty
    const hospital = req.query.hospital; // Query parameter cho hospital name
    const search = req.query.search; // Query parameter cho search keyword

    let doctors;
    let total = 0;

    if (page && limit) {
      // Trường hợp phân trang
      const offset = (page - 1) * limit;

      const [doctorsData, totalCount] = await Promise.all([
        doctorService.getDoctorsWithPagination(limit, offset, specialty, search, hospital), // Thêm hospital
        doctorService.countDoctors(specialty, search, hospital), // Thêm hospital
      ]);

      doctors = doctorsData;
      total = totalCount;
    } else {
      // Trường hợp trả toàn bộ (cho admin)
      doctors = await doctorService.getAllDoctors(specialty, search, hospital); // Thêm hospital
      total = doctors.length;
    }

    const mapped = doctors.map((d) => ({
      ...d,
      image: d.image ? `${baseURL}${d.image}` : "",
      price: formatPrice(d.dr_price),
    }));

    if (page && limit) {
      return res.json({
        data: mapped,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      });
    } else {
      return res.json(mapped);
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.getDoctorByUserId = async (req, res) => {
  try {
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const doctor = await doctorService.getDoctorByUserId(req.params.id_u);
    if (!doctor) return res.status(404).json({ error: 'Not found' });
    doctor.image = doctor.image ? `${baseURL}${doctor.image}` : '';
    doctor.price = formatPrice(doctor.dr_price);
    return res.json(doctor);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const baseURL = `${req.protocol}://${req.get("host")}`;
    const doctor = await doctorService.getDoctorById(req.params.dr_id);
    if (!doctor) return res.status(404).json({ error: "Not found" });

    const schedules = await scheduleService.getSchedulesByDoctorId(
      req.params.dr_id
    ); //lấy lịch khám
    
    // Determine if schedules are per-day (new format) or generic for all days (old format)
    // Old format rows have day_of_week = NULL. New format has day_of_week in [1..7].
    const hasPerDay = schedules.some((s) => {
      const d = Number(s.day_of_week);
      return Number.isInteger(d) && d >= 1 && d <= 7;
    });

    if (hasPerDay) {
      // Build schedulesByDay only with valid day keys 1..7
      const schedulesByDay = {};
      schedules.forEach((s) => {
        const d = Number(s.day_of_week);
        if (Number.isInteger(d) && d >= 1 && d <= 7) {
          if (!schedulesByDay[d]) schedulesByDay[d] = [];
          schedulesByDay[d].push(s.time_slot);
        }
      });

      // New format: return full schedule objects for frontend to process
      doctor.schedules = schedules;
      doctor.schedulesByDay = schedulesByDay;
    } else {
      // Old format: return just time slots (apply to all days in UI)
      doctor.schedules = schedules.map((s) => s.time_slot);
    }

    // Enrich with hospital address/name if possible
    try {
      if (doctor.h_id) {
        const hospital = await hospitalService.getHospitalById(doctor.h_id);
        if (hospital) {
          doctor.h_address = hospital.h_address || doctor.h_address;
          doctor.dr_h_name = doctor.dr_h_name || hospital.h_name;
        }
      } else if (!doctor.h_address && doctor.dr_h_name) {
        // Try resolve by hospital name when id is missing
        const hospitalByName = await hospitalService.getHospitalByNameInsensitive(doctor.dr_h_name);
        if (hospitalByName) {
          doctor.h_address = hospitalByName.h_address;
          // do not overwrite dr_h_name
        }
      }
    } catch (e) {
      // ignore enrichment errors
    }

    doctor.image = doctor.image ? `${baseURL}${doctor.image}` : "";
    doctor.dr_price = formatPrice(doctor.dr_price);

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    // Parse both schedule formats (old and new)
    const schedulesRaw = req.body.schedules || "[]";
    const schedulesParsed = Array.isArray(schedulesRaw)
      ? schedulesRaw
      : JSON.parse(schedulesRaw);

    let schedulesWithDays = {};
    try {
      const raw = req.body.schedulesWithDays || "{}";
      schedulesWithDays = typeof raw === 'object' ? raw : JSON.parse(raw);
    } catch (e) {
      schedulesWithDays = {};
    }

    const specialty_id = req.body.specialty_id
      ? Number(req.body.specialty_id)
      : null;

    const data = {
      ...req.body,
      image: req.file ? "/uploads/" + req.file.filename : "",
      h_id: req.body.h_id || null, // ✅ Xử lý h_id
      specialty_id,
    };

    console.log("📝 Creating doctor with h_id:", data.h_id);

    const doctor = await doctorService.createDoctor(data);

    // Normalize schedules (old format)
    const schedules = Array.isArray(schedulesParsed)
      ? schedulesParsed
          .map((s) => (typeof s === "string" ? s : s?.time_slot))
          .filter(Boolean)
      : [];

    // Insert schedules depending on mode
    if (schedulesWithDays && Object.keys(schedulesWithDays).length > 0) {
      await scheduleService.addSchedulesForDays(doctor.dr_id, schedulesWithDays);
    } else if (schedules.length) {
      await scheduleService.addSchedules(doctor.dr_id, schedules);
    }

    res.status(201).json({ ...doctor, schedules, schedulesWithDays });
  } catch (err) {
    console.error("❌ Create doctor error:", err);
    res.status(500).json({ error: "Insert failed", detail: err.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const schedules = JSON.parse(req.body.schedules || "[]");
    const schedulesWithDays = JSON.parse(req.body.schedulesWithDays || "{}");
    console.log("👉 Parsed schedules:", schedules);
    console.log("👉 Parsed schedulesWithDays:", schedulesWithDays);

    const specialty_id = req.body.specialty_id
      ? Number(req.body.specialty_id)
      : null;

    const data = {
      ...req.body,
      image: req.file ? "/uploads/" + req.file.filename : req.body.image,
      h_id: req.body.h_id || null, // ✅ Xử lý h_id
      specialty_id,
    };

    console.log("📝 Updating doctor with h_id:", data.h_id); // Debug log

    const doctor = await doctorService.updateDoctor(req.params.dr_id, data);

    await scheduleService.deleteSchedulesByDoctorId(req.params.dr_id);
    
    // Handle both old format (schedules) and new format (schedulesWithDays)
    if (Object.keys(schedulesWithDays).length > 0) {
      // New format: schedules by day of week
      await scheduleService.addSchedulesForDays(req.params.dr_id, schedulesWithDays);
    } else if (schedules.length) {
      // Old format: schedules for all days
      await scheduleService.addSchedules(req.params.dr_id, schedules);
    }

    res.json(doctor);
  } catch (err) {
    console.error("❌ Update doctor error:", err);
    res.status(500).json({ error: "Update failed", detail: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    await scheduleService.deleteSchedulesByDoctorId(req.params.dr_id); // ✅ xóa lịch trước
    await doctorService.deleteDoctor(req.params.dr_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// Lấy danh sách bác sĩ theo bệnh viện và chuyên khoa
exports.getDoctorsByHospitalAndSpecialty = async (req, res) => {
  try {
    const { hospitalName, specialtyId } = req.params;
    const baseURL = `${req.protocol}://${req.get("host")}`;
    
    const doctors = await doctorService.getDoctorsByHospitalAndSpecialty(hospitalName, specialtyId);
    
    const mappedDoctors = doctors.map(doctor => ({
      ...doctor,
      image: doctor.image ? `${baseURL}${doctor.image}` : "",
      price: formatPrice(doctor.dr_price),
    }));
    
    res.json(mappedDoctors);
  } catch (err) {
    console.error("Error getting doctors by hospital and specialty:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Lấy lịch trống của bác sĩ cho ngày cụ thể
exports.getAvailableSlots = async (req, res) => {
  try {
    const { dr_id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }
    
    // Lấy các time slots của bác sĩ áp dụng cho ngày đã chọn
    const applicableSlots = await scheduleService.getSchedulesByDoctorIdAndDate(dr_id, date);
    
    // Lấy các slot đã được đặt trong ngày
    const bookedSlots = await doctorService.getBookedSlots(dr_id, date);
    
    // Lọc ra các slot còn trống
    const bookedTimeSlots = bookedSlots.map(slot => slot.time_slot);
    const availableSlots = applicableSlots
      .map(slot => slot.time_slot)
      .filter(timeSlot => !bookedTimeSlots.includes(timeSlot));
    
    // Sắp xếp theo giờ bắt đầu
    availableSlots.sort((a, b) => {
      const sa = (a?.split('-')[0] || '').trim();
      const sb = (b?.split('-')[0] || '').trim();
      return sa.localeCompare(sb);
    });
    
    res.json({ availableSlots });
  } catch (err) {
    console.error("Error getting available slots:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Cập nhật lịch khám của bác sĩ (chính chủ)
exports.updateDoctorSchedules = async (req, res) => {
  try {
    const { schedules = [] } = req.body;
    // Xác định dr_id thực tế từ token (id_u) nếu cần
    let doctorId = req.user?.dr_id;
    if (!doctorId && req.user?.id_u) {
      try {
        const doctor = await doctorService.getDoctorByUserId(req.user.id_u);
        doctorId = doctor?.dr_id;
      } catch (e) {
        doctorId = null;
      }
    }
    
    if (!doctorId) {
      return res.status(401).json({ error: "Unauthorized - Doctor ID not found" });
    }
    
    // Kiểm tra xem user có phải là bác sĩ không
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: "Forbidden - Only doctors can update schedules" });
    }
    
    // Validate schedules format
    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: "Schedules must be an array" });
    }
    
    // Validate time slot format (HH:MM - HH:MM)
    const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidSlots = schedules.filter(slot => !timeSlotRegex.test(slot));
    
    if (invalidSlots.length > 0) {
      return res.status(400).json({ 
        error: "Invalid time slot format", 
        invalidSlots: invalidSlots 
      });
    }
    
    // Xóa lịch cũ và thêm lịch mới
    await scheduleService.deleteSchedulesByDoctorId(doctorId);
    
    if (schedules.length > 0) {
      await scheduleService.addSchedules(doctorId, schedules);
    }
    
    res.json({ 
      success: true, 
      message: "Lịch khám đã được cập nhật thành công",
      schedules: schedules 
    });
    
  } catch (err) {
    console.error("❌ Update doctor schedules error:", err);
    res.status(500).json({ 
      error: "Không thể cập nhật lịch khám", 
      detail: err.message 
    });
  }
};

// Get doctor schedules for a specific day of week
exports.getDoctorSchedulesByDay = async (req, res) => {
  try {
    const { dr_id, day } = req.params;
    const dayOfWeek = parseInt(day);
    
    if (dayOfWeek < 1 || dayOfWeek > 7) {
      return res.status(400).json({ error: "Day must be between 1 (Monday) and 7 (Sunday)" });
    }
    
    const schedules = await scheduleService.getSchedulesByDoctorIdAndDay(dr_id, dayOfWeek);
    const timeSlots = schedules.map(s => s.time_slot);
    
    res.json({ 
      success: true,
      day_of_week: dayOfWeek,
      schedules: timeSlots 
    });
  } catch (err) {
    console.error("❌ Get doctor schedules by day error:", err);
    res.status(500).json({ error: "Cannot get doctor schedules", detail: err.message });
  }
};

// Get doctor schedules for a specific date
exports.getDoctorSchedulesByDate = async (req, res) => {
  try {
    const { dr_id, date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    }
    
    const schedules = await scheduleService.getSchedulesByDoctorIdAndDate(dr_id, date);
    const timeSlots = schedules.map(s => s.time_slot);
    
    res.json({ 
      success: true,
      date: date,
      schedules: timeSlots 
    });
  } catch (err) {
    console.error("❌ Get doctor schedules by date error:", err);
    res.status(500).json({ error: "Cannot get doctor schedules", detail: err.message });
  }
};

// Update schedules with days support
exports.updateDoctorSchedulesWithDays = async (req, res) => {
  try {
    const { schedulesWithDays = {} } = req.body;
    // Xác định dr_id thực tế từ token (id_u) nếu cần
    let doctorId = req.user?.dr_id;
    if (!doctorId && req.user?.id_u) {
      try {
        const doctor = await doctorService.getDoctorByUserId(req.user.id_u);
        doctorId = doctor?.dr_id;
      } catch (e) {
        doctorId = null;
      }
    }
    
    if (!doctorId) {
      return res.status(401).json({ error: "Unauthorized - Doctor ID not found" });
    }
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: "Forbidden - Only doctors can update schedules" });
    }
    
    // Validate schedulesWithDays format
    if (typeof schedulesWithDays !== 'object') {
      return res.status(400).json({ error: "schedulesWithDays must be an object" });
    }
    
    // Validate day keys and time slot format
    const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const [day, slots] of Object.entries(schedulesWithDays)) {
      const dayNum = parseInt(day);
      if (dayNum < 1 || dayNum > 7) {
        return res.status(400).json({ error: `Invalid day: ${day}. Day must be between 1-7` });
      }
      
      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: `Slots for day ${day} must be an array` });
      }
      
      const invalidSlots = slots.filter(slot => !timeSlotRegex.test(slot));
      if (invalidSlots.length > 0) {
        return res.status(400).json({ 
          error: `Invalid time slot format for day ${day}`, 
          invalidSlots: invalidSlots 
        });
      }
    }
    
    // Delete old schedules and add new ones
    await scheduleService.deleteSchedulesByDoctorId(doctorId);
    
    if (Object.keys(schedulesWithDays).length > 0) {
      await scheduleService.addSchedulesForDays(doctorId, schedulesWithDays);
    }
    
    res.json({ 
      success: true, 
      message: "Lịch khám theo ngày đã được cập nhật thành công",
      schedulesWithDays: schedulesWithDays 
    });
    
  } catch (err) {
    console.error("❌ Update doctor schedules with days error:", err);
    res.status(500).json({ 
      error: "Không thể cập nhật lịch khám", 
      detail: err.message 
    });
  }
};
