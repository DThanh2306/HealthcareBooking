// schedule.service.js
const db = require('../config/db');

async function getSchedulesByDoctorId(dr_id) {
  const [rows] = await db.query(
    'SELECT * FROM schedules WHERE dr_id = ? ORDER BY day_of_week, time_slot',
    [dr_id]
  );
  return rows;
}

// Get schedules for a specific day of week
async function getSchedulesByDoctorIdAndDay(dr_id, dayOfWeek) {
  const [rows] = await db.query(
    'SELECT * FROM schedules WHERE dr_id = ? AND (day_of_week = ? OR day_of_week IS NULL) AND is_recurring = TRUE ORDER BY time_slot',
    [dr_id, dayOfWeek]
  );
  return rows;
}

// Get schedules for a specific date
async function getSchedulesByDoctorIdAndDate(dr_id, specificDate) {
  const dayOfWeek = new Date(specificDate).getDay() === 0 ? 7 : new Date(specificDate).getDay(); // Convert Sunday from 0 to 7
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE dr_id = ? AND 
       (
         -- Lịch theo ngày cụ thể (one-off)
         (specific_date = ? AND is_recurring = FALSE)
         OR
         -- Lịch lặp lại theo ngày trong tuần
         (day_of_week = ? AND is_recurring = TRUE AND specific_date IS NULL)
         OR
         -- Lịch cố định mọi ngày (định dạng cũ: day_of_week IS NULL, is_recurring = TRUE)
         (day_of_week IS NULL AND is_recurring = TRUE AND specific_date IS NULL)
       )
       ORDER BY time_slot`,
    [dr_id, specificDate, dayOfWeek]
  );
  return rows;
}

async function addSchedules(dr_id, schedules) {
  if (!schedules.length) return;

  // Support both old format (just time_slot) and new format (with day_of_week)
  const values = schedules.map((s) => {
    if (typeof s === 'string') {
      // Old format: just time slot, apply to all days
      return [dr_id, s, null, null, true]; // dr_id, time_slot, day_of_week, specific_date, is_recurring
    } else {
      // New format: object with time_slot, day_of_week, etc.
      return [
        dr_id,
        s.time_slot,
        s.day_of_week || null,
        s.specific_date || null,
        s.is_recurring !== undefined ? s.is_recurring : true,
      ];
    }
  });

  await db.query(
    'INSERT INTO schedules (dr_id, time_slot, day_of_week, specific_date, is_recurring) VALUES ?',
    [values]
  );
}

// Add schedules for specific days of week
async function addSchedulesForDays(dr_id, schedulesData) {
  if (!schedulesData || Object.keys(schedulesData).length === 0) return;

  const values = [];
  Object.keys(schedulesData).forEach((dayKey) => {
    const slots = schedulesData[dayKey] || [];
    // Normalize day_of_week: allow 1..7; treat 'null'/'', undefined, 'all' as null (applies generically)
    let dayOfWeek = null;
    if (dayKey !== null && dayKey !== undefined) {
      const keyStr = String(dayKey).trim().toLowerCase();
      if (keyStr !== 'null' && keyStr !== '' && keyStr !== 'all') {
        const parsed = parseInt(keyStr, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          dayOfWeek = parsed;
        } else {
          // invalid day provided; keep null to avoid NaN in SQL
          dayOfWeek = null;
        }
      }
    }

    slots.forEach((timeSlot) => {
      if (typeof timeSlot === 'string' && timeSlot.trim()) {
        values.push([dr_id, timeSlot, dayOfWeek, null, true]);
      }
    });
  });

  if (!values.length) return;

  await db.query(
    'INSERT INTO schedules (dr_id, time_slot, day_of_week, specific_date, is_recurring) VALUES ?',
    [values]
  );
}

async function deleteSchedulesByDoctorId(dr_id) {
  await db.query('DELETE FROM schedules WHERE dr_id = ?', [dr_id]);
}

module.exports = {
  getSchedulesByDoctorId,
  getSchedulesByDoctorIdAndDay,
  getSchedulesByDoctorIdAndDate,
  addSchedules,
  addSchedulesForDays,
  deleteSchedulesByDoctorId,
};
