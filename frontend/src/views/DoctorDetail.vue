
<template>
  <div class="doctor-profile">
    <!-- Header Section -->
    <div class="profile-header">
      <div class="avatar-section">
        <img
          :src="doctor?.image || placeholderImage"
          :alt="doctor?.dr_name"
          class="doctor-avatar"
          @error="usePlaceholderImage"
        />
      </div>
      <div class="main-info">
        <h1 class="title">{{ doctor?.dr_name }}</h1>
        <div class="description">
          {{ doctor?.specialty || 'Chưa cập nhật chuyên môn' }}
        </div>

        <button
          @click="shareProfile"
          class="booking-btn"
        >
          Chia sẻ
        </button>
      </div>
    </div>

    <!-- Booking Section -->
    <div class="doctor-content">
      <!-- Schedule -->
      <div class="schedule-area">
       
        <div class="schedule-section">
          <div class="schedule-label">
            <svg class="label-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 2v2M17 2v2M3 8h18M5 22h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span> LỊCH KHÁM</span>
          </div>
           <div class="date-select">
          <select
            v-model="selectedDate"
            class="date-dropdown"
          >
            <option
              v-for="(day, index) in daysList"
              :key="index"
              :value="day.value"
            >
              {{ day.label }}
            </option>
          </select>
        </div>
          
          <!-- Show selected day info for new format doctors -->
          <div v-if="selectedDate && doctor?.schedulesByDay" class="selected-day-info">
            <p class="day-display">
              <strong>{{ getVietnameseDayName(selectedDate) }}</strong> - {{ formatDisplayDate(selectedDate) }}
            </p>
          </div>

          <div class="slots-list">
            <template v-if="availableSlots?.length">
              <div
                v-for="(slot, index) in availableSlots"
                :key="index"
                class="time-slot"
                :class="{ booked: bookedSlots.includes(slot), disabled: isPastSlot(slot) }"
                @click="goToBookingForm(slot)"
              >
                {{ slot }}
              </div>
            </template>

            <p
              v-else
              class="text-gray-500 text-sm italic"
            >
              {{ doctor?.schedulesByDay ? 'Bác sĩ không làm việc vào ngày này' : 'Chưa cập nhật lịch khám' }}
            </p>
          </div>
          <div class="note">Chọn và đặt (Phí đặt lịch 0đ)</div>
        </div>
      </div>

      <!-- Price and Clinic Info -->
      <div class="info-area">
        <div class="clinic-info">
          <div class="clinic-title">
            <svg class="label-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3z" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2"/>
            </svg>
            <strong>ĐỊA CHỈ KHÁM</strong>
          </div>
          <div class="clinic-location">
            <span class="clinic-name">{{ doctor?.dr_h_name }}</span>
            <div v-if="doctor?.h_address" class="clinic-address">
              <svg class="address-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 11.5A2.5 2.5 0 1 1 12 8a2.5 2.5 0 0 1 0 5.5Z"/>
              </svg>
              <span>{{ doctor.h_address }}</span>
            </div>
          </div>
          
          <div class="fee">
            GIÁ KHÁM:
            <span class="price">
              {{ doctor?.dr_price ? `${doctor.dr_price.toLocaleString()}₫ ` : 'Chưa cập nhật' }}
            </span>
          </div>
          
        </div>
      </div>
    </div>

    <!-- Description Section -->
    <hr />
    <div class="section">
      <h2>Thông tin chi tiết</h2>
      <p v-if="doctor?.dr_description">{{ doctor.dr_description }}</p>
      <p
        v-else
        class="text-gray-500 text-sm italic"
      >
        Chưa có thông tin mô tả.
      </p>
    </div>

    <!-- Rating Section -->
    <hr />
    <div class="section">
      <div class="rating-section-header">
        <h2>Đánh giá từ bệnh nhân</h2>
        <button 
          @click="showRatingModal = true"
          class="rate-doctor-btn"
          v-if="!hasUserRated"
        >
          Đánh giá bác sĩ
        </button>
      </div>
      
      <RatingDisplay
  :ratings="ratings"
  :summary="ratingSummary"
  :pagination="ratingPagination"
  :loading="loadingRatings"
  :context="'doctor'"
  :currentUserId="currentUserId"
  @load-page="loadRatings"
>
  <template #owner-actions="{ rating }">
    <div class="rating-actions">
      <button @click="editRating(rating)" class="edit-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Sửa
      </button>
      <button @click="deleteRating(rating)" class="delete-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        Xóa
      </button>
    </div>
  </template>
