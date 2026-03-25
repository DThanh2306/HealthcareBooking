<template>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>Thông Tin Cá Nhân ({{ role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân' }})</h1>

        <button
          v-if="!isEditing"
          @click="startEdit"
          class="btn btn-primary"
        >
          <svg
            class="icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 
              002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 
              2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span>Chỉnh sửa</span>
        </button>

        <div
          v-else
          class="btn-group"
        >
          <button
            @click="saveProfile"
            class="btn btn-success"
          >
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Lưu</span>
          </button>

          <button
            @click="cancelEdit"
            class="btn btn-secondary"
          >
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Hủy</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 🧑‍⚕️ Giao diện bác sĩ -->
    <div
      v-if="role === 'doctor'"
      class="profile-content"
    >
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img
            :src="getImageUrl(profile.image)"
            alt="Doctor Avatar"
            class="avatar"
          />
          <button
            v-if="isEditing"
            @click="triggerFileInput"
            class="avatar-edit-btn"
          >
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            style="display: none"
          />
        </div>
        <h2 class="user-name">{{ profile.dr_name || profile.name }}</h2>
        <p class="user-role">Bác sĩ</p>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Họ và tên</label>
          <input
            v-if="isEditing"
            v-model="profile.dr_name"
            type="text"
            class="form-input"
          />
          <p
            v-else
            class="form-display"
          >
            {{ profile.dr_name }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Chuyên khoa</label>
          <template v-if="isEditing">
            <select
              v-model="profile.sp_id"
              class="form-input"
              @change="updateDoctorSpecialtyName"
            >
              <option value="">-- Chọn chuyên khoa --</option>
              <option
                v-for="sp in specialties"
                :key="sp.id"
                :value="String(sp.id)"
              >
                {{ sp.name }}
              </option>
            </select>
          </template>
          <p
            v-else
            class="form-display"
          >
            {{ profile.specialty || 'Chưa cập nhật' }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Bệnh viện công tác</label>
          <template v-if="isEditing">
            <select
              v-model="profile.h_id"
              class="form-input"
              @change="updateDoctorHospitalInfo"
            >
              <option value="">-- Chọn bệnh viện --</option>
              <option
                v-for="hospital in hospitals"
                :key="hospital.h_id"
                :value="String(hospital.h_id)"
              >
                {{ hospital.h_name }}
              </option>
            </select>
          </template>
          <p
            v-else
            class="form-display"
          >
            {{ profile.dr_h_name || 'Chưa cập nhật' }}
          </p>
        </div>


        <div class="form-group full-width">
          <label class="form-label">Mô tả</label>
          <textarea
            v-if="isEditing"
            v-model="profile.dr_description"
            rows="4"
            class="form-input"
          ></textarea>
          <p
            v-else
            class="form-display"
          >
            {{ profile.dr_description }}
          </p>
        </div>

        <!-- 🕒 Quản lý lịch khám cho bác sĩ -->
        <div class="form-group full-width">
          <label class="form-label">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lịch khám
          </label>
          
          <template v-if="isEditing">
            <div class="schedule-manager">
              <!-- Schedule mode toggle -->
              <div class="schedule-mode-toggle">
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

              <!-- Old mode: Same schedule for all days -->
              <div v-if="scheduleMode === 'all_days'" class="add-slot">
                <input
                  type="time"
                  v-model="startTime"
                  class="time-input"
                  placeholder="Giờ bắt đầu"
                />
                <span class="time-separator">-</span>
                <input
                  type="time"
                  v-model="endTime"
                  class="time-input"
                  placeholder="Giờ kết thúc"
                />
                <button
                  type="button"
                  @click="addTimeSlot"
                  class="btn btn-add-slot"
                  :disabled="!startTime || !endTime"
                >
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm
                </button>
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
                      v-model="newSlot.startTime[dayNumber]"
                      type="time"
                      class="time-input"
                    />
                    <span class="time-separator">-</span>
                    <input
                      v-model="newSlot.endTime[dayNumber]"
                      type="time"
                      class="time-input"
                    />
                    <button
                      type="button"
                      @click="addSlotForDay(dayNumber)"
                      class="btn btn-add-slot"
                      :disabled="!newSlot.startTime[dayNumber] || !newSlot.endTime[dayNumber]"
                    >
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm
                    </button>
                  </div>

                  <div v-if="schedulesWithDays[dayNumber]" class="slots-list">
                    <div
                      v-for="(slot, index) in schedulesWithDays[dayNumber]"
                      :key="index"
                      class="slot-item"
                    >
                      <span class="slot-time">{{ slot }}</span>
                      <button
                        type="button"
                        @click="removeSlotForDay(dayNumber, index)"
                        class="btn-remove-slot"
                      >
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <template v-if="scheduleMode === 'all_days'">
                <div class="slots-list" v-if="profile.schedules && profile.schedules.length > 0">
                  <div
                    v-for="(slot, index) in profile.schedules"
                    :key="index"
                    class="slot-item"
                  >
                    <span class="slot-time">{{ slot }}</span>
                    <button
                      type="button"
                      @click="removeTimeSlot(index)"
                      class="btn-remove-slot"
                    >
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p v-else class="no-slots">Chưa có lịch khám nào</p>
              </template>
            </div>
          </template>
          
          <template v-else>
            <div class="schedule-display">
              <!-- Show schedules by days if available -->
              <div v-if="scheduleMode === 'by_days' && Object.keys(schedulesWithDays).length > 0" class="schedules-by-day-display">
                <div v-for="(dayName, dayNumber) in daysOfWeek" :key="dayNumber">
                  <div v-if="schedulesWithDays[dayNumber] && schedulesWithDays[dayNumber].length > 0" class="day-schedule-display">
                    <h4>{{ dayName }} <span class="next-date">({{ getNextDateForDay(dayNumber) }})</span></h4>
                    <div class="slots-display">
                      <div
                        v-for="(slot, index) in schedulesWithDays[dayNumber]"
                        :key="index"
                        class="slot-display-item"
                      >
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ slot }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Show traditional schedules if available -->
              <div v-else-if="scheduleMode === 'all_days' && profile.schedules && profile.schedules.length > 0" class="slots-display">
                <div
                  v-for="(slot, index) in profile.schedules"
                  :key="index"
                  class="slot-display-item"
                >
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ slot }}
                </div>
              </div>

              <p v-else class="form-display no-schedules">Chưa có lịch khám</p>
            </div>
          </template>
        </div>
      </div>

      <div
        v-if="showSuccess"
        class="success-message"
      >
        <svg
          class="icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Thông tin bác sĩ đã được cập nhật thành công!</span>
      </div>
    </div>

    <!-- 👤 Giao diện bệnh nhân -->
    <div
      v-else
      class="profile-content"
    >
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img
            :src="getImageUrl(profile.avatar)"
            alt="Avatar"
            class="avatar"
          />
          <button
            v-if="isEditing"
            @click="triggerFileInput"
            class="avatar-edit-btn"
          >
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            style="display: none"
          />
        </div>
        <h2 class="user-name">{{ profile.name_u }}</h2>
        <p class="user-role">Bệnh nhân</p>
      </div>

      <div class="form-grid">
        <div
          class="form-group"
          v-for="(value, key) in userFields"
          :key="key"
        >
          <label class="form-label">{{ value.label }}</label>
          <!-- Province select -->
          <template v-if="isEditing && key === 'city_u'">
            <select
              v-model="selectedProvinceCode"
              @change="handleProvinceChange"
              class="form-input"
            >
              <option value="">-- Chọn tỉnh/thành --</option>
              <option
                v-for="prov in provinces"
                :key="prov.code"
                :value="prov.code"
              >
                {{ prov.name }}
              </option>
            </select>
          </template>

          <!-- District select -->
          <template v-else-if="isEditing && key === 'distr_u'">
            <select
              v-model="selectedDistrictCode"
              @change="handleDistrictChange"
              :disabled="!districts.length"
              class="form-input"
            >
              <option value="">-- Chọn quận/huyện --</option>
              <option
                v-for="dist in districts"
                :key="dist.code"
                :value="dist.code"
              >
                {{ dist.name }}
              </option>
            </select>
          </template>

          <!-- Ward select -->
          <template v-else-if="isEditing && key === 'ward_u'">
            <select
              v-model="selectedWardCode"
              @change="handleWardChange"
              :disabled="!wards.length"
              class="form-input"
            >
              <option value="">-- Chọn phường/xã --</option>
              <option
                v-for="ward in wards"
                :key="ward.code"
                :value="ward.code"
              >
                {{ ward.name }}
              </option>
            </select>
          </template>

          <!-- Special handling for date of birth -->
          <input
            v-else-if="isEditing && key === 'birth_u'"
            v-model="profile[key]"
            type="date"
            class="form-input"
            :max="getMaxBirthDate()"
          />
          <!-- Default input for other fields -->
          <template v-else-if="isEditing && key === 'gender_u'">
            <select v-model="profile.gender_u" class="form-input">
              <option value="">-- Chọn giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </template>
          
          <input
            v-else-if="isEditing"
            v-model="profile[key]"
            :type="value.type"
            class="form-input"
          />
          <p
            v-else
            class="form-display"
          >
            {{ profile[key] }}
          </p>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Địa chỉ đầy đủ</label>
          <p class="address-display">{{ fullAddress }}</p>
        </div>
      </div>

      <div
        v-if="showSuccess"
        class="success-message"
      >
        <svg
          class="icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Thông tin đã được cập nhật thành công!</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as vn from 'vietnam-provinces';

export default {
  name: 'ProfileView',
  data() {
    return {
      isEditing: false,
      showSuccess: false,
      profile: {},
      originalProfile: null,
      role: '',
      defaultAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      newImageFile: null, // 🆕 Lưu file ảnh mới
      // Địa chỉ VN
      provinces: [],
      districts: [],
      wards: [],
      selectedProvinceCode: '',
      selectedDistrictCode: '',
      selectedWardCode: '',
      specialties: [],
      hospitals: [],
      // Quản lý lịch khám
      startTime: '',
      endTime: '',
      // Schedule by days support
      scheduleMode: 'all_days',
      schedulesWithDays: {},
      daysOfWeek: {
        1: 'Thứ 2',
        2: 'Thứ 3', 
        3: 'Thứ 4',
        4: 'Thứ 5',
        5: 'Thứ 6',
        6: 'Thứ 7',
        7: 'Chủ nhật'
      },
      newSlot: {
        startTime: {},
        endTime: {}
      },
      userFields: {
        name_u: { label: 'Họ và tên', type: 'text' },
        email_u: { label: 'Email', type: 'email' },
        sdt_u: { label: 'Số điện thoại', type: 'tel' },
        birth_u: { label: 'Ngày sinh', type: 'date' },
        gender_u: { label: 'Giới tính', type: 'text' },
        city_u: { label: 'Tỉnh/Thành phố', type: 'text' },
        distr_u: { label: 'Quận/Huyện', type: 'text' },
        ward_u: { label: 'Xã/Phường', type: 'text' }
      },
      doctorFields: {
        dr_name: { label: 'Họ và tên', type: 'text' },
        dr_h_name: { label: 'Tên bệnh viện', type: 'text' },
        h_address: { label: 'Địa chỉ bệnh viện', type: 'text' },
        dr_description: { label: 'Mô tả', type: 'textarea' }
      }
    };
  },
  computed: {
    fullAddress() {
      return `${this.profile.ward_u || ''}, ${this.profile.distr_u || ''}, ${
        this.profile.city_u || ''
      }`;
    }
  },
  methods: {
    // ====== Địa chỉ: Province/District/Ward ======
    handleProvinceChange() {
      this.districts = vn.districts.filter((d) => d.province_code === this.selectedProvinceCode);
      this.wards = [];
      this.selectedDistrictCode = '';
      this.selectedWardCode = '';

      const selectedProvince = this.provinces.find((p) => p.code === this.selectedProvinceCode);
      this.profile.city_u = selectedProvince ? selectedProvince.name : '';
    },

    handleDistrictChange() {
      this.wards = vn.wards.filter((w) => w.district_code === this.selectedDistrictCode);
      this.selectedWardCode = '';

      const selectedDistrict = this.districts.find((d) => d.code === this.selectedDistrictCode);
      this.profile.distr_u = selectedDistrict ? selectedDistrict.name : '';
    },

    handleWardChange() {
      const selectedWard = this.wards.find((w) => w.code === this.selectedWardCode);
      this.profile.ward_u = selectedWard ? selectedWard.name : '';
    },
    
    // Date validation functions
    getMaxBirthDate() {
      return new Date().toISOString().split('T')[0];
    },
    
    validateBirthDate(birthDate) {
      if (!birthDate) return true; // Optional field
      
      const selectedDate = new Date(birthDate);
      const today = new Date();
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 120);
      
      if (selectedDate > today) {
        alert('Ngày sinh không thể ở tương lai');
        return false;
      }
      
      if (selectedDate < maxAge) {
        alert('Ngày sinh không hợp lệ (quá 120 tuổi)');
        return false;
      }
      
      return true;
    },
    async loadSpecialties() {
      try {
        const res = await axios.get('http://localhost:3000/api/specialties');
        this.specialties = Array.isArray(res.data) ? res.data : [];
        this.normalizeDoctorSpecialty();
      } catch (err) {
        console.error('❌ Lỗi tải chuyên khoa:', err);
        this.specialties = [];
      }
    },
    normalizeDoctorSpecialty() {
      if (this.profile.sp_id !== undefined && this.profile.sp_id !== null && this.profile.sp_id !== '') {
        this.profile.sp_id = String(this.profile.sp_id);
      } else {
        this.profile.sp_id = '';
      }
      this.updateDoctorSpecialtyName();
    },
    updateDoctorSpecialtyName() {
      if (!Array.isArray(this.specialties)) return;
      const selected = this.specialties.find((sp) => String(sp.id) === String(this.profile.sp_id));
      this.profile.specialty = selected ? selected.name : '';
    },
    
    async loadHospitals() {
      try {
        const res = await axios.get('http://localhost:3000/api/hospitals');
        this.hospitals = Array.isArray(res.data) ? res.data : [];
        // Không gọi normalizeDoctorHospitalId() ở đây, sẽ gọi sau khi load profile
      } catch (err) {
        console.error('❌ Lỗi tải danh sách bệnh viện:', err);
        this.hospitals = [];
      }
    },
    
    normalizeDoctorHospitalId() {
      console.log('🔍 Normalizing hospital ID:', {
        current_h_id: this.profile.h_id,
        current_dr_h_name: this.profile.dr_h_name,
        hospitals_count: this.hospitals.length
      });
      
      // Nếu có h_id trong profile
      if (this.profile.h_id !== undefined && this.profile.h_id !== null && this.profile.h_id !== '') {
        this.profile.h_id = String(this.profile.h_id);
        console.log('✅ Using existing h_id:', this.profile.h_id);
      } else if (this.profile.dr_h_name && this.hospitals.length > 0) {
        // Nếu không có h_id nhưng có dr_h_name, tìm h_id từ tên bệnh viện
        const foundHospital = this.hospitals.find(hospital => hospital.h_name === this.profile.dr_h_name);
        if (foundHospital) {
          this.profile.h_id = String(foundHospital.h_id);
          console.log('✅ Found hospital by name:', foundHospital.h_name, '-> ID:', this.profile.h_id);
        } else {
          this.profile.h_id = '';
          console.log('⚠️ Hospital not found by name:', this.profile.dr_h_name);
        }
      } else {
        this.profile.h_id = '';
        console.log('ℹ️ No h_id or dr_h_name to normalize');
      }
      this.updateDoctorHospitalInfo();
    },
    
    updateDoctorHospitalInfo() {
      if (!Array.isArray(this.hospitals)) return;
      console.log('🏥 Updating hospital info for h_id:', this.profile.h_id);
      
      const selected = this.hospitals.find((hospital) => String(hospital.h_id) === String(this.profile.h_id));
      if (selected) {
        console.log('✅ Found hospital:', selected.h_name);
        this.profile.dr_h_name = selected.h_name;
      } else if (this.profile.h_id) {
        // Chỉ clear dr_h_name nếu có h_id nhưng không tìm thấy hospital
        console.log('⚠️ Hospital not found for h_id:', this.profile.h_id);
        this.profile.dr_h_name = '';
      }
      // Nếu không có h_id, giữ nguyên dr_h_name hiện tại (không ghi đè)
      console.log('📝 Final dr_h_name:', this.profile.dr_h_name);
    },

    // ====== Quản lý lịch khám ======
    addTimeSlot() {
      if (!this.startTime || !this.endTime) {
        alert('Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc!');
        return;
      }

      // Validate time range
      if (this.startTime >= this.endTime) {
        alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!');
        return;
      }

      const newSlot = `${this.startTime} - ${this.endTime}`;
      
      // Check for duplicate
      if (this.profile.schedules && this.profile.schedules.includes(newSlot)) {
        alert('Khung giờ này đã tồn tại!');
        return;
      }

      // Initialize schedules array if not exists
      if (!this.profile.schedules) {
        this.profile.schedules = [];
      }

      this.profile.schedules.push(newSlot);
      
      // Reset input fields
      this.startTime = '';
      this.endTime = '';
    },

    removeTimeSlot(index) {
      if (this.profile.schedules && this.profile.schedules.length > index) {
        this.profile.schedules.splice(index, 1);
      }
    },

    // Functions for schedule by days
    addSlotForDay(dayNumber) {
      if (!this.newSlot.startTime[dayNumber] || !this.newSlot.endTime[dayNumber]) {
        return;
      }
      
      const slot = `${this.newSlot.startTime[dayNumber]} - ${this.newSlot.endTime[dayNumber]}`;
      
      if (!this.schedulesWithDays[dayNumber]) {
        this.schedulesWithDays[dayNumber] = [];
      }
      
      this.schedulesWithDays[dayNumber].push(slot);
      
      // Clear input fields
      this.newSlot.startTime[dayNumber] = '';
      this.newSlot.endTime[dayNumber] = '';
    },

    removeSlotForDay(dayNumber, index) {
      if (this.schedulesWithDays[dayNumber]) {
        this.schedulesWithDays[dayNumber].splice(index, 1);
        if (this.schedulesWithDays[dayNumber].length === 0) {
          delete this.schedulesWithDays[dayNumber];
        }
      }
    },

    // Get next date for specific day of week
    getNextDateForDay(dayOfWeek) {
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
    },

    async loadDoctorSchedules() {
      try {
        const token = localStorage.getItem('userToken');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const doctorId = decoded.id_u;

        console.log('🔍 Loading schedules for doctor:', doctorId);

        const response = await axios.get(`http://localhost:3000/api/doctors/by-user/${doctorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = response.data || {};
        // Nhiều API by-user không trả kèm schedules. Nếu có dr_id, gọi thêm API chi tiết để lấy schedules chuẩn.
        if (data.dr_id) {
          try {
            const detailRes = await axios.get(`http://localhost:3000/api/doctors/${data.dr_id}`);
            const detail = detailRes.data || {};

            const schedulesByDay = detail.schedulesByDay && Object.keys(detail.schedulesByDay).length > 0
              ? detail.schedulesByDay
              : (detail.schedulesWithDays && Object.keys(detail.schedulesWithDays).length > 0
                ? detail.schedulesWithDays
                : null);

            if (schedulesByDay) {
              this.scheduleMode = 'by_days';
              this.schedulesWithDays = schedulesByDay;
              this.profile.schedules = [];
              console.log('✅ Loaded schedules by days (via detail):', this.schedulesWithDays);
            } else if (Array.isArray(detail.schedules) && detail.schedules.length > 0) {
              this.scheduleMode = 'all_days';
              this.schedulesWithDays = {};
              this.profile.schedules = detail.schedules.map(s => typeof s === 'string' ? s : s.time_slot);
              console.log('✅ Loaded traditional schedules (via detail):', this.profile.schedules);
            } else {
              this.scheduleMode = 'all_days';
              this.profile.schedules = [];
              this.schedulesWithDays = {};
              console.log('ℹ️ No schedules found in detail, initialized empty');
            }
          } catch (e) {
            console.warn('⚠️ Cannot load doctor detail for schedules, fallback to minimal data', e);
            this.scheduleMode = 'all_days';
            this.profile.schedules = [];
            this.schedulesWithDays = {};
          }
        } else {
          // Trường hợp không có dr_id trong hồ sơ by-user
          const schedulesByDay = data.schedulesByDay && Object.keys(data.schedulesByDay).length > 0
            ? data.schedulesByDay
            : (data.schedulesWithDays && Object.keys(data.schedulesWithDays).length > 0
              ? data.schedulesWithDays
              : null);

          if (schedulesByDay) {
            this.scheduleMode = 'by_days';
            this.schedulesWithDays = schedulesByDay;
            this.profile.schedules = [];
            console.log('✅ Loaded schedules by days:', this.schedulesWithDays);
          } else if (Array.isArray(data.schedules) && data.schedules.length > 0) {
            this.scheduleMode = 'all_days';
            this.schedulesWithDays = {};
            this.profile.schedules = data.schedules.map(s => typeof s === 'string' ? s : s.time_slot);
            console.log('✅ Loaded traditional schedules:', this.profile.schedules);
          } else {
            this.scheduleMode = 'all_days';
            this.profile.schedules = [];
            this.schedulesWithDays = {};
            console.log('ℹ️ No schedules found, initialized empty arrays');
          }
        }
      } catch (error) {
        console.error('❌ Error loading doctor schedules:', error);
        this.profile.schedules = [];
        this.schedulesWithDays = {};
      }
    },

    async updateDoctorSchedules() {
      try {
        const token = localStorage.getItem('userToken');
        
        // Choose appropriate endpoint based on schedule mode
        let endpoint, data;
        
        if (this.scheduleMode === 'by_days') {
          // Use new endpoint for schedules with days
          endpoint = 'http://localhost:3000/api/doctors/profile/schedules-with-days';
          data = {
            schedulesWithDays: this.schedulesWithDays
          };
        } else {
          // Use old endpoint for traditional schedules
          endpoint = 'http://localhost:3000/api/doctors/profile/schedules';
          data = {
            schedules: this.profile.schedules || []
          };
        }
        
        const response = await axios.put(endpoint, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          console.log('✅ Schedules updated successfully');
          return true;
        }
      } catch (error) {
        console.error('❌ Error updating schedules:', error);
        alert(error.response?.data?.error || 'Không thể cập nhật lịch khám');
        return false;
      }
    },
    // 🆕 Xử lý hiển thị URL ảnh - Cải thiện logic load ảnh cũ
    getImageUrl(imagePath) {
      if (!imagePath) return this.defaultAvatar;

      // 🧩 Nếu là base64 (ảnh preview vừa chọn từ input)
      if (imagePath.startsWith('data:image')) {
        return imagePath;
      }

      // Nếu là URL đầy đủ (server đã trả về kèm BASE_URL)
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }

      // Nếu là đường dẫn tương đối (tránh duplicate BASE_URL)
      const baseUrl = 'http://localhost:3000';
      return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
    },

    // 🆕 Kích hoạt input file
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // 🆕 Xử lý upload ảnh với preview tức thì
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Kiểm tra loại và kích thước file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        event.target.value = ''; // Reset input
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB!');
        event.target.value = ''; // Reset input
        return;
      }

      // ✅ Lưu file để gửi lên khi ấn "Lưu"
      this.newImageFile = file;

      // ✅ Hiển thị preview ngay lập tức
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageField = this.role === 'doctor' ? 'image' : 'avatar';
        this.profile[imageField] = e.target.result; // Base64 preview
      };
      reader.readAsDataURL(file);
    },

    startEdit() {
      this.originalProfile = JSON.parse(JSON.stringify(this.profile));
      this.isEditing = true;
      this.newImageFile = null;
      // Reset file input
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    cancelEdit() {
      // ✅ Khôi phục dữ liệu gốc (bao gồm ảnh cũ)
      this.profile = JSON.parse(JSON.stringify(this.originalProfile));
      this.isEditing = false;
      this.newImageFile = null;
      // Reset file input
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    // 🔥 So sánh và chỉ gửi các trường đã thay đổi
    getChangedFields() {
      const changes = {};

      for (const key in this.profile) {
        // Bỏ qua các trường không cần thiết
        if (['id_u', 'role', 'email_u', 'specialty'].includes(key)) continue;

        if (this.profile[key] !== this.originalProfile[key]) {
          changes[key] = this.profile[key];
        }
      }

      return changes;
    },

    async saveProfile() {
      try {
        // Validate birth date if changed
        if (this.profile.birth_u && !this.validateBirthDate(this.profile.birth_u)) {
          return;
        }
        
        const token = localStorage.getItem('userToken');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const id = decoded.id_u;

        // 🔥 Chỉ lấy các trường đã thay đổi
        const changedData = this.getChangedFields();

        // Kiểm tra xem có thay đổi lịch khám hay không (chỉ cho bác sĩ)
        const schedulesChanged = this.role === 'doctor' && (
          JSON.stringify(this.profile.schedules) !== JSON.stringify(this.originalProfile.schedules) ||
          JSON.stringify(this.schedulesWithDays) !== JSON.stringify(this.originalProfile.schedulesWithDays || {})
        );

        // Nếu không có gì thay đổi và không có ảnh mới
        if (Object.keys(changedData).length === 0 && !this.newImageFile && !schedulesChanged) {
          alert('Không có thay đổi nào để lưu!');
          this.isEditing = false;
          return;
        }

        // 🆕 Tạo FormData để gửi tất cả dữ liệu một lần
        const formData = new FormData();
        
        // Thêm các trường đã thay đổi
        for (const key in changedData) {
          formData.append(key, changedData[key]);
        }
        
        // Thêm file ảnh nếu có
        if (this.newImageFile) {
          formData.append('avatarFile', this.newImageFile);
        }

        // 🔥 Gửi request cập nhật profile
        const response = await axios.put(`http://localhost:3000/api/users/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        // ✅ Nếu là bác sĩ và có thay đổi lịch khám, cập nhật riêng
        if (this.role === 'doctor' && schedulesChanged) {
          const scheduleUpdateSuccess = await this.updateDoctorSchedules();
          if (!scheduleUpdateSuccess) {
            // Nếu cập nhật lịch khám thất bại, vẫn cho phép lưu các thông tin khác
            console.warn('⚠️ Schedule update failed, but profile was saved');
          }
        }

        // ✅ Cập nhật profile với dữ liệu mới từ server (nếu có)
        if (response.data.updatedData) {
          Object.assign(this.profile, response.data.updatedData);
        }

        // Cập nhật lại originalProfile
        this.originalProfile = JSON.parse(JSON.stringify(this.profile));
        this.originalProfile.schedulesWithDays = JSON.parse(JSON.stringify(this.schedulesWithDays));

        this.isEditing = false;
        this.newImageFile = null;
        
        // Reset time inputs
        this.startTime = '';
        this.endTime = '';
        
        // Reset file input
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }

        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
        }, 3000);

        // ✅ Tải lại để đồng bộ URL ảnh từ server
        await this.loadProfile();

        // 🆕 Dispatch event để NavBar cập nhật avatar
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { 
            user: this.profile,
            avatarUpdated: !!this.newImageFile 
          }
        }));
        
      } catch (err) {
        console.error('❌ Lỗi khi lưu:', err);
        alert(err.response?.data?.message || 'Có lỗi khi lưu thông tin!');
      }
    },

    async loadProfile() {
      try {
        const token = localStorage.getItem('userToken');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const id = decoded.id_u;
        this.role = decoded.role;

        const res = await axios.get(`http://localhost:3000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.profile = res.data;
        
        // Khởi tạo schedules array nếu chưa có (cho bác sĩ)
        if (this.role === 'doctor' && !this.profile.schedules) {
          this.profile.schedules = [];
        }

        // Khởi tạo dữ liệu địa lý
        this.provinces = vn.getProvinces();
        // Map tên -> code
        const selectedProvince = this.provinces.find((p) => p.name === this.profile.city_u);
        if (selectedProvince) {
          this.selectedProvinceCode = selectedProvince.code;
          this.districts = vn.districts.filter((d) => d.province_code === this.selectedProvinceCode);
          const selectedDistrict = this.districts.find((d) => d.name === this.profile.distr_u);
          if (selectedDistrict) {
            this.selectedDistrictCode = selectedDistrict.code;
            this.wards = vn.wards.filter((w) => w.district_code === this.selectedDistrictCode);
            const selectedWard = this.wards.find((w) => w.name === this.profile.ward_u);
            if (selectedWard) this.selectedWardCode = selectedWard.code;
          }
        }

        if (this.role === 'doctor') {
          await this.loadSpecialties();
          await this.loadHospitals();
          // Sau khi load hospitals, normalize lại hospital ID
          this.normalizeDoctorHospitalId();
          // Load doctor schedules
          await this.loadDoctorSchedules();
        } else {
          this.specialties = [];
          this.hospitals = [];
        }

        this.originalProfile = JSON.parse(JSON.stringify(this.profile));
        this.originalProfile.schedulesWithDays = JSON.parse(JSON.stringify(this.schedulesWithDays));
      } catch (err) {
        console.error('Lỗi khi tải thông tin:', err);
      }
    }
  },
  mounted() {
    this.loadProfile();
  },
  watch: {
    'profile.sp_id': function () {
      this.updateDoctorSpecialtyName();
    },
    'profile.h_id': function () {
      this.updateDoctorHospitalInfo();
    }
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.6);
}

.btn-secondary {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(113, 128, 150, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(113, 128, 150, 0.6);
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.profile-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 0 0 20px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-top: none;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48px;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  object-fit: cover;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2px;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  border: 3px solid white;
}

.avatar-edit-btn:hover {
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.025em;
}

.user-role {
  color: #718096;
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
  padding: 6px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 4px;
}

.icon {
  width: 18px;
  height: 18px;
  color: #667eea;
}

.form-input {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  color: #2d3748;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
}

.form-input:hover {
  border-color: rgba(102, 126, 234, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.form-display {
  padding: 16px 20px;
  background: rgba(248, 250, 252, 0.8);
  border: 2px solid rgba(226, 232, 240, 0.5);
  border-radius: 16px;
  color: #2d3748;
  font-size: 16px;
  backdrop-filter: blur(10px);
  min-height: 56px;
  display: flex;
  align-items: center;
}

.address-display {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  color: #2d3748;
  font-size: 16px;
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.success-message {
  margin-top: 32px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  backdrop-filter: blur(20px);
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .header {
    padding: 24px 20px;
    border-radius: 16px 16px 0 0;
  }

  .header h1 {
    font-size: 2rem;
  }

  .btn {
    padding: 10px 20px;
    font-size: 13px;
  }

  .profile-content {
    padding: 24px 20px;
    border-radius: 0 0 16px 16px;
  }

  .avatar {
    width: 120px;
    height: 120px;
  }

  .avatar-edit-btn {
    padding: 10px;
    bottom: 4px;
    right: 4px;
  }

  .user-name {
    font-size: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .form-input,
  .form-display,
  .address-display {
    padding: 14px 16px;
    font-size: 15px;
  }

  .btn-group {
    flex-direction: column;
    gap: 8px;
  }

  .btn-group .btn {
    width: 100%;
  }
}

/* ====== Schedule Management Styles ====== */
.schedule-manager {
  margin-top: 12px;
}

.add-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.time-input {
  padding: 12px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #2d3748;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.3s ease;
  min-width: 120px;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.time-separator {
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  margin: 0 4px;
}

.btn-add-slot {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.btn-add-slot:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-add-slot:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.slots-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.slot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(72, 187, 120, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.slot-item:hover {
  border-color: rgba(72, 187, 120, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.1);
}

.slot-time {
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.btn-remove-slot {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-slot:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.btn-remove-slot .icon {
  width: 16px;
  height: 16px;
}

.no-slots {
  text-align: center;
  color: #718096;
  font-style: italic;
  padding: 20px;
  background: rgba(113, 128, 150, 0.1);
  border-radius: 12px;
  margin-top: 16px;
}

.schedule-display {
  margin-top: 12px;
}

.slots-display {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.slot-display-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(56, 161, 105, 0.1) 100%);
  border: 2px solid rgba(72, 187, 120, 0.2);
  border-radius: 12px;
  color: #2d3748;
  font-weight: 500;
  transition: all 0.3s ease;
}

.slot-display-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.2);
}

.slot-display-item .icon {
  width: 18px;
  height: 18px;
  color: #48bb78;
}

.no-schedules {
  text-align: center;
  color: #718096;
  font-style: italic;
}

@media (max-width: 768px) {
  .add-slot {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .time-input {
    min-width: auto;
  }

  .slots-list,
  .slots-display {
    grid-template-columns: 1fr;
  }

  .slot-item {
    padding: 10px 14px;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.75rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .user-name {
    font-size: 1.25rem;
  }

  .form-input,
  .form-display,
  .address-display {
    padding: 12px 14px;
    font-size: 14px;
  }

  .add-slot {
    padding: 16px;
  }

  .time-input {
    padding: 10px 12px;
    font-size: 15px;
  }
}

.schedule-mode-toggle {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
}

.schedule-mode-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
}

.schedule-mode-toggle input[type="radio"] {
  accent-color: #667eea;
}

.schedules-by-day {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
  margin-bottom: 16px;
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

.schedules-by-day-display {
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
}

.day-schedule-display {
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8ebef;
  border-radius: 6px;
}

.day-schedule-display:last-child {
  margin-bottom: 0;
}

.day-schedule-display h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
