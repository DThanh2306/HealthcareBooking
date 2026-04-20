<template>
  <div class="form-bg">
    <h1 class="title">
      {{ isEdit ? 'Cập nhật thông tin bác sĩ' : 'Thêm bác sĩ mới' }}
    </h1>
    <form
      class="form-card"
      @submit.prevent="onSubmit"
    >
      <div class="row">
        <div class="field">
          <label>Tên bác sĩ</label>
          <input
            type="text"
            placeholder="Doctor name"
            v-model="form.dr_name"
          />
        </div>
        <div class="field">
          <label>Chuyên khoa</label>
          <select
            v-model="form.specialty_id"
            style="border: 1px solid #e3e6ef; border-radius: 6px; background: #f7f8fb; font-size: 1rem; padding: 8px 14px; color: #111827;"
          >
            <option value="">-- Chọn chuyên khoa --</option>
            <option
              v-for="s in specialties"
              :key="s.id"
              :value="String(s.id)"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Bệnh viện công tác</label>
        <div style="display: flex; gap: 12px; margin-bottom: 8px">
          <label
            ><input
              type="radio"
              value="select"
              v-model="hospitalInputMode"
            />
            Chọn từ danh sách</label
          >
          <label
            ><input
              type="radio"
              value="manual"
              v-model="hospitalInputMode"
            />
            Nhập thủ công</label
          >
        </div>

        <select
          v-if="hospitalInputMode === 'select'"
          v-model="selectedHospitalId"
          @change="onHospitalChange"
          style="
            border: 1px solid #e3e6ef;
            border-radius: 6px;
            background: #f7f8fb;
            font-size: 1rem;
            padding: 8px 14px;
            color: #111827;
          "
        >
          <option value="">-- Chọn bệnh viện --</option>
          <option
            v-for="h in hospitals"
            :key="h.h_id"
            :value="h.h_id"
          >
            {{ h.h_name }}
          </option>
        </select>

        <input
          v-else
          type="text"
          placeholder="Address Hospital"
          v-model="form.dr_h_name"
        />
      </div>

      <div class="field">
        <label>Mô tả bác sĩ</label>
        <textarea
          rows="7"
          placeholder="Type description"
          v-model="form.dr_description"
        ></textarea>
      </div>

      <!-- 🕒 Lịch khám theo ngày -->
      <div class="field">
        <label>Lịch khám</label>
        
        <!-- Toggle between old and new schedule mode -->
        <div style="display: flex; gap: 12px; margin-bottom: 12px">
          <label>
            <input
              type="radio"
              value="all_days"
              v-model="scheduleMode"
            />
            Cố định cho tất cả ngày
          </label>
          <label>
            <input
              type="radio"
              value="by_days"
              v-model="scheduleMode"
            />
            Khác nhau theo từng ngày
          </label>
        </div>

        <!-- Old mode: All days same schedule -->
        <div v-if="scheduleMode === 'all_days'">
          <div class="add-slot">
            <input
              type="time"
              v-model="startTime"
              class="slot-input"
            />
            <span style="color: #111827;">-</span>
            <input
              type="time"
              v-model="endTime"
              class="slot-input"
            />
            <button
              type="button"
              @click="addSlot"
              class="add-btn"
            >
              + Thêm
            </button>
          </div>

          <ul class="slot-list">
            <li
              v-for="(slot, index) in form.schedules"
              :key="index"
              class="slot-item"
            >
              {{ slot }}
              <button
                type="button"
                class="remove-btn"
                @click="removeSlot(index)"
              >
                ✕
              </button>
            </li>
          </ul>
        </div>

        <!-- New mode: Different schedules by day -->
        <div v-else class="schedules-by-day">
          <div v-for="(dayName, dayNumber) in daysOfWeek" :key="dayNumber" class="day-schedule">
            <h4>
              {{ dayName }} 
              <span class="next-date">({{ getNextDateForDay(dayNumber) }})</span>
            </h4>
            
            <div class="add-slot">
              <input
                type="time"
                v-model="newSlot.startTime[dayNumber]"
                class="slot-input"
              />
              <span>-</span>
              <input
                type="time"
                v-model="newSlot.endTime[dayNumber]"
                class="slot-input"
              />
              <button
                type="button"
                @click="addSlotForDay(dayNumber)"
                class="add-btn"
              >
                + Thêm
              </button>
            </div>

            <ul class="slot-list">
              <li
                v-for="(slot, index) in schedulesWithDays[dayNumber] || []"
                :key="index"
                class="slot-item"
              >
                {{ slot }}
                <button
                  type="button"
                  class="remove-btn"
                  @click="removeSlotForDay(dayNumber, index)"
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="field">
        <label>Giá khám (VNĐ)</label>
        <input
          type="text"
          placeholder="Giá khám"
          v-model="formattedPrice"
          class="price-input"
        />
      </div>

     
      <div
        class="field"
        v-if="isEdit && form.image"
      >
        <label>Ảnh hiện tại:</label>
        <img
          :src="form.image"
          alt="doctor"
          width="120"
        />
      </div>

      <div class="field file-field">
        <label>Tải lên ảnh mới</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
          @change="onFileChange"
        />
        <span class="file-info">{{ fileName }}</span>
      </div>

      <button
        class="submit-btn"
        type="submit"
      >
        {{ isEdit ? 'Update' : 'Create' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const isEdit = ref(false);
const dr_id = route.params.dr_id;
const baseURL = 'http://localhost:3000';

const form = ref({
  dr_name: '',
  specialty: '',
  specialty_id: '',
  dr_h_name: '',
  dr_description: '',
  image: '',
  schedules: [],
  dr_price: ''
});

// Schedule by days support
const scheduleMode = ref('all_days');
const schedulesWithDays = ref({});
const daysOfWeek = ref({
  1: 'Thứ 2',
  2: 'Thứ 3', 
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật'
});

const newSlot = ref({
  startTime: {},
  endTime: {}
});

const specialties = ref([]);

// Hospital selection state
const hospitals = ref([]);
const selectedHospitalId = ref('');
const hospitalInputMode = ref('select');

function onHospitalChange() {
  const selected = hospitals.value.find((h) => String(h.h_id) === String(selectedHospitalId.value));
  if (selected) {
    form.value.dr_h_name = selected.h_name;
  }
}

const startTime = ref('');
const endTime = ref('');

function addSlot() {
  // Lịch khám không bắt buộc, không kiểm tra ràng buộc; chỉ thêm khi đủ 2 giá trị
  if (!startTime.value || !endTime.value) {
    return;
  }
  const slot = `${startTime.value} - ${endTime.value}`;
  form.value.schedules.push(slot);

  startTime.value = '';
  endTime.value = '';
}

function removeSlot(index) {
  form.value.schedules.splice(index, 1);
}

// Functions for schedule by days
function addSlotForDay(dayNumber) {
  if (!newSlot.value.startTime[dayNumber] || !newSlot.value.endTime[dayNumber]) {
    return;
  }
  
  const slot = `${newSlot.value.startTime[dayNumber]} - ${newSlot.value.endTime[dayNumber]}`;
  
  if (!schedulesWithDays.value[dayNumber]) {
    schedulesWithDays.value[dayNumber] = [];
  }
  
  schedulesWithDays.value[dayNumber].push(slot);
  
  // Clear input fields
  newSlot.value.startTime[dayNumber] = '';
  newSlot.value.endTime[dayNumber] = '';
}

function removeSlotForDay(dayNumber, index) {
  if (schedulesWithDays.value[dayNumber]) {
    schedulesWithDays.value[dayNumber].splice(index, 1);
    if (schedulesWithDays.value[dayNumber].length === 0) {
      delete schedulesWithDays.value[dayNumber];
    }
  }
}

// Get upcoming days same as DoctorDetail
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
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // Convert Sunday from 0 to 7

    result.push({ label, value, dayOfWeek });
  }

  return result;
}