</RatingDisplay>
    </div>

    <!-- Rating Modal -->
    <DoctorRatingModal
      :show="showRatingModal"
      :doctor="doctor"
      @close="showRatingModal = false"
      @rating-submitted="handleRatingSubmitted"
      @show-message="showMessage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';
import router from '@/router';
import DoctorRatingModal from '@/components/DoctorRatingModal.vue';
import RatingDisplay from '@/components/RatingDisplay.vue';

//

const selectedDate = ref(''); // ngày đang chọn
const daysList = ref([]);
const bookedSlots = ref([]); // ✅ danh sách slot đã được đặt
const availableSlots = ref([]); // Available slots for selected date

// Rating related
const showRatingModal = ref(false);
const ratings = ref([]);
const ratingSummary = ref(null);
const ratingPagination = ref(null);
const loadingRatings = ref(false);
const hasUserRated = ref(false);
const currentUserId = ref(null);

// 🟩 Hàm sửa đánh giá
function editRating(rating) {
  // Mở modal sửa, hoặc gọi lại modal cũ với dữ liệu có sẵn
  showRatingModal.value = true;

  // Bạn có thể truyền dữ liệu rating này vào modal (nếu modal hỗ trợ)
  // Ví dụ: modal.value.setEditData(rating)
  console.log("Sửa đánh giá:", rating);
}

// 🟥 Hàm xóa đánh giá
async function deleteRating(rating) {
  if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;

  try {
    await axios.delete(`/feedback/doctor-rating/${rating.id_fb}`);

    alert("Đã xóa đánh giá!");
    await loadRatings(); // Reload lại danh sách đánh giá
  } catch (err) {
    console.error("Lỗi xóa đánh giá:", err);
    alert("Không thể xóa đánh giá. Vui lòng thử lại!");
  }
}




function getUpcomingDays() {
  const today = new Date();
  const result = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const label = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }); // Thứ 3 - 02/07
    
    // Use local date instead of UTC to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const value = `${year}-${month}-${day}`; // YYYY-MM-DD

    result.push({ label, value });
  }

  return result;
}

const route = useRoute();
const doctor = ref(null);
const baseURL = 'http://localhost:3000';
const placeholderImage = 'https://placehold.co/128x128/c0c0c0/585858/png?text=Doctor+Image';

const usePlaceholderImage = (e) => {
  e.target.src = placeholderImage;
};

const shareProfile = () => {
  if (!doctor.value) return;
  const title = `Thông tin bác sĩ ${doctor.value.dr_name}`;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({ title, url }).catch(() => alert('Chia sẻ thất bại'));
  } else {
    navigator.clipboard.writeText(url);
    alert('Đã sao chép liên kết');
  }
};

// ✅ Hàm tải slot đã đặt (gọi API backend)
async function loadBookedSlots() {
  if (!doctor.value?.dr_id || !selectedDate.value) return;
  try {
    const res = await axios.get(
      `${baseURL}/api/patients/booked/${doctor.value.dr_id}/${selectedDate.value}`
    );
    bookedSlots.value = res.data || [];
  } catch (err) {
    console.error('Lỗi tải slot đã đặt:', err);
  }
}

