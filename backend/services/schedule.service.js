// services/schedule.service.js
const db = require('../config/db');

async function getSchedulesByDoctorId(dr_id) {
  const [rows] = await db.query(
    'SELECT * FROM schedules WHERE dr_id = ? ORDER BY day_of_week, time_slot',
    [dr_id]
  );
  return rows;
}

async function getSchedulesByDoctorIdAndDay(dr_id, dayOfWeek) {
  const [rows] = await db.query(
    'SELECT * FROM schedules WHERE dr_id = ? AND (day_of_week = ? OR day_of_week IS NULL) AND is_recurring = TRUE ORDER BY time_slot',
    [dr_id, dayOfWeek]
  );
  return rows;
}

async function getSchedulesByDoctorIdAndDate(dr_id, specificDate) {
  const dayOfWeek = new Date(specificDate).getDay() === 0 ? 7 : new Date(specificDate).getDay();
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE dr_id = ? AND 
       (
         (specific_date = ? AND is_recurring = FALSE)
         OR
         (day_of_week = ? AND is_recurring = TRUE AND specific_date IS NULL)
         OR
         (day_of_week IS NULL AND is_recurring = TRUE AND specific_date IS NULL)
       )
       ORDER BY time_slot`,
    [dr_id, specificDate, dayOfWeek]
  );
  return rows;
}

/**
 * Lấy schedule row theo dr_id + time_slot + date
 * Ưu tiên: one-off > recurring by day > recurring all days
 */
async function getScheduleForSlot(dr_id, time_slot, specificDate) {
  const dayOfWeek = new Date(specificDate).getDay() === 0 ? 7 : new Date(specificDate).getDay();
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE dr_id = ? AND time_slot = ? AND
       (
         (specific_date = ? AND is_recurring = FALSE)
         OR
         (day_of_week = ? AND is_recurring = TRUE AND specific_date IS NULL)
         OR
         (day_of_week IS NULL AND is_recurring = TRUE AND specific_date IS NULL)
       )
     ORDER BY
       CASE
         WHEN specific_date = ? AND is_recurring = FALSE THEN 1
         WHEN day_of_week = ? AND is_recurring = TRUE    THEN 2
         ELSE 3
       END
     LIMIT 1`,
    [dr_id, time_slot, specificDate, dayOfWeek, specificDate, dayOfWeek]
  );
  return rows[0] || null;
}

/**
 * Lấy số slot đã dùng trong ngày từ schedule_slot_usage
 */
async function getSlotUsage(dr_id, time_slot, usage_date) {
  const [rows] = await db.query(
    'SELECT current_slot FROM schedule_slot_usage WHERE dr_id = ? AND time_slot = ? AND usage_date = ?',
    [dr_id, time_slot, usage_date]
  );
  return rows[0]?.current_slot ?? 0;
}

/**
 * Kiểm tra slot còn chỗ không theo ngày cụ thể
 * Trả về { available, current_slot, max_slot }
 */
async function checkSlotAvailability(dr_id, time_slot, specificDate) {
  const schedule = await getScheduleForSlot(dr_id, time_slot, specificDate);

  if (!schedule) {
    return { available: false, reason: 'Khung giờ không tồn tại' };
  }

  // max_slot = null → không giới hạn
  if (schedule.max_slot === null || schedule.max_slot === undefined) {
    return { available: true, current_slot: 0, max_slot: null };
  }

  const current = await getSlotUsage(dr_id, time_slot, specificDate);
  return {
    available: current < schedule.max_slot,
    current_slot: current,
    max_slot: schedule.max_slot,
    reason: current >= schedule.max_slot ? 'Khung giờ đã đầy' : undefined,
  };
}

/**
 * Tăng current_slot khi đặt lịch — dùng INSERT ... ON DUPLICATE KEY
 */
async function incrementSlotUsage(dr_id, time_slot, usage_date) {
  await db.query(
    `INSERT INTO schedule_slot_usage (dr_id, time_slot, usage_date, current_slot)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE current_slot = current_slot + 1`,
    [dr_id, time_slot, usage_date]
  );
}

/**
 * Giảm current_slot khi hủy/từ chối — không cho xuống dưới 0
 */
async function decrementSlotUsage(dr_id, time_slot, usage_date) {
  await db.query(
    `UPDATE schedule_slot_usage
     SET current_slot = GREATEST(current_slot - 1, 0)
     WHERE dr_id = ? AND time_slot = ? AND usage_date = ?`,
    [dr_id, time_slot, usage_date]
  );
}

async function addSchedules(dr_id, schedules) {
  if (!schedules.length) return;

  const values = schedules.map((s) => {
    if (typeof s === 'string') {
      return [dr_id, s, null, null, true, null];
    } else {
      return [
        dr_id,
        s.time_slot,
        s.day_of_week   || null,
        s.specific_date || null,
        s.is_recurring !== undefined ? s.is_recurring : true,
        s.max_slot      ?? null,
      ];
    }
  });

  await db.query(
    'INSERT INTO schedules (dr_id, time_slot, day_of_week, specific_date, is_recurring, max_slot) VALUES ?',
    [values]
  );
}

async function addSchedulesForDays(dr_id, schedulesData) {
  if (!schedulesData || Object.keys(schedulesData).length === 0) return;

  const values = [];
  Object.keys(schedulesData).forEach((dayKey) => {
    const slots = schedulesData[dayKey] || [];

    let dayOfWeek = null;
    if (dayKey !== null && dayKey !== undefined) {
      const keyStr = String(dayKey).trim().toLowerCase();
      if (keyStr !== 'null' && keyStr !== '' && keyStr !== 'all') {
        const parsed = parseInt(keyStr, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          dayOfWeek = parsed;
        }
      }
    }

    slots.forEach((slot) => {
      if (typeof slot === 'string' && slot.trim()) {
        values.push([dr_id, slot, dayOfWeek, null, true, null]);
      } else if (slot && typeof slot === 'object' && slot.time_slot?.trim()) {
        values.push([dr_id, slot.time_slot, dayOfWeek, null, true, slot.max_slot ?? null]);
      }
    });
  });

  if (!values.length) return;

  await db.query(
    'INSERT INTO schedules (dr_id, time_slot, day_of_week, specific_date, is_recurring, max_slot) VALUES ?',
    [values]
  );
}

async function updateScheduleMaxSlot(schedule_id, max_slot) {
  const [result] = await db.query(
    'UPDATE schedules SET max_slot = ? WHERE id = ?',
    [max_slot ?? null, schedule_id]
  );
  return result.affectedRows > 0;
}

async function deleteSchedulesByDoctorId(dr_id) {
  await db.query('DELETE FROM schedules WHERE dr_id = ?', [dr_id]);
}

module.exports = {
  getSchedulesByDoctorId,
  getSchedulesByDoctorIdAndDay,
  getSchedulesByDoctorIdAndDate,
  getScheduleForSlot,
  getSlotUsage,
  checkSlotAvailability,
  incrementSlotUsage,
  decrementSlotUsage,
  addSchedules,
  addSchedulesForDays,
  updateScheduleMaxSlot,
  deleteSchedulesByDoctorId,
};