// controllers/doctor.controller.js
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
    const specialty = req.query.specialty;
    const hospital = req.query.hospital;
    const search = req.query.search;

    let doctors;
    let total = 0;

    if (page && limit) {
      const offset = (page - 1) * limit;
      const [doctorsData, totalCount] = await Promise.all([
        doctorService.getDoctorsWithPagination(limit, offset, specialty, search, hospital),
        doctorService.countDoctors(specialty, search, hospital),
      ]);
      doctors = doctorsData;
      total = totalCount;
    } else {
      doctors = await doctorService.getAllDoctors(specialty, search, hospital);
      total = doctors.length;
    }

    const mapped = doctors.map((d) => ({
      ...d,
      image: d.image ? `${baseURL}${d.image}` : "",
      price: formatPrice(d.dr_price),
    }));

    if (page && limit) {
      return res.json({ data: mapped, total, totalPages: Math.ceil(total / limit), currentPage: page });
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

    const schedules = await scheduleService.getSchedulesByDoctorId(req.params.dr_id);

    const hasPerDay = schedules.some((s) => {
      const d = Number(s.day_of_week);
      return Number.isInteger(d) && d >= 1 && d <= 7;
    });

    if (hasPerDay) {
      const schedulesByDay = {};
      schedules.forEach((s) => {
        const d = Number(s.day_of_week);
        if (Number.isInteger(d) && d >= 1 && d <= 7) {
          if (!schedulesByDay[d]) schedulesByDay[d] = [];
          schedulesByDay[d].push({
            time_slot: s.time_slot,
            max_slot:  s.max_slot ?? null,
          });
        }
      });
      doctor.schedules = schedules;
      doctor.schedulesByDay = schedulesByDay;
    } else {
      doctor.schedules = schedules.map((s) => s.time_slot);
    }

    try {
      if (doctor.h_id) {
        const hospital = await hospitalService.getHospitalById(doctor.h_id);
        if (hospital) {
          doctor.h_address = hospital.h_address || doctor.h_address;
          doctor.dr_h_name = doctor.dr_h_name || hospital.h_name;
        }
      } else if (!doctor.h_address && doctor.dr_h_name) {
        const hospitalByName = await hospitalService.getHospitalByNameInsensitive(doctor.dr_h_name);
        if (hospitalByName) doctor.h_address = hospitalByName.h_address;
      }
    } catch (e) {}

    doctor.image = doctor.image ? `${baseURL}${doctor.image}` : "";
    doctor.dr_price = formatPrice(doctor.dr_price);

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const schedulesRaw = req.body.schedules || "[]";
    const schedulesParsed = Array.isArray(schedulesRaw) ? schedulesRaw : JSON.parse(schedulesRaw);

    let schedulesWithDays = {};
    try {
      const raw = req.body.schedulesWithDays || "{}";
      schedulesWithDays = typeof raw === 'object' ? raw : JSON.parse(raw);
    } catch (e) {
      schedulesWithDays = {};
    }

    const specialty_id = req.body.specialty_id ? Number(req.body.specialty_id) : null;
    const data = {
      ...req.body,
      image: req.file ? "/uploads/" + req.file.filename : "",
      h_id: req.body.h_id || null,
      specialty_id,
    };

    console.log("📝 Creating doctor with h_id:", data.h_id);
    const doctor = await doctorService.createDoctor(data);

    const schedules = Array.isArray(schedulesParsed)
      ? schedulesParsed.map((s) => (typeof s === "string" ? s : s?.time_slot)).filter(Boolean)
      : [];

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

    const specialty_id = req.body.specialty_id ? Number(req.body.specialty_id) : null;
    const data = {
      ...req.body,
      image: req.file ? "/uploads/" + req.file.filename : req.body.image,
      h_id: req.body.h_id || null,
      specialty_id,
    };

    console.log("📝 Updating doctor with h_id:", data.h_id);
    const doctor = await doctorService.updateDoctor(req.params.dr_id, data);

    await scheduleService.deleteSchedulesByDoctorId(req.params.dr_id);

    if (Object.keys(schedulesWithDays).length > 0) {
      await scheduleService.addSchedulesForDays(req.params.dr_id, schedulesWithDays);
    } else if (schedules.length) {
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
    await scheduleService.deleteSchedulesByDoctorId(req.params.dr_id);
    await doctorService.deleteDoctor(req.params.dr_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

exports.getDoctorsByHospitalAndSpecialty = async (req, res) => {
  try {
    const { hospitalName, specialtyId } = req.params;
    const baseURL = `${req.protocol}://${req.get("host")}`;
    const doctors = await doctorService.getDoctorsByHospitalAndSpecialty(hospitalName, specialtyId);
    const mappedDoctors = doctors.map((doctor) => ({
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

// ── Lấy lịch trống kèm thông tin slot ──────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
  try {
    const { dr_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const applicableSlots = await scheduleService.getSchedulesByDoctorIdAndDate(dr_id, date);

    // Gắn current_slot từ schedule_slot_usage cho từng slot
    const availableSlots = await Promise.all(
      applicableSlots.map(async (slot) => {
        const current = await scheduleService.getSlotUsage(dr_id, slot.time_slot, date);
        const max = slot.max_slot ?? null;
        return {
          id_schedule: slot.id_schedule,
          time_slot:    slot.time_slot,
          max_slot:     max,
          current_slot: current,
          is_full:      max !== null ? current >= max : false,
        };
      })
    );

    // Sắp xếp theo giờ bắt đầu
    availableSlots.sort((a, b) => {
      const sa = (a.time_slot?.split('-')[0] || '').trim();
      const sb = (b.time_slot?.split('-')[0] || '').trim();
      return sa.localeCompare(sb);
    });

    res.json({ availableSlots });
  } catch (err) {
    console.error("Error getting available slots:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ── Xem toàn bộ slot usage theo ngày (debug/admin) ──────────────────────────
exports.getDoctorSlotUsage = async (req, res) => {
  try {
    const { dr_id } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: "Thiếu tham số date" });

    const schedules = await scheduleService.getSchedulesByDoctorIdAndDate(dr_id, date);

    const result = await Promise.all(
      schedules.map(async (s) => {
        const current = await scheduleService.getSlotUsage(dr_id, s.time_slot, date);
        const max = s.max_slot ?? null;
        return {
          time_slot:    s.time_slot,
          max_slot:     max,
          current_slot: current,
          available:    max !== null ? max - current : null, // null = không giới hạn
          is_full:      max !== null ? current >= max : false,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("❌ getDoctorSlotUsage error:", err);
    res.status(500).json({ error: "Database error", detail: err.message });
  }
};

// ── Cập nhật max_slot cho một khung giờ ─────────────────────────────────────
exports.updateScheduleMaxSlot = async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const { max_slot } = req.body;

    if (max_slot !== null && max_slot !== undefined) {
      const val = parseInt(max_slot, 10);
      if (isNaN(val) || val < 1) {
        return res.status(400).json({ error: "max_slot phải là số nguyên dương hoặc null" });
      }
    }

    const updated = await scheduleService.updateScheduleMaxSlot(schedule_id, max_slot ?? null);
    if (!updated) return res.status(404).json({ error: "Không tìm thấy schedule" });

    res.json({ success: true, schedule_id, max_slot: max_slot ?? null });
  } catch (err) {
    console.error("❌ updateScheduleMaxSlot error:", err);
    res.status(500).json({ error: "Cập nhật thất bại", detail: err.message });
  }
};

exports.updateDoctorSchedules = async (req, res) => {
  try {
    const { schedules = [] } = req.body;

    let doctorId = req.user?.dr_id;
    if (!doctorId && req.user?.id_u) {
      try {
        const doctor = await doctorService.getDoctorByUserId(req.user.id_u);
        doctorId = doctor?.dr_id;
      } catch (e) { doctorId = null; }
    }

    if (!doctorId) return res.status(401).json({ error: "Unauthorized - Doctor ID not found" });
    if (req.user.role !== 'doctor') return res.status(403).json({ error: "Forbidden - Only doctors can update schedules" });
    if (!Array.isArray(schedules)) return res.status(400).json({ error: "Schedules must be an array" });

    const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidSlots = schedules.filter((slot) => !timeSlotRegex.test(slot));
    if (invalidSlots.length > 0) {
      return res.status(400).json({ error: "Invalid time slot format", invalidSlots });
    }

    await scheduleService.deleteSchedulesByDoctorId(doctorId);
    if (schedules.length > 0) await scheduleService.addSchedules(doctorId, schedules);

    res.json({ success: true, message: "Lịch khám đã được cập nhật thành công", schedules });
  } catch (err) {
    console.error("❌ Update doctor schedules error:", err);
    res.status(500).json({ error: "Không thể cập nhật lịch khám", detail: err.message });
  }
};

exports.getDoctorSchedulesByDay = async (req, res) => {
  try {
    const { dr_id, day } = req.params;
    const dayOfWeek = parseInt(day);

    if (dayOfWeek < 1 || dayOfWeek > 7) {
      return res.status(400).json({ error: "Day must be between 1 (Monday) and 7 (Sunday)" });
    }

    const schedules = await scheduleService.getSchedulesByDoctorIdAndDay(dr_id, dayOfWeek);

    res.json({
      success: true,
      day_of_week: dayOfWeek,
      schedules: schedules.map((s) => ({ time_slot: s.time_slot, max_slot: s.max_slot ?? null })),
    });
  } catch (err) {
    console.error("❌ Get doctor schedules by day error:", err);
    res.status(500).json({ error: "Cannot get doctor schedules", detail: err.message });
  }
};

exports.getDoctorSchedulesByDate = async (req, res) => {
  try {
    const { dr_id, date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    }

    const schedules = await scheduleService.getSchedulesByDoctorIdAndDate(dr_id, date);

    res.json({
      success: true,
      date,
      schedules: schedules.map((s) => ({ time_slot: s.time_slot, max_slot: s.max_slot ?? null })),
    });
  } catch (err) {
    console.error("❌ Get doctor schedules by date error:", err);
    res.status(500).json({ error: "Cannot get doctor schedules", detail: err.message });
  }
};

exports.updateDoctorSchedulesWithDays = async (req, res) => {
  try {
    const { schedulesWithDays = {} } = req.body;

    let doctorId = req.user?.dr_id;
    if (!doctorId && req.user?.id_u) {
      try {
        const doctor = await doctorService.getDoctorByUserId(req.user.id_u);
        doctorId = doctor?.dr_id;
      } catch (e) { doctorId = null; }
    }

    if (!doctorId) return res.status(401).json({ error: "Unauthorized - Doctor ID not found" });
    if (req.user.role !== 'doctor') return res.status(403).json({ error: "Forbidden - Only doctors can update schedules" });
    if (typeof schedulesWithDays !== 'object') return res.status(400).json({ error: "schedulesWithDays must be an object" });

    const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const [day, slots] of Object.entries(schedulesWithDays)) {
      const dayNum = parseInt(day);
      if (dayNum < 1 || dayNum > 7) {
        return res.status(400).json({ error: `Invalid day: ${day}. Day must be between 1-7` });
      }
      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: `Slots for day ${day} must be an array` });
      }
      for (const slot of slots) {
        const timeStr = typeof slot === 'string' ? slot : slot?.time_slot;
        if (!timeSlotRegex.test(timeStr)) {
          return res.status(400).json({ error: `Invalid time slot format for day ${day}`, invalidSlot: slot });
        }
        if (typeof slot === 'object' && slot.max_slot != null) {
          const val = parseInt(slot.max_slot, 10);
          if (isNaN(val) || val < 1) {
            return res.status(400).json({ error: `max_slot phải là số nguyên dương, day ${day} slot ${timeStr}` });
          }
        }
      }
    }

    await scheduleService.deleteSchedulesByDoctorId(doctorId);
    if (Object.keys(schedulesWithDays).length > 0) {
      await scheduleService.addSchedulesForDays(doctorId, schedulesWithDays);
    }

    res.json({ success: true, message: "Lịch khám theo ngày đã được cập nhật thành công", schedulesWithDays });
  } catch (err) {
    console.error("❌ Update doctor schedules with days error:", err);
    res.status(500).json({ error: "Không thể cập nhật lịch khám", detail: err.message });
  }
};