<template>
  <div class="auth-container">
    <!-- Background Animation -->
    <div class="auth-background">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <!-- Main Content -->
    <div class="auth-content">
      <!-- Left Side - Branding -->
      <div class="auth-branding">
        <div class="brand-content">
          <div class="brand-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h1 class="brand-title">BookingCare</h1>
          <p class="brand-subtitle">Nền tảng đặt lịch khám bệnh hàng đầu</p>
          <div class="brand-features">
            <div class="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Bác sĩ chuyên môn cao</span>
            </div>
            <div class="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Đặt lịch nhanh chóng</span>
            </div>
            <div class="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>An toàn & bảo mật</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="auth-form-container">
        <div class="auth-card">
          <div class="auth-header">
            <h2 class="auth-welcome">Chào mừng bạn</h2>
            <p class="auth-subtitle">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
          </div>

          <el-tabs
            v-model="activeTab"
            class="auth-tabs"
          >
        <!-- Login -->
        <el-tab-pane
          label="Đăng nhập"
          name="login"
        >
          <el-form
            :model="loginForm"
            label-position="top"
          >
            <el-form-item label="Email">
              <el-input
                v-model="loginForm.email_u"
                placeholder="Nhập email"
                clearable
              />
            </el-form-item>
            <el-form-item label="Mật khẩu">
              <el-input
                v-model="loginForm.password_u"
                placeholder="Nhập mật khẩu"
                type="password"
                show-password
                clearable
              />
            </el-form-item>
            <el-button
              type="primary"
              @click="handleLogin"
              class="auth-btn"
              round
              block
            >
              Đăng nhập
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- Register -->
        <el-tab-pane
          label="Đăng ký"
          name="register"
        >
          <el-form
            :model="registerForm"
            label-position="top"
          >
            <el-form-item label="Họ tên">
              <el-input
                v-model="registerForm.name_u"
                placeholder="Nhập họ tên"
                clearable
              />
            </el-form-item>
            <el-form-item label="Email">
              <el-input
                v-model="registerForm.email_u"
                placeholder="Nhập email"
                clearable
              />
            </el-form-item>
            <el-form-item label="Mật khẩu">
              <el-input
                v-model="registerForm.password_u"
                placeholder="Nhập mật khẩu"
                type="password"
                show-password
                clearable
              />
            </el-form-item>
            <!-- Trường mới: Ngày sinh -->
            <el-form-item label="Ngày sinh">
              <el-date-picker
                v-model="registerForm.birth_u"
                type="date"
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledBirthDate"
                clearable
              />
            </el-form-item>
            <!-- Trường mới: Số điện thoại -->
            <el-form-item label="Số điện thoại">
              <el-input
                v-model="registerForm.sdt_u"
                placeholder="Nhập số điện thoại"
                type="tel"
                clearable
              />
            </el-form-item>
            <!-- Trường mới: Giới tính -->
            <el-form-item label="Giới tính">
              <el-select
                v-model="registerForm.gender_u"
                placeholder="Chọn giới tính"
                clearable
              >
                <el-option
                  label="Nam"
                  value="Nam"
                />
                <el-option
                  label="Nữ"
                  value="Nữ"
                />
              </el-select>
            </el-form-item>
            <!-- Trường mới: Địa chỉ (Tỉnh/Thành phố) -->
            <el-form-item label="Tỉnh/Thành phố">
              <el-select
                v-model="selectedProvinceCode"
                placeholder="-- Chọn tỉnh/thành phố --"
                @change="handleProvinceChange"
                clearable
              >
                <el-option
                  v-for="prov in provinces"
                  :key="prov.code"
                  :label="prov.name"
                  :value="prov.code"
                />
              </el-select>
            </el-form-item>
            <!-- Trường mới: Quận/Huyện -->
            <el-form-item label="Quận/Huyện">
              <el-select
                v-model="selectedDistrictCode"
                placeholder="-- Chọn quận/huyện --"
                @change="handleDistrictChange"
                :disabled="!districts.length"
                clearable
              >
                <el-option
                  v-for="dist in districts"
                  :key="dist.code"
                  :label="dist.name"
                  :value="dist.code"
                />
              </el-select>
            </el-form-item>
            <!-- Trường mới: Xã/Phường -->
            <el-form-item label="Xã/Phường">
              <el-select
                v-model="selectedWardCode"
                placeholder="-- Chọn xã/phường --"
                @change="handleWardChange"
                :disabled="!wards.length"
                clearable
              >
                <el-option
                  v-for="ward in wards"
                  :key="ward.code"
                  :label="ward.name"
                  :value="ward.code"
                />
              </el-select>
            </el-form-item>
            <el-button
              type="success"
              @click="handleRegister"
              class="auth-btn"
              round
              block
            >
              Đăng ký
            </el-button>
          </el-form>
        </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as vn from 'vietnam-provinces'; // Import thư viện vietnam-provinces

