<template>
  <div class="admin-users">
    <!-- Success/Error Notifications -->
    <div v-if="notification.show" :class="['notification', notification.type]">
      <div class="notification-content">
        <svg v-if="notification.type === 'success'" class="notification-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="notification-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ notification.message }}</span>
        <button @click="hideNotification" class="notification-close">×</button>
      </div>
    </div>

    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý người dùng</h1>
        <p>Tạo, chỉnh sửa và quản trị tài khoản hệ thống.</p>
      </div>
    </div>
    
    <div class="header">
      <div class="actions">
        <select v-model="filters.role" @change="loadUsers">
          <option value="all">Tất cả</option>
          <option value="user">User</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
        <input v-model="filters.search" @input="loadUsers" placeholder="Tìm theo tên, email, sđt" />
        <button @click="openCreate" class="primary-btn">+ Thêm người dùng</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Role</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id_u">
            <td>{{ u.id_u }}</td>
            <td>{{ u.name_u || '-' }}</td>
            <td>{{ u.email_u }}</td>
            <td>{{ u.sdt_u || '-' }}</td>
            <td><span class="role" :class="u.role">{{ u.role }}</span></td>
            <td>
              <button class="i-btn edit-btn"
                title="Chỉnh sửa" @click="openEdit(u)">
                <svg viewBox="0 0 16 16" width="18">
                  <rect x="3" y="10" width="8" height="2" fill="#437ef7" />
                  <rect x="6" y="7" width="2" height="5" fill="#437ef7" />
                  <rect transform="rotate(45,8,8)" x="7" y="3" width="2" height="8" fill="#437ef7" />
                </svg>
              </button> 
              <button class="i-btn delete-btn"
                title="Xóa" @click="remove(u)">
                <svg viewBox="0 0 16 16" width="18">
                  <rect x="5" y="5" width="6" height="8" fill="none" stroke="#dc2626" stroke-width="2" />
                  <rect x="3" y="3" width="10" height="2" fill="#dc2626" />
                  <rect x="7" y="7" width="2" height="4" fill="#dc2626" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modern Modal (match AdminSpecialties) -->
    <div v-if="showModal" class="modern-modal-overlay" @click.self="closeModal">
      <div class="modern-modal">
        <!-- Header with gradient and icon -->
        <div class="modern-modal-header">
          <div class="header-content">
            <div class="header-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5.121 17.804A1 1 0 015 17V7a2 2 0 012-2h5l4 4v8a2 2 0 01-2 2H7a2 2 0 01-1.879-1.196zM14 5v4h4" />
              </svg>
            </div>
            <div>
              <h2 class="modal-title">{{ form.id_u ? 'Cập nhật người dùng' : 'Thêm người dùng mới' }}</h2>
              <p class="modal-subtitle">{{ form.id_u ? 'Chỉnh sửa thông tin tài khoản' : 'Tạo tài khoản người dùng hệ thống' }}</p>
            </div>
          </div>
          <button type="button" class="close-button" @click="closeModal" :disabled="loading">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <form @submit.prevent="save" class="modern-modal-body">
          <div class="form-section">
            <!-- Row 1: Name + Email -->
            <div class="form-row">
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Tên đầy đủ <span class="required">*</span></span>
                </label>
                <input 
                  v-model="form.name_u" 
                  type="text"
                  class="modern-input"
                  :class="{ 'error': formErrors.name_u }"
                  placeholder="Nhập tên đầy đủ"
                  required
                />
                <div class="input-border"></div>
                <span v-if="formErrors.name_u" class="error-text">{{ formErrors.name_u }}</span>
              </div>
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Email <span class="required">*</span></span>
                </label>
                <input 
                  v-model="form.email_u" 
                  type="email"
                  class="modern-input"
                  :class="{ 'error': formErrors.email_u }"
                  placeholder="example@email.com"
                  required
                />
                <div class="input-border"></div>
                <span v-if="formErrors.email_u" class="error-text">{{ formErrors.email_u }}</span>
              </div>
            </div>

            <!-- Row 2: Phone + Role -->
            <div class="form-row">
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Số điện thoại</span>
                </label>
                <input 
                  v-model="form.sdt_u" 
                  type="tel"
                  class="modern-input"
                  placeholder="0123456789"
                />
                <div class="input-border"></div>
              </div>
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Vai trò <span class="required">*</span></span>
                </label>
                <select v-model="form.role" class="modern-input" @change="onRoleChange" required>
                  <option value="user">Người dùng</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <div class="input-border"></div>
              </div>
            </div>

            <!-- Doctor Selection -->
            <div v-if="form.role === 'doctor'" class="form-row">
              <div class="form-group full-width">
                <label class="modern-label">
                  <span class="label-text">Chọn bác sĩ liên kết <span class="required">*</span></span>
                </label>
                <DoctorPicker ref="doctorPicker" v-model="form.dr_id" :current-user-id="form.id_u" :inline="false" :required="true" class="full-row" />
 
                <div class="input-border"></div>
                <span v-if="formErrors.dr_id" class="error-text">{{ formErrors.dr_id }}</span>
              </div>
            </div>

            <!-- Row 3: Password + Birth -->
            <div class="form-row">
              <div class="form-group">
                <label class="modern-label">
  <span class="label-text">
    Mật khẩu
    <span v-if="!form.id_u" class="required">*</span>
  </span>
