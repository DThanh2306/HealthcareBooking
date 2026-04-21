 <template>
  <div class="doctor-profile">
    <!-- Header -->
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

    <!-- Booking -->
    <div class="doctor-content">
      <div class="schedule-area">
        <div class="schedule-section">
          <div class="schedule-label">
            <span> LỊCH KHÁM</span>
          </div>

          <!-- Select date -->
          <div class="date-select">
            <select
              v-model="selectedDate"
              class="date-dropdown"
            >
              <option
                v-for="d in daysList"
                :key="d.value"
                :value="d.value"
              >
                {{ d.label }}
              </option>
            </select>
          </div>

          <!-- Slots -->
          <div class="slots-list">
            <template v-if="availableSlots.length">
              <div
                v-for="slot in availableSlots"
                :key="slot.time_slot"
                class="time-slot"
                :class="{
                  booked: slot.is_full,
                  disabled: isPastSlot(slot.time_slot) || slot.is_full
                }"
                @click="goToBookingForm(slot)"
              >
                {{ slot.time_slot }}
              </div>
            </template>

            <p
              v-else
              class="text-gray-500 italic"
            >
              Không có lịch khám
            </p>
          </div>

          <div class="note">Chọn và đặt (Phí 0đ)</div>
        </div>
      </div>

      <!-- Info -->
      <div class="info-area">
        <div class="clinic-info">
          <strong>ĐỊA CHỈ KHÁM</strong>

          <div>{{ doctor?.dr_h_name }}</div>
          <div v-if="doctor?.h_address">{{ doctor.h_address }}</div>

          <div class="fee">
            GIÁ KHÁM:
            <span>
              {{ doctor?.dr_price ? doctor.dr_price + '₫' : 'Chưa cập nhật' }}
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
            <button
              @click="editRating(rating)"
              class="edit-btn"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style="margin-right: 4px"
              >
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              Sửa
            </button>
            <button
              @click="deleteRating(rating)"
              class="delete-btn"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style="margin-right: 4px"
              >
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axios'
import router from '@/router'

// ================= STATE =================
const route = useRoute()

const doctor = ref(null)
const selectedDate = ref('')
const daysList = ref([])
const availableSlots = ref([]) 
// [{ time_slot, max_slot, current_slot, is_full }]

// ================= CONFIG =================
const baseURL = 'http://localhost:3000'

// ================= DATE =================
function getUpcomingDays() {
  const result = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    result.push({
      value: `${year}-${month}-${day}`,
      label: d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      })
    })
  }

  return result
}

// ================= LOAD DOCTOR =================
async function loadDoctor() {
  try {
    const res = await axios.get(`${baseURL}/api/doctors/${route.params.dr_id}`)
    doctor.value = res.data
  } catch (err) {
    console.error(err)
    alert('Không thể tải bác sĩ')
  }
}

// ================= LOAD SLOT =================
async function loadAvailableSlots() {
  if (!doctor.value?.dr_id || !selectedDate.value) return

  try {
    const res = await axios.get(
      `${baseURL}/api/doctors/${doctor.value.dr_id}/available-slots`,
      {
        params: { date: selectedDate.value }
      }
    )

    // normalize data
    availableSlots.value = (res.data.availableSlots || []).map(s => {
       const max = Number(s.max_slot ?? 5) // default = 5 nếu BE không trả

       return {
        time_slot: s.time_slot,
        max_slot: max,
        current_slot: Number(s.current_slot || 0),
        is_full: max !== null && Number(s.current_slot || 0) >= max
      }
    })

    console.log('Slots:', availableSlots.value)

  } catch (err) {
    console.error('❌ loadAvailableSlots:', err)
    availableSlots.value = []
  }
}

// ================= CHECK =================
function isPastSlot(timeSlot) {
  if (!selectedDate.value) return false

  const today = new Date()
  const selected = new Date(selectedDate.value)

  const isSameDay = today.toDateString() === selected.toDateString()

  if (!isSameDay) return selected < today

  const match = timeSlot.match(/(\d{1,2}):(\d{2})/)
  if (!match) return false

  const h = parseInt(match[1])
  const m = parseInt(match[2])

  const slotTime = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    h,
    m
  )

  return slotTime <= today
}

// ================= NAVIGATE =================
function goToBookingForm(slot) {
  if (slot.is_full) 
    return alert('Khung giờ đã đầy')
  if (isPastSlot(slot.time_slot)) 
    return alert('Khung giờ đã qua')

  const target = {
    name: 'bookingform',
    query: {
      dr_id: doctor.value.dr_id,
      date: selectedDate.value,
      time: slot.time_slot
    }
  }

  const token = localStorage.getItem('userToken') || localStorage.getItem('token')

  if (!token) {
    const href = router.resolve(target).href
    return router.push({
      name: 'auth',
      query: { redirect: encodeURIComponent(href) }
    })
  }

  router.push(target)
}

// ================= INIT =================
onMounted(async () => {
  await loadDoctor()

  daysList.value = getUpcomingDays()
  selectedDate.value = daysList.value[0]?.value || ''

  await loadAvailableSlots()
})

// ================= WATCH =================
watch(selectedDate, async () => {
  await loadAvailableSlots()
})
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
  background: linear-gradient(135deg, #eeaeca 0%, #94bbe9 100%);
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
  background: linear-gradient(135deg, #ff599e 0%, #2f64a1 100%);
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
.label-icon {
  color: #3b82f6;
}
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
.clinic-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e3a8a;
  margin-bottom: 6px;
}
.clinic-location {
  margin: 7px 0 7px 0;
  color: #475569;
}
.clinic-name {
  color: #0f172a;
  font-weight: 700;
}
.clinic-address {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: #64748b;
  font-size: 0.95rem;
}
.address-icon {
  color: #3b82f6;
}
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
  background: linear-gradient(135deg, #eeaeca 0%, #94bbe9 100%);
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

.edit-btn,
.delete-btn {
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