// Load available slots for selected date
async function loadAvailableSlots() {
  if (!doctor.value?.dr_id || !selectedDate.value) {
    availableSlots.value = [];
    return;
  }

  try {
    // Check if doctor has schedulesByDay (new format)
    if (doctor.value.schedulesByDay && Object.keys(doctor.value.schedulesByDay).length > 0) {
      // New format: get slots for specific day of week
      const selectedDateObj = new Date(selectedDate.value);
      let dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
      dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
      
      // Get slots for this day of week
      const slotsForDay = doctor.value.schedulesByDay[dayOfWeek] || [];
      availableSlots.value = slotsForDay;
      
      console.log(`📅 Selected date: ${selectedDate.value}, Day of week: ${dayOfWeek}, Slots:`, slotsForDay);
    } else {
      // Old format: try API call or use all schedules
      try {
        const response = await axios.get(`${baseURL}/api/doctors/${doctor.value.dr_id}/schedules/date/${selectedDate.value}`);
        
        if (response.data.success && response.data.schedules?.length) {
          availableSlots.value = response.data.schedules;
        } else {
          // Fallback: use all schedules
          availableSlots.value = Array.isArray(doctor.value.schedules) 
            ? doctor.value.schedules.map(s => typeof s === 'string' ? s : s.time_slot)
            : [];
        }
      } catch (apiError) {
        console.error('❌ Lỗi API, dùng schedules gốc:', apiError);
        availableSlots.value = Array.isArray(doctor.value.schedules) 
          ? doctor.value.schedules.map(s => typeof s === 'string' ? s : s.time_slot)
          : [];
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch khám theo ngày:', error);
    // Final fallback
    availableSlots.value = [];
  }
}

function isPastSlot(slot) {
  try {
    if (!selectedDate.value) return false;
    const today = new Date();
    const sel = new Date(selectedDate.value);

    // Nếu ngày chọn sau hôm nay => luôn hợp lệ
    const selY = sel.getFullYear(), selM = sel.getMonth(), selD = sel.getDate();
    const nowY = today.getFullYear(), nowM = today.getMonth(), nowD = today.getDate();
    const isSameDay = selY === nowY && selM === nowM && selD === nowD;

    if (!isSameDay) {
      // Nếu ngày trong quá khứ => coi là past
      if (sel < new Date(nowY, nowM, nowD)) return true;
      // Nếu tương lai => không past
      return false;
    }

    // Cùng ngày: cần so với giờ hiện tại
    // Lấy giờ bắt đầu từ slot, hỗ trợ các định dạng: "HH:mm", "HH:mm - HH:mm", "HH:mm~HH:mm"
    const match = String(slot).match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);

    const slotStart = new Date(selY, selM, selD, h, m, 0, 0);

    return slotStart.getTime() <= today.getTime();
  } catch (e) {
    return false;
  }
}

function goToBookingForm(slot) {
  // Nếu slot đã được đặt thì không cho click
  if (bookedSlots.value.includes(slot)) return alert('Khung giờ này đã có người đặt!');
  // Nếu slot trong quá khứ (cùng ngày) thì chặn
  if (isPastSlot(slot)) return alert('Không thể đặt khung giờ đã qua!');

  const targetRoute = {
    name: 'bookingform',
    query: {
      dr_id: doctor.value.dr_id,
      date: selectedDate.value,
      time: slot
    }
  };

  // Kiểm tra đăng nhập: nếu chưa đăng nhập => chuyển tới trang đăng nhập,
  // sau đó quay lại BookingForm với đầy đủ dữ liệu (dr_id, date, time)
  const token = localStorage.getItem('userToken') || localStorage.getItem('token');
  if (!token) {
    alert('Bạn cần đăng nhập để đặt lịch');
    const href = router.resolve(targetRoute).href;
    return router.push({ name: 'auth', query: { redirect: encodeURIComponent(href) } });
  }

  router.push(targetRoute);
}

onMounted(async () => {
  try {
    const dr_id = route.params.dr_id;
    const res = await axios.get(`${baseURL}/api/doctors/${dr_id}`);
    doctor.value = res.data;
  } catch (err) {
    alert('Không thể tải dữ liệu bác sĩ');
    console.error(err);
  }

  daysList.value = getUpcomingDays();
  selectedDate.value = daysList.value[0]?.value || '';

  // Lấy current user id an toàn ở client
  try {
    currentUserId.value = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('userId')
      : null;
  } catch {
    currentUserId.value = null;
  }

  await loadAvailableSlots();
  await loadBookedSlots();
  await loadRatings();
});

// Helper functions for day display
function getVietnameseDayName(dateStr) {
  const date = new Date(dateStr);
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return dayNames[date.getDay()];
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

// ✅ Gọi lại khi đổi ngày
watch(selectedDate, async () => {
  await loadAvailableSlots();
  await loadBookedSlots();
});

// Rating methods
async function loadRatings(page = 1) {
  if (!doctor.value?.dr_id) return;
  
  loadingRatings.value = true;
  try {
    const res = await axios.get(`/feedback/doctor/${doctor.value.dr_id}`, {
      params: { page, limit: 10 }
    });
    const payload = res.data?.data || {};
    ratings.value = payload.ratings || [];
    ratingSummary.value = {
      averageRating: payload.averageRating ? parseFloat(payload.averageRating) : 0,
      totalRatings: payload.pagination?.total || 0
    };
    ratingPagination.value = payload.pagination;
    // Cập nhật currentUserId và trạng thái đã đánh giá
    if (payload.currentUserId && !currentUserId.value) {
      currentUserId.value = payload.currentUserId;
    }
    hasUserRated.value = !!(payload.myRating || ratings.value.some(r => r.isOwner));
  } catch (err) {
    console.error('Lỗi tải đánh giá:', err);
  } finally {
    loadingRatings.value = false;
  }
}

function handleRatingSubmitted() {
  // Reload ratings after submission
  loadRatings();
  hasUserRated.value = true;
}

function showMessage(message) {
  alert(message.text);
}


</script>

<style scoped>
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.doctor-profile {
  max-width: 1100px;
  margin: 32px auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  padding: 18px 32px 26px 32px;
  font-family: 'Inter', Arial, sans-serif;
  border: 1px solid #eef2f7;
}
.profile-header {
  display: flex;
  gap: 32px;
  align-items: center;
  min-height: 120px;
}
.avatar-section {
  flex-shrink: 0;
}
.doctor-avatar {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #e6f0ff;
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.18);
}

.main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.title {
  font-size: 2.3rem;
  line-height: 1.1;
  font-weight: 700;
  margin: 0;
}
.description {
  color: #585858;
  font-size: 1.1rem;
}

.booking-btn {
  margin-top: 6px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 5px 18px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  width: 100px;
}
.booking-btn:hover {
    background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);

}
.doctor-content {
  display: flex;
  justify-content: space-between;
  gap: 38px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.schedule-area {
  flex: 2;
  min-width: 0;
  max-width: 600px;
}
.date-select {
  font-weight: 600;
  font-size: 1.08rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.date-link {
  color: #082146;
  cursor: pointer;
}
.dropdown-icon {
  font-size: 0.84em;
  margin-left: 2px;
}
.schedule-section {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px 10px 18px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  min-width: 320px;
  max-width: 520px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}
.schedule-label {
  font-weight: 700;
  font-size: 1rem;
  color: #1e3a8a;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.label-icon { color: #3b82f6; }
.slots-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}
.time-slot {
  background: #eef2ff;
  border: 2px solid #dbeafe;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  color: #1e3a8a;
  padding: 10px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.18s ease;
}
.time-slot.selected,
.time-slot:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border-color: #2563eb;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
}
.note {
  font-size: 0.94rem;
  color: #787878;
  margin-bottom: 4px;
}
.info-area {
  flex: 1.2;
  min-width: 320px;
}
.date-dropdown {
  font-size: 1rem;
  border: none;
  background: transparent;
  color: #1e3a8a;
  font-weight: 600;
  cursor: pointer;
}
.date-dropdown:focus {
  outline: none;
}
.clinic-info {
  background: #ffffff;
  border-radius: 12px;
  font-size: 1.05rem;
  border: 1px solid #e2e8f0;
  padding: 18px 18px 18px 18px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}
.clinic-title { display: flex; align-items: center; gap: 8px; color: #1e3a8a; margin-bottom: 6px; }
.clinic-location {
  margin: 7px 0 7px 0;
  color: #475569;
}
.clinic-name {
  color: #0f172a;
  font-weight: 700;
}
.clinic-address { display: flex; align-items: center; gap: 6px; margin-top: 6px; color: #64748b; font-size: 0.95rem; }
.address-icon { color: #3b82f6; }
.promotion {
  color: #f59e0b;
  font-size: 1.02rem;
  margin: 8px 0px 8px 0;
}
.fee {
  margin: 5px 0;
}
.price {
  color: #16a34a;
  font-weight: 800;
}
.see-details {
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.98rem;
  text-decoration: underline;
}
.insurance {
  color: #5d656a;
  font-weight: 600;
  margin-top: 5px;
}
hr {
  margin: 40px 0 30px 0;
  border-top: 1px solid #ebecee;
}
.section {
  margin-bottom: 22px;
}
.section h2 {
  font-size: 1.27rem;
  margin-bottom: 10px;
  margin-top: 0;
}
.section ul {
  margin: 0;
  padding-left: 19px;
  color: #353535;
  font-size: 1.06rem;
}
/* Responsive */
@media (max-width: 900px) {
  .doctor-profile {
    padding: 8px 2vw 16px 2vw;
  }
  .doctor-content {
    flex-direction: column;
    gap: 18px;
  }
  .info-area,
  .schedule-area {
    min-width: 0;
    max-width: none;
    width: 100%;
  }
  .slots-list {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  .profile-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
.time-slot.booked {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  pointer-events: none;
}
.time-slot.disabled {
  background: #f0f0f0;
  color: #999;
  border-color: #e0e0e0;
  cursor: not-allowed;
  pointer-events: none;
}

/* Rating Section Styles */
.rating-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.rate-doctor-btn {
   background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rate-doctor-btn:hover {
  color: #1e3a8a;
}

.rating-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.delete-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.selected-day-info {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #e8f4f8;
  border: 1px solid #bee5eb;
  border-radius: 6px;
}

.day-display {
  margin: 0;
  font-size: 14px;
  color: #0c5460;
  text-align: center;
}

.day-display strong {
  color: #0a4c57;
}

</style>