</label>

                <input 
                  v-model="form.password_u" 
                  type="password"
                  class="modern-input"
                  :class="{ 'error': formErrors.password_u }"
                  :placeholder="form.id_u ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'"
                  :required="!form.id_u"
                />
                <div class="input-border"></div>
                <span v-if="formErrors.password_u" class="error-text">{{ formErrors.password_u }}</span>
              </div>
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Ngày sinh</span>
                </label>
                <input v-model="form.birth_u" type="date" class="modern-input" />
                <div class="input-border"></div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <!-- Row 4: Gender + City -->
            <div class="form-row">
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Giới tính</span>
                </label>
                <select v-model="form.gender_u" class="modern-input">
                  <option value="">Không xác định</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                <div class="input-border"></div>
              </div>
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Tỉnh/Thành phố</span>
                </label>
                <input v-model="form.city_u" class="modern-input" type="text" placeholder="Ví dụ: TP. Hồ Chí Minh" />
                <div class="input-border"></div>
              </div>
            </div>

            <!-- Row 5: District + Ward -->
            <div class="form-row">
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Quận/Huyện</span>
                </label>
                <input v-model="form.distr_u" class="modern-input" type="text" placeholder="Ví dụ: Quận 1" />
                <div class="input-border"></div>
              </div>
              <div class="form-group">
                <label class="modern-label">
                  <span class="label-text">Phường/Xã</span>
                </label>
                <input v-model="form.ward_u" class="modern-input" type="text" placeholder="Ví dụ: Phường Bến Nghé" />
                <div class="input-border"></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modern-modal-footer">
            <button type="button" class="cancel-button" @click="closeModal" :disabled="loading">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hủy bỏ
            </button>
            <button type="submit" class="save-button" :disabled="loading">
              <svg v-if="loading" class="loading-spinner" width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/>
              </svg>
              <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ loading ? 'Đang lưu...' : (form.id_u ? 'Cập nhật' : 'Tạo mới') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../axios';
import DoctorPicker from '../components/DoctorPicker.vue';