const activeTab = ref('login');
const router = useRouter();
const route = useRoute();

const loginForm = ref({ email_u: '', password_u: '' });
const registerForm = ref({
  name_u: '',
  email_u: '',
  password_u: '',
  birth_u: '', // Ngày sinh
  sdt_u: '', // Số điện thoại
  gender_u: '', // Giới tính
  city_u: '', // Tỉnh/Thành phố
  distr_u: '', // Quận/Huyện
  ward_u: '' // Xã/Phường
});

// Data cho địa chỉ (tương tự trang booking)
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);
const selectedProvinceCode = ref('');
const selectedDistrictCode = ref('');
const selectedWardCode = ref('');

// Load provinces khi component mount
onMounted(() => {
  provinces.value = vn.getProvinces();
});

// Handlers cho địa chỉ (tương tự trang booking)
const handleProvinceChange = () => {
  districts.value = vn.districts.filter((d) => d.province_code === selectedProvinceCode.value);
  wards.value = [];
  selectedDistrictCode.value = '';
  selectedWardCode.value = '';

  const selectedProvince = provinces.value.find((p) => p.code === selectedProvinceCode.value);
  registerForm.value.city_u = selectedProvince ? selectedProvince.name : '';
};

const handleDistrictChange = () => {
  wards.value = vn.wards.filter((w) => w.district_code === selectedDistrictCode.value);
  selectedWardCode.value = '';

  const selectedDistrict = districts.value.find((d) => d.code === selectedDistrictCode.value);
  registerForm.value.distr_u = selectedDistrict ? selectedDistrict.name : '';
};

const handleWardChange = () => {
  const selectedWard = wards.value.find((w) => w.code === selectedWardCode.value);
  registerForm.value.ward_u = selectedWard ? selectedWard.name : '';
};

// Date validation functions
const disabledBirthDate = (time) => {
  // Disable future dates and dates more than 120 years ago
  const today = new Date();
  const maxAge = new Date();
  maxAge.setFullYear(today.getFullYear() - 120);
  return time.getTime() > today.getTime() || time.getTime() < maxAge.getTime();
};

const validateBirthDate = (birthDate) => {
  if (!birthDate) return true; // Optional field
  
  const selectedDate = new Date(birthDate);
  const today = new Date();
  const maxAge = new Date();
  maxAge.setFullYear(today.getFullYear() - 120);
  
  if (selectedDate > today) {
    ElMessage.error('Ngày sinh không thể ở tương lai');
    return false;
  }
  
  if (selectedDate < maxAge) {
    ElMessage.error('Ngày sinh không hợp lệ (quá 120 tuổi)');
    return false;
  }
  
  return true;
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phoneRegex.test(phone)) {
    ElMessage.error('Số điện thoại không đúng định dạng (VD: 0912345678)');
    return false;
  }
  return true;
};

const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    ElMessage.error('Email không đúng định dạng');
    return false;
  }
  return true;
};

