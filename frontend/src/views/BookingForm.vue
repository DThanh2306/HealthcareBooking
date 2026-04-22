<template>
  <div class="booking-container">
    <!-- Thông tin bác sĩ -->
    <div class="doctor-info">
      <img
        class="doctor-photo"
        :src="doctor?.image || placeholderImage"
        :alt="doctor?.dr_name"
      />
      <div class="info-block">
        <div class="title">ĐẶT LỊCH KHÁM</div>
        <div class="doctor-name">{{ doctor?.dr_name || 'Tên bác sĩ' }}</div>
        <div class="doctor-time">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8v5l4 2"/>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ selectedTime }} - {{ formattedDate }}
        </div>
        <div class="doctor-hospital">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3z" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ doctor?.dr_h_name || 'Cơ sở y tế chưa cập nhật' }}
        </div>
        <div class="doctor-address">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 11.5A2.5 2.5 0 1 1 12 8a2.5 2.5 0 0 1 0 5.5Z"/>
          </svg>
          {{ doctor?.h_address || 'Địa chỉ chưa cập nhật' }}
        </div>
      </div>
    </div>

    <!-- Giá khám -->
    <div class="service-select">
      <label class="radio-service">
        <input
          type="radio"
          checked
        />
        <span>Giá khám {{ doctor?.specialty || '...' }}</span
        ><br />
        <span class="service-price">
          {{ doctor?.dr_price ? doctor.dr_price.toLocaleString() + 'đ' : 'Chưa cập nhật' }}
        </span>
      </label>
    </div>

    <!-- Thông tin người đặt -->
    <div class="form-block">
      <label>
        <span class="required">*</span> Họ tên bệnh nhân
        <input
          v-model="form.name"
          type="text"
          placeholder="Họ và tên bệnh nhân"
        />
      </label>

      <div class="gender-group">
        <label
          ><input
            type="radio"
            v-model="form.gender"
            value="Nam"
          />
          Nam</label
        >
        <label
          ><input
            type="radio"
            v-model="form.gender"
            value="Nữ"
          />
          Nữ</label
        >
      </div>

      <label>
        <span class="required">*</span>Số điện thoại
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Số điện thoại liên hệ"
        />
      </label>

      <label>
        <span class="required">*</span>Email
        <input
          v-model="form.email"
          type="email"
          placeholder="Email (nếu có)"
        />
      </label>

      <label>
        Ngày sinh
        <input
          v-model="form.dob"
          type="date"
          :max="getMaxBirthDate()"
        />
      </label>

      <!-- Địa chỉ -->
      <label>
        Tỉnh/Thành
        <select
          v-model="selectedProvinceCode"
          @change="handleProvinceChange"
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
      </label>

      <label>
        Quận/Huyện
        <select
          v-model="selectedDistrictCode"
          @change="handleDistrictChange"
          :disabled="!districts.length"
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
      </label>

      <label>
        Phường/Xã
        <select
          v-model="selectedWardCode"
          @change="handleWardChange"
          :disabled="!wards.length"
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
      </label>

      <label>
        Tổ / Khu / Thôn / Xóm
        <input
          v-model="form.to"
          type="text"
          placeholder="Tổ / Khu / Thôn / Xóm"
        />
      </label>

      <label>
        <span class="required">*</span>Lý do khám
        <textarea
          v-model="form.reason"
          rows="2"
          placeholder="Lý do khám"
        ></textarea>
      </label>

      <button
        class="btn-confirm"
        @click="submitForm"
      >
        Xác nhận đặt khám
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import * as vn from 'vietnam-provinces';