export default {
  components: { DoctorPicker },
 
  name: 'AdminUsers',
  data() {
    return {
      users: [],
      doctors: [], // Danh sách bác sĩ để chọn
      filters: { role: 'all', search: '' },
      showModal: false,
      loading: false,
      form: { 
        id_u: null, 
        name_u: '', 
        email_u: '', 
        sdt_u: '', 
        role: 'user', 
        password_u: '', 
        birth_u: '', 
        gender_u: '', 
        city_u: '', 
        distr_u: '', 
        ward_u: '', 
        dr_id: '' 
      },
      formErrors: {},
      notification: {
        show: false,
        type: 'success', // 'success' or 'error'
        message: ''
      }
    };
  },
  mounted() {
    this.loadUsers();
    // DoctorPicker handles doctors fetching
    // this.loadDoctors();
  },
  methods: {
    async loadUsers() {
      try {
        const params = { role: this.filters.role, search: this.filters.search, page: 1, limit: 50 };
        const res = await axios.get('/admin/users', { params });
        this.users = res.data.users || [];
      } catch (error) {
        this.showNotification('error', 'Không thể tải danh sách người dùng');
        console.error('❌ Error loading users:', error);
      }
    },
    
    async loadDoctors() {
      try {
        const res = await axios.get('/doctors');
        this.doctors = res.data || [];
      } catch (error) {
        console.error('❌ Error loading doctors:', error);
        this.doctors = [];
      }
    },
    
    openCreate() {
      console.log('[AdminUsers] openCreate');
      this.resetForm();
      this.formErrors = {};
      this.showModal = true;
    },
    
    async openEdit(u) {
      console.log('[AdminUsers] openEdit input:', JSON.parse(JSON.stringify(u)));
      this.form = { 
        id_u: u.id_u, 
        name_u: u.name_u || '', 
        email_u: u.email_u || '', 
        sdt_u: u.sdt_u || '', 
        role: u.role, 
        password_u: '', 
        birth_u: u.birth_u || '', 
        gender_u: u.gender_u || '', 
        city_u: u.city_u || '', 
        distr_u: u.distr_u || '', 
        ward_u: u.ward_u || '', 
        dr_id: u.dr_id || '' 
      };
      this.formErrors = {};
      this.showModal = true;

      // đảm bảo DoctorPicker nạp và hiển thị bác sĩ cũ theo dr_id (nếu có)
      this.$nextTick(async () => {
        try {
          if (this.$refs.doctorPicker) {
            // nạp danh sách để có label, sau đó đảm bảo bác sĩ cũ có trong options
            await this.$refs.doctorPicker.searchDoctors?.('', 1000);
            if (this.form.dr_id) {
              await this.$refs.doctorPicker.ensureSelectedDoctorLoaded?.();
            }
          }
        } catch (_) {}
      });

      // Tự nạp bác sĩ đã liên kết cũ (ưu tiên theo dr_id có sẵn, fallback theo id_u)
      try {
        if (this.form.role === 'doctor') {
          // 1) Nếu user đã có dr_id, ưu tiên dùng luôn
          if (u.dr_id) {
            this.form.dr_id = String(u.dr_id);
            // Đảm bảo option tồn tại: nếu chưa có trong danh sách, nạp chi tiết theo dr_id
            if (!this.doctors.some(x => String(x.dr_id) === String(u.dr_id))) {
              try {
                const resById = await axios.get(`/doctors/${encodeURIComponent(u.dr_id)}`);
                const doc = Array.isArray(resById.data) ? resById.data[0] : resById.data;
                if (doc && doc.dr_id) {
                  this.doctors = [doc, ...this.doctors];
                }
              } catch (_) { /* ignore */ }
            }
          } else if (false) { // disabled by-user fallback; users list now includes dr_id via JOIN
            // 2) Nếu chưa có dr_id, thử lấy theo id_u
            const res = await axios.get(`/doctors/by-user/${this.form.id_u}`);
            const d = Array.isArray(res.data) ? res.data[0] : res.data;
            if (d && d.dr_id) {
              if (!this.doctors.some(x => String(x.dr_id) === String(d.dr_id))) {
                this.doctors = [d, ...this.doctors];
              }
              this.form.dr_id = String(d.dr_id);
            }
          }
        }
      } catch (e) {
        // Không có bác sĩ liên kết cũ hoặc API không trả về - giữ nguyên để admin chọn lại nếu cần
      }
    },
    
    onRoleChange() {
      // Reset dr_id khi đổi role
      if (this.form.role !== 'doctor') {
        this.form.dr_id = '';
      }
      // Clear validation error for dr_id if exists
      if (this.formErrors.dr_id) {
        delete this.formErrors.dr_id;
      }
    },
    
    closeModal() { 
      this.showModal = false; 
      this.resetForm();
      this.formErrors = {};
    },
    
    resetForm() {
      this.form = { 
        id_u: null, 
        name_u: '', 
        email_u: '', 
        sdt_u: '', 
        role: 'user', 
        password_u: '', 
        birth_u: '', 
        gender_u: '', 
        city_u: '', 
        distr_u: '', 
        ward_u: '', 
        dr_id: '' 
      };
    },
    
    validateForm() {
      this.formErrors = {};
      
      // Validate required fields
      if (!this.form.name_u.trim()) {
        this.formErrors.name_u = 'Tên là bắt buộc';
      }
      
      if (!this.form.email_u.trim()) {
        this.formErrors.email_u = 'Email là bắt buộc';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email_u)) {
        this.formErrors.email_u = 'Email không hợp lệ';
      }
      
      // Password validation for new users
      if (!this.form.id_u && !this.form.password_u.trim()) {
        this.formErrors.password_u = 'Mật khẩu là bắt buộc';
      } else if (this.form.password_u && this.form.password_u.length < 6) {
        this.formErrors.password_u = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      
      // Doctor role validation
      if (this.form.role === 'doctor' && !this.form.dr_id) {
        this.formErrors.dr_id = 'Vui lòng chọn bác sĩ liên kết';
      }
      
      return Object.keys(this.formErrors).length === 0;
    },
    
    async save() {
      if (!this.validateForm()) {
        this.showNotification('error', 'Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc');
        return;
      }

      this.loading = true;
      
      try {
        const payload = { 
          name_u: this.form.name_u.trim(), 
          email_u: this.form.email_u.trim(), 
          sdt_u: this.form.sdt_u.trim(), 
          role: this.form.role, 
          birth_u: this.form.birth_u, 
          gender_u: this.form.gender_u, 
          city_u: this.form.city_u.trim(), 
          distr_u: this.form.distr_u.trim(), 
          ward_u: this.form.ward_u.trim() 
        };
        
        // Thêm dr_id nếu role = doctor
        if (this.form.role === 'doctor' && this.form.dr_id) {
          payload.dr_id = this.form.dr_id;
        }
        
        if (this.form.password_u.trim()) {
          payload.password_u = this.form.password_u;
        }

        if (this.form.id_u) {
          // Update existing user
          await axios.put(`/admin/users/${this.form.id_u}`, payload);
          this.showNotification('success', 'Cập nhật thông tin người dùng thành công!');
        } else {
          // Create new user
          await axios.post('/admin/users', payload);
          this.showNotification('success', 'Tạo người dùng mới thành công!');
        }
        
        this.closeModal();
        await this.loadUsers();
        
      } catch (error) {
        console.error('❌ Error saving user:', error);
        
        if (error.response?.status === 400) {
          this.showNotification('error', error.response.data.message || 'Dữ liệu không hợp lệ');
        } else if (error.response?.status === 409) {
          this.showNotification('error', 'Email đã tồn tại trong hệ thống');
        } else {
          this.showNotification('error', 'Có lỗi xảy ra khi lưu thông tin người dùng');
        }
      } finally {
        this.loading = false;
      }
    },
    
    async remove(u) {
      if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${u.name_u || u.email_u}"?`)) return;
      
      try {
        await axios.delete(`/admin/users/${u.id_u}`);
        this.showNotification('success', 'Xóa người dùng thành công!');
        await this.loadUsers();
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        this.showNotification('error', 'Không thể xóa người dùng này');
      }
    },
    
    showNotification(type, message) {
      this.notification = {
        show: true,
        type,
        message
      };
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    },
    
    hideNotification() {
      this.notification.show = false;
    }
  }
};
</script>