const handleLogin = async () => {
  try {
    const res = await axios.post('/auth/login', loginForm.value);
    const token = res.data.token;

    localStorage.setItem('userToken', token);

    function parseJwt(token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch {
        return {};
      }
    }

    const payload = parseJwt(token);

    localStorage.setItem('userId', payload.id_u);
    localStorage.setItem('userName', payload.name_u);
    localStorage.setItem('userRole', payload.role);

    // Thông báo toàn app rằng trạng thái đăng nhập đã thay đổi
    window.dispatchEvent(new Event('authChanged'));

    const redirect = route.query.redirect ? decodeURIComponent(route.query.redirect) : null;

    if (payload.role === 'admin') {
      router.push('/admin');
    } else if (redirect && payload.role !== 'doctor') {
      // Chỉ cho phép quay lại trang BookingForm đối với user/patient
      router.push(redirect);
    } else if (payload.role === 'doctor') {
      router.push('/doctor/appointments');
    } else {
      router.push('/');
    }

    ElMessage.success('Đăng nhập thành công');
  } catch (err) {
    ElMessage.error(err.response?.data?.error || 'Lỗi đăng nhập');
  }
};

const handleRegister = async () => {
  try {
    // Basic required fields validation
    if (!registerForm.value.name_u || !registerForm.value.email_u || !registerForm.value.password_u) {
      ElMessage.error('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
      return;
    }
    
    // Email validation
    if (!validateEmail(registerForm.value.email_u)) {
      return;
    }
    
    // Phone validation (if provided)
    if (registerForm.value.sdt_u && !validatePhone(registerForm.value.sdt_u)) {
      return;
    }
    
    // Birth date validation
    if (!validateBirthDate(registerForm.value.birth_u)) {
      return;
    }
    
    // Gửi toàn bộ registerForm, bao gồm các trường địa chỉ
    await axios.post('/auth/register', registerForm.value);
    ElMessage.success('Đăng ký thành công. Mời đăng nhập.');
    activeTab.value = 'login';
  } catch (err) {
    ElMessage.error(err.response?.data?.error || 'Lỗi đăng ký');
  }
};
</script>

<style scoped>
.auth-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);

}

/* Background Animation */
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 20%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  bottom: 10%;
  right: 20%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

/* Main Content */
.auth-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px;
}

/* Left Side - Branding */
.auth-branding {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-branding::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  padding: 60px 40px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.brand-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 40px;
  line-height: 1.6;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  opacity: 0.9;
}

.feature-item svg {
  flex-shrink: 0;
}

/* Right Side - Form */
.auth-form-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-welcome {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Tabs Styling */
.auth-tabs {
  --el-tabs-header-height: 50px;
}

.auth-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.auth-tabs :deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  padding: 0 20px;
}

.auth-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
}

.auth-tabs :deep(.el-tabs__active-bar) {
  background-color: #667eea;
  height: 3px;
}

/* Form Styling */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #e5e7eb;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.el-input__inner) {
  font-size: 1rem;
  color: #374151;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-date-picker) {
  width: 100%;
}

/* Button Styling */
.auth-btn {
  margin-top: 20px;
  font-weight: 600;
  font-size: 1rem;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* Responsive Design */
@media (max-width: 968px) {
  .auth-content {
    grid-template-columns: 1fr;
    margin: 10px;
  }
  
  .auth-branding {
    padding: 40px 20px;
  }
  
  .brand-content {
    padding: 40px 20px;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .brand-features {
    display: none;
  }
  
  .auth-form-container {
    padding: 40px 20px;
  }
}

@media (max-width: 576px) {
  .auth-content {
    margin: 5px;
    border-radius: 16px;
  }
  
  .auth-branding {
    padding: 30px 15px;
  }
  
  .brand-title {
    font-size: 1.75rem;
  }
  
  .auth-welcome {
    font-size: 1.5rem;
  }
  
  .auth-form-container {
    padding: 30px 15px;
  }
}
</style>