export default {
  name: 'BookingForm',
  data() {
    return {
      doctor: null,
      form: {
        name: '',
        gender: 'Nam',
        phone: '',
        email: '',
        dob: '',
        tinh: '',
        quan: '',
        xa: '',
        to: '',
        reason: ''
      },
      provinces: [],
      districts: [],
      wards: [],
      selectedProvinceCode: '',
      selectedDistrictCode: '',
      selectedWardCode: '',
      selectedDate: '',
      selectedTime: '',
      placeholderImage: 'https://placehold.co/74x74/png?text=Doctor'
    };
  },
  async mounted() {
    const route = useRoute();
    this.router = useRouter();
    const dr_id = route.query.dr_id;
    this.selectedDate = route.query.date;
    this.selectedTime = route.query.time;

    // Nếu slot quá khứ, cảnh báo và quay về trang chi tiết bác sĩ
    if (this.isPastSelectedSlot()) {
      alert('Không thể đặt khung giờ đã qua!');
      this.router.push(`/doctor/${dr_id}`);
      return;
    }

    // Nếu chưa đăng nhập, thông báo nhưng vẫn ở trang bookingform theo yêu cầu
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để đặt lịch. Vui lòng đăng nhập trước khi xác nhận.');
    }

    // ✅ Load thông tin bác sĩ
    try {
      const res = await axios.get(`http://localhost:3000/api/doctors/${dr_id}`);
      this.doctor = res.data;
    } catch (err) {
      alert('Không thể tải thông tin bác sĩ');
      console.error(err);
    }

    // ✅ Load danh sách tỉnh
    this.provinces = vn.getProvinces();

    // ✅ Tự động load thông tin người dùng đăng nhập
    this.loadUserProfile();
  },
  computed: {
    formattedDate() {
      const date = new Date(this.selectedDate);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  },
  methods: {
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('userToken');
        if (!token) return;

        const decoded = JSON.parse(atob(token.split('.')[1]));
        const id = decoded.id_u;

        const res = await axios.get(`http://localhost:3000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const user = res.data;

        // ✅ Gán dữ liệu user vào form
        this.form.name = user.name_u || '';
        this.form.gender = user.gender_u || 'Nam';
        this.form.phone = user.sdt_u || '';
        this.form.email = user.email_u || '';
        this.form.dob = user.birth_u || '';
        this.form.tinh = user.city_u || '';
        this.form.quan = user.distr_u || '';
        this.form.xa = user.ward_u || '';

        // ✅ Tự chọn lại các dropdown tỉnh / huyện / xã tương ứng
        const selectedProvince = this.provinces.find((p) => p.name === user.city_u);
        if (selectedProvince) {
          this.selectedProvinceCode = selectedProvince.code;
          this.districts = vn.districts.filter(
            (d) => d.province_code === this.selectedProvinceCode
          );

          const selectedDistrict = this.districts.find((d) => d.name === user.distr_u);
          if (selectedDistrict) {
            this.selectedDistrictCode = selectedDistrict.code;
            this.wards = vn.wards.filter((w) => w.district_code === this.selectedDistrictCode);

            const selectedWard = this.wards.find((w) => w.name === user.ward_u);
            if (selectedWard) this.selectedWardCode = selectedWard.code;
          }
        }
      } catch (err) {
        console.error('❌ Lỗi khi tải thông tin người dùng:', err);
      }
    },

    handleProvinceChange() {
      this.districts = vn.districts.filter((d) => d.province_code === this.selectedProvinceCode);
      this.wards = [];
      this.selectedDistrictCode = '';
      this.selectedWardCode = '';

      const selectedProvince = this.provinces.find((p) => p.code === this.selectedProvinceCode);
      this.form.tinh = selectedProvince ? selectedProvince.name : '';
    },

    handleDistrictChange() {
      this.wards = vn.wards.filter((w) => w.district_code === this.selectedDistrictCode);
      this.selectedWardCode = '';

      const selectedDistrict = this.districts.find((d) => d.code === this.selectedDistrictCode);
      this.form.quan = selectedDistrict ? selectedDistrict.name : '';
    },

    handleWardChange() {
      const selectedWard = this.wards.find((w) => w.code === this.selectedWardCode);
      this.form.xa = selectedWard ? selectedWard.name : '';
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

    validatePhone(phone) {
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      if (!phoneRegex.test(phone)) {
        alert('Số điện thoại không đúng định dạng (VD: 0912345678)');
        return false;
      }
      return true;
    },

    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Email không đúng định dạng');
        return false;
      }
      return true;
    },

    // Kiểm tra slot đã chọn có ở quá khứ không
    isPastSelectedSlot() {
      try {
        if (!this.selectedDate || !this.selectedTime) return false;
        const today = new Date();
        const sel = new Date(this.selectedDate);

        const selY = sel.getFullYear(), selM = sel.getMonth(), selD = sel.getDate();
        const nowY = today.getFullYear(), nowM = today.getMonth(), nowD = today.getDate();

        // Nếu ngày trong quá khứ
        if (sel < new Date(nowY, nowM, nowD)) return true;
        // Nếu ngày trong tương lai
        if (sel > new Date(nowY, nowM, nowD)) return false;

        // Cùng ngày: so với giờ hiện tại
        const match = String(this.selectedTime).match(/(\d{1,2}):(\d{2})/);
        if (!match) return false;
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const slotStart = new Date(selY, selM, selD, h, m, 0, 0);
        return slotStart.getTime() <= today.getTime();
      } catch {
        return false;
      }
    },

async submitForm() {
  const token = localStorage.getItem('userToken') || localStorage.getItem('token');

  if (!token) {
    alert('Bạn cần đăng nhập để đặt lịch.');

    // ✅ GIỮ redirect login (QUAN TRỌNG)
    const currentHref = this.$router.resolve({
      name: 'bookingform',
      query: { 
        dr_id: this.doctor?.dr_id || this.$route.query.dr_id, 
        date: this.selectedDate, 
        time: this.selectedTime 
      }
    }).href;

    this.$router.push({ 
      name: 'auth', 
      query: { redirect: encodeURIComponent(currentHref) } 
    });

    return;
  }

  const decoded = JSON.parse(atob(token.split('.')[1]));
  const id_u = decoded.id_u;

  // ✅ GIỮ check slot
  if (this.isPastSelectedSlot()) {
    alert('Không thể đặt khung giờ đã qua!');
    return;
  }

  // ✅ validate giữ nguyên
  if (!this.form.name || !this.form.phone || !this.form.reason) {
    alert('Vui lòng điền đầy đủ Họ tên, SĐT và Lý do khám.');
    return;
  }

  if (!this.validatePhone(this.form.phone)) return;
  if (this.form.email && !this.validateEmail(this.form.email)) return;
  if (this.form.dob && !this.validateBirthDate(this.form.dob)) return;

  // 🔥 payload gửi sang backend payment
  const payload = {
    ...this.form,
    dr_id: this.doctor?.dr_id,
    appointment_date: this.selectedDate,
    time_slot: this.selectedTime,
    id_u: id_u,
    amount: this.doctor?.dr_price // ⚠️ bắt buộc cho VNPay
  };

  try {
    const res = await axios.post(
      "http://localhost:3000/api/payment/vnpay/create",
      payload
    );

    window.location.href = res.data.payment_url;

  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
    alert('Không thể chuyển đến trang thanh toán');
  }
}
  }
};
</script>

<style scoped>
.booking-container {
  background: #fff;
  border-radius: 16px;
  padding: 28px 26px 22px 26px;
  max-width: 680px;
  margin: 28px auto;
  font-family: 'Segoe UI', Arial, sans-serif;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.08);
  border: 1px solid #eef2f7;
}
.doctor-info {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 16px;
}
.doctor-photo {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e6f0ff;
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.18);
}
.info-block {
  flex: 1;
}
.title {
  font-weight: 800;
  color: #1e3a8a;
  font-size: 13px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #1176eb 0%, #3b82f6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.doctor-name {
  color: #0f172a;
  font-weight: 800;
  margin: 0 0 2px 0;
  font-size: 20px;
}
.doctor-time {
  margin-bottom: 2px;
  color: #475569;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.doctor-hospital {
  margin-bottom: 2px;
  color: #334155;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.doctor-address {
  color: #64748b;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon { flex-shrink: 0; }
.service-select {
  margin: 16px 0 14px 0;
}
.radio-service {
  display: block;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px 8px 10px;
  font-size: 15px;
  color: #0f172a;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}
.radio-service input[type='radio'] {
  margin-right: 8px;
}
.service-price {
  color: #16a34a;
  font-weight: 700;
  font-size: 15px;
}
.who-book {
  margin: 10px 0;
}
.radio-option {
  margin-right: 20px;
  font-size: 15px;
}
.form-block {
  margin: 12px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-block label {
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}
.required {
  color: #ff2500;
}
input[type='text'],
input[type='email'],
input[type='tel'],
input[type='date'],
textarea {
  width: 100%;
  margin-top: 2px;
  margin-bottom: 6px;
  padding: 11px 12px;
  font-size: 15px;
  border-radius: 10px;
  border: 1.6px solid #e2e8f0;
  transition: all 0.2s ease;
  outline: none;
  background: #fff;
}
input:focus,
textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.gender-group {
  display: flex;
  gap: 28px;
  margin-left: 3px;
  margin-bottom: 6px;
}
.payment-method {
  margin: 20px 0 10px 0;
}
.title-sub {
  font-weight: 600;
  color: #2a7fe0;
  margin-bottom: 7px;
}
.radio-pay input[type='radio'] {
  margin-right: 7px;
}
.total-group {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 12px;
  padding: 16px 20px 12px 20px;
  margin-bottom: 14px;
  margin-top: 6px;
  border: 1px solid #e2e8f0;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  margin-bottom: 7px;
}
.total-row.total-final {
  font-weight: 800;
  color: #ef4444;
  font-size: 16px;
}
.text-red {
  color: #ca2b2b;
}
.note-bottom {
  color: #888;
  font-size: 13px;
  margin-top: 8px;
}
.note-block {
  background: #eaf5fb;
  color: #0d254e;
  border-radius: 10px;
  padding: 12px 18px 12px 16px;
  margin-bottom: 22px;
  font-size: 14.5px;
}
.note-title {
  font-weight: 600;
  color: #2a7fe0;
  font-size: 15.5px;
  margin-bottom: 6px;
}
.note-block ul {
  margin: 0 0 0 14px;
  padding: 0;
  list-style: disc;
}
.btn-confirm {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  padding: 13px 0;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  letter-spacing: 0.2px;
  transition: all 0.18s ease;
  margin-top: 8px;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
}
.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
}
@media (max-width: 600px) {
  .booking-container {
    padding: 14px 4vw 16px 4vw;
    max-width: 96vw;
  }
  .doctor-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
select {
  width: 100%;
  margin-top: 2px;
  margin-bottom: 6px;
  padding: 11px 12px;
  font-size: 15px;
  border-radius: 10px;
  border: 1.6px solid #e2e8f0;
  background-color: #fff;
  transition: all 0.2s ease;
}
select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
</style>