<style scoped>
/* General Layout */
.admin-users { 
  padding: 24px; 
  max-width: 1200px; 
  margin: 0 auto;
}

/* Notifications */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
}

.notification.success {
  background: #10b981;
  color: white;
}

.notification.error {
  background: #ef4444;
  color: white;
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  margin-left: auto;
  padding: 0 4px;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Hero Section */
.hero { 
  background:linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 16px; 
  color: #fff; 
  padding: 28px 24px; 
  margin: 12px 0 20px; 
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); 
}
.hero-content h1 { 
  margin: 0 0 6px 0; 
  font-size: 1.8rem; 
  font-weight: 700; 
}
.hero-content p { 
  margin: 0; 
  opacity: 0.95; 
}

/* Header & Actions */
.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 16px; 
}
.actions { 
  display: flex; 
  gap: 12px; 
  align-items: center;
}
.actions select, .actions input { 
  padding: 10px 12px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  color: #374151;
}
.actions select:focus, .actions input:focus {
  outline: none;
  border-color: #4f46e5;
}
.primary-btn { 
  padding: 10px 16px; 
  background:linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #fff; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.primary-btn:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}

/* Table */
.table-wrap { 
  background: #fff; 
  border: 1px solid #e5e7eb; 
  border-radius: 12px; 
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #374151;
}
table { 
  width: 100%; 
  border-collapse: collapse; 
}
th, td { 
  padding: 16px; 
  border-bottom: 1px solid #f3f4f6; 
  text-align: left; 
}
th { 
  background: #f8fafc; 
  font-weight: 600; 
  color: #374151;
  font-size: 14px;
}
td {
  font-size: 14px;
}
.role { 
  padding: 4px 8px; 
  border-radius: 6px; 
  font-size: 12px; 
  text-transform: capitalize;
  font-weight: 500;
}
.role.user { 
  background: #eef2ff; 
  color: #3730a3; 
}
.role.doctor { 
  background: #dcfce7; 
  color: #166534; 
}
.role.admin { 
  background: #fee2e2; 
  color: #991b1b; 
}

/* Action Buttons */
.i-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  margin-right: 4px;
  transition: background-color 0.2s;
}
.i-btn:hover {
  background: #f3f4f6;
}
.edit-btn:hover {
  background: #e0f2fe;
}
.delete-btn:hover {
  background: #fef2f2;
}