// Get next date for specific day of week from the 7 upcoming days
function getNextDateForDay(dayOfWeek) {
  const today = new Date();
  const targetDay = parseInt(dayOfWeek);
  const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Convert our format (1=Monday, 7=Sunday) to JavaScript format (1=Monday, 0=Sunday)
  const jsTargetDay = targetDay === 7 ? 0 : targetDay;
  
  let daysToAdd;
  if (jsTargetDay >= currentDay) {
    daysToAdd = jsTargetDay - currentDay;
  } else {
    daysToAdd = 7 - (currentDay - jsTargetDay);
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);
  
  return targetDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  });
}

const imageFile = ref(null);
const fileName = ref('No file selected');

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    fileName.value = file.name;
  }
};

const onSubmit = async () => {
  // Basic client-side validation with friendly messages
  const errors = [];
  if (!form.value.dr_name || !String(form.value.dr_name).trim()) {
    errors.push('Vui lòng nhập tên bác sĩ');
  }
  if (!form.value.specialty_id) {
    errors.push('Vui lòng chọn chuyên khoa');
  }
  if (hospitalInputMode.value === 'select') {
    if (!selectedHospitalId.value) {
      errors.push('Vui lòng chọn bệnh viện trong danh sách');
    }
  } else {
    if (!form.value.dr_h_name || !String(form.value.dr_h_name).trim()) {
      errors.push('Vui lòng nhập tên bệnh viện');
    }
  }
  const price = Number(form.value.dr_price);
  if (!price || isNaN(price) || price <= 0) {
    errors.push('Vui lòng nhập giá khám hợp lệ (> 0)');
  }

  if (errors.length > 0) {
    alert(errors.join('\n'));
    return;
  }

  try {
    const data = new FormData();
    data.append('dr_name', form.value.dr_name.trim());
    // Send single specialty_id
    data.append('specialty_id', String(form.value.specialty_id || ''));
    // Always send h_id field; backend will coerce empty to null
    data.append('h_id', hospitalInputMode.value === 'select' ? String(selectedHospitalId.value) : '');

    // If selecting hospital, ensure dr_h_name matches selection
    if (hospitalInputMode.value === 'select' && selectedHospitalId.value) {
      const selected = hospitals.value.find(
        (h) => String(h.h_id) === String(selectedHospitalId.value)
      );
      if (selected) {
        data.append('dr_h_name', selected.h_name || '');
      }
    } else {
      // Manual input: send name only, h_id will be nullified on backend if absent
      data.append('dr_h_name', form.value.dr_h_name || '');
    }
    data.append('dr_price', String(price));

    // Send appropriate schedule data based on mode
    if (scheduleMode.value === 'by_days') {
      data.append('schedulesWithDays', JSON.stringify(schedulesWithDays.value));
      data.append('schedules', JSON.stringify([])); // Empty old format
    } else {
      data.append('schedules', JSON.stringify(form.value.schedules));
      data.append('schedulesWithDays', JSON.stringify({})); // Empty new format
    }

    data.append('dr_description', form.value.dr_description || '');

    if (imageFile.value) {
      data.append('avatarFile', imageFile.value);
    } else if (isEdit.value && form.value.image) {
      const relativePath = form.value.image.replace(baseURL, '');
      data.append('image', relativePath);
    }

    if (isEdit.value) {
      await axios.put(`${baseURL}/api/doctors/${dr_id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Cập nhật thành công');
    } else {
      await axios.post(`${baseURL}/api/doctors`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Thêm thành công');
    }

    router.push('/admin/doctors');
  } catch (err) {
    alert('Lỗi khi gửi dữ liệu');
    console.error(err);
  }
};
import { computed } from 'vue';

const formattedPrice = computed({
  get() {
    // Hiển thị dạng "100.000"
    return form.value.dr_price ? Number(form.value.dr_price).toLocaleString('vi-VN') : '';
  },
  set(val) {
    // Khi người dùng nhập, loại bỏ dấu chấm và ký tự không phải số
    const numericValue = Number(String(val).replace(/[^\d]/g, '')) || 0;
    form.value.dr_price = numericValue; // Lưu giá trị thực vào form
  }
});

onMounted(async () => {
  // Load hospitals for selection
  try {
    const resHospitals = await axios.get(`${baseURL}/api/hospitals`);
    hospitals.value = resHospitals.data || [];
  } catch (e) {
    hospitals.value = [];
    console.error(e);
  }
  // Load specialties for selection
  try {
    const resSpecialties = await axios.get(`${baseURL}/api/specialties`);
    specialties.value = resSpecialties.data || [];
  } catch (e) {
    specialties.value = [];
    console.error(e);
  }

  if (dr_id && dr_id !== 'new') {
    isEdit.value = true;
    try {
      const res = await axios.get(`${baseURL}/api/doctors/${dr_id}`);
      form.value = {
        ...res.data,
        dr_price: Number(String(res.data.dr_price).replace(/[^\d]/g, '')) || 0,
        schedules: Array.isArray(res.data.schedules) ? res.data.schedules : []
      };

      // Check if doctor has schedulesByDay (new format) or just schedules array (old format)
      if (res.data.schedulesByDay && Object.keys(res.data.schedulesByDay).length > 0) {
        // New format: doctor has different schedules for different days
        scheduleMode.value = 'by_days';
        schedulesWithDays.value = res.data.schedulesByDay;
        
        // Clear old format
        form.value.schedules = [];
      } else {
        // Old format: doctor has same schedules for all days
        scheduleMode.value = 'all_days';
        schedulesWithDays.value = {};
        
        // Ensure schedules is array of strings
        form.value.schedules = Array.isArray(res.data.schedules) 
          ? res.data.schedules.map(s => typeof s === 'string' ? s : s.time_slot)
          : [];
      }
      const specialtyId = res.data.specialty_id;
      form.value.specialty_id = specialtyId ? String(specialtyId) : '';

      // Initialize hospital selection mode
      if (res.data && res.data.h_id) {
        hospitalInputMode.value = 'select';
        selectedHospitalId.value = String(res.data.h_id);
        // Ensure display name stays in form for visibility
        const selected = hospitals.value.find((h) => String(h.h_id) === String(res.data.h_id));
        if (selected) form.value.dr_h_name = selected.h_name;
      } else {
        hospitalInputMode.value = 'manual';
      }

      if (form.value.image && !form.value.image.startsWith('http')) {
        form.value.image = baseURL + form.value.image;
      }
    } catch (err) {
      alert('Không tải được dữ liệu');
      console.error(err);
    }
  }
});
</script>

<style scoped>
.form-bg {
  background: #f7f8fb;
  min-height: 100vh;
  padding: 0;
}
.title {
  font-size: 2rem;
  margin: 24px 0 12px 18px;
  color: #25262b;
  font-weight: 500;
}
.form-card {
  max-width: 100%;
  margin: 0 18px 32px 18px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 7px #eee;
  padding: 30px 18px 20px 18px;
}
.row {
  display: flex;
  gap: 24px;
  margin-bottom: 0;
}
.field {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 20px;
}
.field label {
  color: #5a6271;
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 5px;
}
.field input[type='text'],
.field textarea {
  border: 1px solid #e3e6ef;
  border-radius: 6px;
  background: #f7f8fb;
  font-size: 1rem;
  padding: 8px 14px;
  margin-bottom: 0;
  transition: border 0.18s;
  color: #111827;
}
.field input[type='text']:focus,
.field textarea:focus {
  outline: none;
  border-color: #6e87d8;
  background: #fff;
}

.add-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.slot-input {
  width: 120px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: #f3f6fb;
  color: #111827;
}
.slot-input::-webkit-calendar-picker-indicator {
  filter: brightness(0); /* ép thành màu đen */
  cursor: pointer;
}
.add-btn {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 5px;
  cursor: pointer;
}
.add-btn:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}
.slot-list {
  list-style: none;
  padding-left: 0;
}
.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3f6fb;
  border: 1px solid #e0e3ea;
  padding: 6px 10px;
  border-radius: 5px;
  margin-bottom: 5px;
}
.remove-btn {
  background: none;
  border: none;
  color: #d9534f;
  font-size: 1.1rem;
  cursor: pointer;
}
.remove-btn:hover {
  color: #b52b27;
}

.schedules-by-day {
  border: 1px solid #e0e3ea;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
}

.day-schedule {
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid #e8ebef;
  border-radius: 6px;
  background: #fff;
}

.day-schedule:last-child {
  margin-bottom: 0;
}

.day-schedule h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.next-date {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 400;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
}

.file-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.field input[type='file'] {
  margin-right: 16px;
}
.file-info {
  font-size: 0.99rem;
  color: #7981a1;
}
.submit-btn {
  margin-top: 12px;
  padding: 7px 26px;
  font-size: 1.07rem;
  font-weight: 500;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: background 0.16s;
}
.submit-btn:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}
.price-input {
  max-width: 200px;
  height: 20px;
}
@media (max-width: 950px) {
  .row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