/* Enhanced Modal */
.modal { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,.5); 
  display: grid; 
  place-items: center; 
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card { 
  background: #fff; 
  width: 700px; 
  max-width: 95vw; 
  max-height: 90vh;
  border-radius: 16px; 
  box-shadow: 0 25px 50px rgba(0,0,0,.25);
  animation: slideUp 0.3s ease-out;
  overflow-y: auto;
}

@keyframes slideUp {
  from { 
    transform: translateY(20px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Form Styling */
.modal-form {
  padding: 0 24px 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
  font-weight: 600;
}

input, select {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
}

input:focus, select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
}

.btn-cancel, .btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: #4f46e5;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #4338ca;
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Loading Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== 🎨 MODERN MODAL STYLES (match AdminSpecialties) ===== */
.modern-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modern-modal {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 780px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.modern-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.modern-modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
}

.header-content { display: flex; align-items: center; gap: 16px; z-index: 1; position: relative; }
.header-icon { background: rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 12px; backdrop-filter: blur(10px); }
.modal-title { font-size: 1.5rem; font-weight: 700; margin: 0; line-height: 1.2; }
.modal-subtitle { font-size: 0.9rem; opacity: 0.9; margin: 4px 0 0 0; font-weight: 400; }

.close-button {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  z-index: 1;
  position: relative;
}
.close-button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.25); transform: scale(1.05); }

.modern-modal-body { padding: 28px; overflow:auto; max-height: calc(90vh - 170px); }
.form-section { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: span 2; }

.modern-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 0.95rem; }
.label-text { display: flex; align-items: center; gap: 8px; }

.modern-input, .modern-textarea, select.modern-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  color: #374151;
}

.modern-input:focus, .modern-textarea:focus, select.modern-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.15), 0 0 0 3px rgba(102, 126, 234, 0.08);
}

.input-border { position: relative; height: 0; }
.error-text { color: #ef4444; font-size: 12px; margin-top: 4px; }

/* Footer */
.modern-modal-footer { background: #f8fafc; padding: 20px 28px; display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #e2e8f0; }
.cancel-button, .save-button { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; border: none; }
.cancel-button { background: #f1f5f9; color: #64748b; border: 2px solid #e2e8f0; }
.cancel-button:hover:not(:disabled) { background: #e2e8f0; color: #475569; transform: translateY(-1px); }
.save-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: 2px solid transparent; min-width: 140px; justify-content: center; }
.save-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4); }
.save-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.loading-spinner { animation: spin 1s linear infinite; }

/* Animations */
@keyframes modalSlideIn { from { opacity: 0; transform: scale(0.98) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* Responsive (modal) */
@media (max-width: 768px) {
  .modern-modal { width: 95%; margin: 20px; max-height: calc(100vh - 40px); }
  .modern-modal-footer { flex-direction: column; }
  .cancel-button, .save-button { width: 100%; justify-content: center; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-users {
    padding: 16px;
  }
  
  .actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-group.full-width {
    grid-column: span 1;
  }
  
  .modal-card {
    width: 95vw;
    margin: 10px;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  th, td {
    padding: 8px;
    font-size: 12px;
  }
}
.full-row { display:block; width:100%; }
.full-row .el-form-item { width:100%; }
.full-row .el-select, .full-row .el-input { width:100%; }
</style>
