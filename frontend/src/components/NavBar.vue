<script setup>
import { useRouter } from 'vue-router';
import { ref, computed, onMounted, watchEffect, onUnmounted } from 'vue';
import { ElMessage, ElBadge, ElPopover } from 'element-plus';
import axios from '../axios.js';

const router = useRouter();
const user = ref({ name_u: '', role: '', avatar: '', image: '' });

const searchKeyword = ref('');

function handleSearch() {
  if (!searchKeyword.value.trim()) return;

  router.push({
    name: 'search',
    query: { q: searchKeyword.value }
  });
}

// Notification state
const notifications = ref([]);
const unreadCount = ref(0);
const notificationLoading = ref(false);
const showNotifications = ref(false);
const notificationMarkingId = ref(null);
let notificationInterval = null;

// 🆕 Change password modal state
const showChangePasswordModal = ref(false);
const changePasswordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const changePasswordLoading = ref(false);
const showPasswords = ref({
  current: false,
  new: false,
  confirm: false
});
const formErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Reactive trạng thái đăng nhập để tự cập nhật UI khi login/logout
const isLoggedIn = ref(!!localStorage.getItem('userToken'));
function updateAuthState() {
  isLoggedIn.value = !!localStorage.getItem('userToken');
}


// Computed property để check nếu là doctor
const isDoctor = computed(() => {
  return user.value.role === 'doctor';
});

function syncUserFromLocalStorage() {
  user.value.name_u = localStorage.getItem('userName') || '';
  user.value.role = localStorage.getItem('userRole') || '';
}

// 🆕 Load thông tin user đầy đủ từ server
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.id_u;
    
    const response = await axios.get(`/users/${userId}`);
    const userData = response.data;
    
    user.value.name_u = userData.dr_name || userData.name_u || '';
    user.value.role = userData.role || '';
    user.value.avatar = userData.avatar || '';
    user.value.image = userData.image || '';
    
    // 🔄 Cập nhật localStorage để đồng bộ
    localStorage.setItem('userName', user.value.name_u);
    localStorage.setItem('userRole', user.value.role);
    
    // 🆕 Start notification polling after profile is loaded
    if (isDoctor.value && isLoggedIn.value) {
      fetchNotifications();
      if (notificationInterval) clearInterval(notificationInterval);
      notificationInterval = setInterval(fetchNotifications, 30000);
    }
  } catch (error) {
    console.error('Lỗi khi load profile:', error);
    syncUserFromLocalStorage(); // Fallback
  }
}

// 🆕 Xử lý URL avatar
function getUserAvatarUrl() {
  const avatarPath = user.value.role === 'doctor' ? user.value.image : user.value.avatar;
  
  if (!avatarPath) return null;
  
  // Nếu đã là URL đầy đủ
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Nếu là đường dẫn tương đối
  const baseUrl = 'http://localhost:3000';
  return avatarPath.startsWith('/') ? `${baseUrl}${avatarPath}` : `${baseUrl}/${avatarPath}`;
}

onMounted(() => {
  // Cập nhật trạng thái auth ban đầu
  updateAuthState();

  // Load user profile đầy đủ nếu đã đăng nhập
  if (isLoggedIn.value) {
    loadUserProfile();
  } else {
    syncUserFromLocalStorage();
  }
  
  // 🆕 Notification polling is now started in loadUserProfile after role is determined
  
  // 🆕 Listen for profile update events và auth change
  window.addEventListener('profileUpdated', handleProfileUpdate);
  window.addEventListener('authChanged', handleAuthChanged);
});

// 🆕 Handle profile update event
function handleProfileUpdate() {
  if (isLoggedIn.value) {
    loadUserProfile();
  }
}

// 🆕 Handle global auth change
function handleAuthChanged() {
  updateAuthState();
  if (isLoggedIn.value) {
    loadUserProfile();
  } else {
    // Reset user info when logged out
    user.value = { name_u: '', role: '', avatar: '', image: '' };
    notifications.value = [];
    unreadCount.value = 0;
  }
  // Restart polling based on new role/state
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  if (isDoctor.value && isLoggedIn.value) {
    fetchNotifications();
    notificationInterval = setInterval(fetchNotifications, 30000);
  }
}

// 🆕 Validation functions
function validateCurrentPassword() {
  if (!changePasswordForm.value.currentPassword) {
    formErrors.value.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    return false;
  }
  formErrors.value.currentPassword = '';
  return true;
}

function validateNewPassword() {
  const password = changePasswordForm.value.newPassword;
  if (!password) {
    formErrors.value.newPassword = 'Vui lòng nhập mật khẩu mới';
    return false;
  }
  if (password.length < 6) {
    formErrors.value.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    return false;
  }
  if (password === changePasswordForm.value.currentPassword) {
    formErrors.value.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    return false;
  }
  formErrors.value.newPassword = '';
  return true;
}

function validateConfirmPassword() {
  const confirm = changePasswordForm.value.confirmPassword;
  const newPass = changePasswordForm.value.newPassword;
  if (!confirm) {
    formErrors.value.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    return false;
  }
  if (confirm !== newPass) {
    formErrors.value.confirmPassword = 'Mật khẩu xác nhận không khớp';
    return false;
  }
  formErrors.value.confirmPassword = '';
  return true;
}

// 🆕 Toggle password visibility
function togglePasswordVisibility(field) {
  showPasswords.value[field] = !showPasswords.value[field];
}

// 🆕 Open change password modal
function openChangePasswordModal() {
  showChangePasswordModal.value = true;
  resetPasswordForm();
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// 🆕 Close change password modal
function closeChangePasswordModal() {
  showChangePasswordModal.value = false;
  resetPasswordForm();
  // Restore body scroll
  document.body.style.overflow = '';
}

// 🆕 Reset password form
function resetPasswordForm() {
  changePasswordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  formErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showPasswords.value = {
    current: false,
    new: false,
    confirm: false
  };
}

// 🆕 Handle change password
async function handleChangePassword() {
  try {
    // Validate all fields
    const isCurrentValid = validateCurrentPassword();
    const isNewValid = validateNewPassword();
    const isConfirmValid = validateConfirmPassword();

    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
      return;
    }

    changePasswordLoading.value = true;

    const token = localStorage.getItem('userToken');
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.id_u;

    const { currentPassword, newPassword, confirmPassword } = changePasswordForm.value;

    await axios.put(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword
    });

    ElMessage.success('Đổi mật khẩu thành công');
    closeChangePasswordModal();

  } catch (error) {
    console.error('Error changing password:', error);
    ElMessage.error(error.response?.data?.message || 'Có lỗi khi đổi mật khẩu');
  } finally {
    changePasswordLoading.value = false;
  }
}

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  // 🆕 Cleanup event listener
  window.removeEventListener('profileUpdated', handleProfileUpdate);
  window.removeEventListener('authChanged', handleAuthChanged);
});

// Theo dõi thay đổi khi localStorage thay đổi thủ công
watchEffect(() => {
  syncUserFromLocalStorage();
  
  // Restart polling when user role changes
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  if (isDoctor.value && isLoggedIn.value) {
    fetchNotifications();
    notificationInterval = setInterval(fetchNotifications, 30000);
  }
});

function goToHomepage() {
  router.push({ name: 'homepage' });
}

function goToSearchPage() {
  router.push({ name: 'search' });
}

function goToAdminpage() {
  router.push({ name: 'adminoverview' });
}

function goToAppointment() {
  router.push({ name: 'myappointment' });
}

function goToDoctorAppointments() {
  router.push({ name: 'doctor-appointments' });
}

function goToProfileUser() {
  router.push({ name: 'my' });
}

function goToAIDoctor() {
  router.push({ name: 'ai-doctor' });
}

function goToListDoctor() {
  router.push({ name: 'listdoctor' });
}

function goToSpecialties() {
  router.push({ name: 'specialties' });
}

function goToHospitals() {
  router.push({ name: 'hospitals' });
}

function goToLogin() {
  router.push('/auth');
}

// Notification functions
async function fetchNotifications() {
  if (!isDoctor.value || !isLoggedIn.value) return;
  
  try {
    notificationLoading.value = true;
    const response = await axios.get('/doctor/notifications');
    if (response.data.success) {
      notifications.value = response.data.notifications;
      unreadCount.value = notifications.value.filter(n => n.status === 'unread').length;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    notificationLoading.value = false;
  }
}

async function markNotificationRead(id) {
  notificationMarkingId.value = id;
  try {
    await axios.patch(`/doctor/notifications/${id}/read`);
    // Update local state
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.status = 'read';
      unreadCount.value = notifications.value.filter(n => n.status === 'unread').length;
    }
    ElMessage.success('Đã đánh dấu đã đọc');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    ElMessage.error('Không thể đánh dấu đã đọc');
  } finally {
    notificationMarkingId.value = null;
  }
}

async function acknowledgeNotification(id) {
  notificationMarkingId.value = id;
  try {
    await axios.patch(`/doctor/notifications/${id}/acknowledge`);
    // Update local state
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.status = 'acknowledged';
      unreadCount.value = notifications.value.filter(n => n.status === 'unread').length;
    }
    ElMessage.success('Đã xác nhận thông báo');
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    ElMessage.error('Không thể xác nhận thông báo');
  } finally {
    notificationMarkingId.value = null;
  }
}

function getNotificationTypeText(type) {
  const typeTexts = {
    'low_rating': 'Cảnh báo đánh giá thấp',
    'improvement_needed': 'Cần cải thiện',
    'critical_rating': 'Cảnh báo nghiêm trọng',
    'feedback_reminder': 'Nhắc nhở phản hồi',
    'general': 'Thông báo chung'
  };
  return typeTexts[type] || 'Thông báo';
}

function getStatusText(status) {
  const statusTexts = {
    'unread': 'Chưa đọc',
    'read': 'Đã đọc',
    'acknowledged': 'Đã xác nhận'
  };
  return statusTexts[status] || 'Không xác định';
}

function getStatusTagType(status) {
  const tagTypes = {
    'unread': 'danger',
    'read': 'warning',
    'acknowledged': 'success'
  };
  return tagTypes[status] || 'info';
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('vi-VN');
}

function goToNotifications() {
  router.push({ name: 'doctor-appointments' });
  showNotifications.value = false;
}

async function logout() {
  try {
    // Clear notification interval
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
    
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');

    // Cập nhật trạng thái auth và phát sự kiện để các component khác biết
    updateAuthState();
    window.dispatchEvent(new Event('authChanged'));

    ElMessage.success('Đã đăng xuất');
    // Ở lại trang hiện tại nếu không phải trang bắt buộc đăng nhập
    const currentPath = router.currentRoute.value.path;
    const isProtected = currentPath.startsWith('/admin') || currentPath.startsWith('/doctor/appointments');
    if (isProtected) {
      router.push('/');
    }
    // Nếu không protected thì không chuyển trang
  } catch {
    ElMessage.error('Lỗi khi đăng xuất');
  }
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-left">
        <!-- Logo -->
        <div
          class="logo-container"
          @click="goToHomepage"
        >
          <div class="logo-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle
                cx="12"
                cy="7"
                r="4"
              />
            </svg>
          </div>
          <span class="logo-text">
            <span class="logo-primary">Booking</span>
            <span class="logo-secondary">Care</span>
          </span>
        </div>

        <!-- Category Menu -->
        <ul class="nav-links">
          <li class="nav-item" @click="goToSpecialties">Chuyên khoa</li>
          <li class="nav-item" @click="goToHospitals">Bệnh viện</li>
          <li
            class="nav-item"
            @click="goToListDoctor"
          >
            Bác sĩ
          </li>
          <li
            v-if="isLoggedIn"
            class="nav-item nav-item-ai"
            @click="goToAIDoctor"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style="margin-right: 6px"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
              />
            </svg>
            Bác sĩ AI
          </li>
        </ul>
      </div>

      <div class="navbar-middle">
        <div class="searchbox">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm bác sĩ..."
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <div class="navbar-right">
        <!-- Nút đăng nhập khi chưa đăng nhập -->
        <div v-if="!isLoggedIn" class="login-section">
          <button class="login-btn" @click="goToLogin">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Đăng nhập
          </button>
        </div>

        <!-- Menu cho user đã đăng nhập -->
        <template v-else>
          <div
            class="navbar-action"
            v-if="user.role === 'admin'"
            @click="goToAdminpage"
            title="Quản lý"
          >
          <div class="action-icon-wrapper">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
              />
            </svg>
          </div>
          <span class="action-label">Quản lý</span>
        </div>

        <div
          class="navbar-action"
          v-if="user.role !== 'doctor'"
          @click="goToAppointment"
          title="Lịch khám của tôi"
        >
          <div class="action-icon-wrapper">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                ry="2"
              />
              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
              />
              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              />
              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
              />
            </svg>
          </div>
          <span class="action-label">Lịch khám</span>
        </div>

        <div
          class="navbar-action"
          v-if="user.role === 'doctor'"
          @click="goToDoctorAppointments"
          title="Lịch khám (Bác sĩ)"
        >
          <div class="action-icon-wrapper">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <span class="action-label">Lịch bác sĩ</span>
        </div>

        <!-- Notification Bell for Doctors -->
        <el-popover
          v-if="user.role === 'doctor'"
          placement="bottom-end"
          trigger="click"
          :width="500"
          v-model:visible="showNotifications"
        >
          <template #reference>
            <div class="navbar-action notification-bell" title="Thông báo">
              <div class="action-icon-wrapper">
                <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ 'notification-active': unreadCount > 0 }"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </el-badge>
              </div>
              <span class="action-label">Thông báo</span>
            </div>
          </template>

          <!-- Notification Panel Content -->
          <div class="notification-panel">
            <div class="notification-header">
              <h4>🔔 Thông báo cảnh báo</h4>
              <el-button 
                size="small" 
                type="primary" 
                text 
                @click="fetchNotifications"
                :loading="notificationLoading"
              >
                Làm mới
              </el-button>
            </div>

            <div v-if="notificationLoading" class="notification-loading">
              Đang tải thông báo...
            </div>

            <div v-else-if="!notifications.length" class="notification-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>Chưa có cảnh báo nào từ quản trị viên.</p>
            </div>

            <div v-else class="notification-list">
              <div 
                v-for="notification in notifications" 
                :key="notification.id"
                :class="['notification-item', notification.status, `severity-${notification.severity}`]"
              >
                <div class="notification-main">
                  <div class="notification-meta">
                    <div class="notification-type-wrapper">
                      <span :class="['notification-type', notification.severity]">
                        {{ getNotificationTypeText(notification.type) }}
                      </span>
                      <span v-if="notification.alert_level > 1" class="alert-level">
                        Cấp {{ notification.alert_level }}
                      </span>
                    </div>
                    <span class="notification-date">
                      {{ formatDateTime(notification.created_at) }}
                    </span>
                  </div>
                  <div class="notification-message-full">
                    <p>{{ notification.message }}</p>
                  </div>
                  <div 
                    class="notification-rating" 
                    v-if="notification.average_rating !== null && notification.average_rating !== undefined"
                  >
                    <span class="rating-text">Điểm hiện tại:</span>
                    <span class="rating-value">{{ Number(notification.average_rating).toFixed(1) }} ⭐</span>
                    <span v-if="notification.total_ratings" class="rating-count">
                      ({{ notification.total_ratings }} đánh giá)
                    </span>
                  </div>
                </div>
                <div class="notification-actions">
                  <el-tag size="small" :type="getStatusTagType(notification.status)">
                    {{ getStatusText(notification.status) }}
                  </el-tag>
                  <div class="notification-buttons">
                    <el-button
                      v-if="notification.status === 'unread'"
                      size="small"
                      type="primary"
                      plain
                      :loading="notificationMarkingId === notification.id"
                      @click="markNotificationRead(notification.id)"
                    >
                      Đánh dấu đã đọc
                    </el-button>
                    <el-button
                      v-if="notification.status === 'read'"
                      size="small"
                      type="success"
                      plain
                      :loading="notificationMarkingId === notification.id"
                      @click="acknowledgeNotification(notification.id)"
                    >
                      Xác nhận đã biết
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-popover>

        <el-dropdown
          trigger="click"
          placement="bottom-end"
        >
          <div class="navbar-action user-action">
            <div class="user-avatar">
              <!-- 🆕 Hiển thị ảnh avatar thật nếu có -->
              <img 
                v-if="getUserAvatarUrl()" 
                :src="getUserAvatarUrl()" 
                :alt="user.name_u || 'Avatar'"
                class="avatar-image"
              />
              <!-- Fallback SVG icon nếu không có avatar -->
              <svg
                v-else
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                />
              </svg>
            </div>
            <span class="action-label user-name">{{ user.name_u || 'Tài khoản' }}</span>
            <svg
              class="dropdown-arrow"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfileUser">
                <div class="dropdown-item-content">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                    />
                  </svg>
                  <span>Hồ sơ của tôi</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item @click="openChangePasswordModal">
                <div class="dropdown-item-content">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>Đổi mật khẩu</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item
                divided
                @click="logout"
              >
                <div class="dropdown-item-content logout-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line
                      x1="21"
                      y1="12"
                      x2="9"
                      y2="12"
                    />
                  </svg>
                  <span>Đăng xuất</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        </template>
      </div>
    </div>

    <!-- 🆕 Change Password Modal với giao diện đẹp -->
    <div
      v-if="showChangePasswordModal"
      class="modal-overlay"
      @click.self="closeChangePasswordModal"
    >
      <div class="change-password-modal">
        <!-- Header -->
        <div class="dialog-header">
          <div class="dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="dialog-title">
            <h3>Đổi mật khẩu</h3>
            <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
          </div>
          <button class="close-btn" @click="closeChangePasswordModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

      <div class="password-form">
        <!-- Current Password -->
        <div class="form-group">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
            </svg>
            Mật khẩu hiện tại <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              v-model="changePasswordForm.currentPassword"
              :type="showPasswords.current ? 'text' : 'password'"
              :class="['form-input', { 'error': formErrors.currentPassword }]"
              placeholder="Nhập mật khẩu hiện tại"
              @blur="validateCurrentPassword"
              @input="formErrors.currentPassword = ''"
              @keyup.enter="handleChangePassword"
              required
            />
            <button 
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility('current')"
            >
              <svg v-if="showPasswords.current" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div v-if="formErrors.currentPassword" class="error-message">
            {{ formErrors.currentPassword }}
          </div>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Mật khẩu mới <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              v-model="changePasswordForm.newPassword"
              :type="showPasswords.new ? 'text' : 'password'"
              :class="['form-input', { 'error': formErrors.newPassword }]"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              @blur="validateNewPassword"
              @input="formErrors.newPassword = ''"
              @keyup.enter="handleChangePassword"
              required
            />
            <button 
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility('new')"
            >
              <svg v-if="showPasswords.new" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div v-if="formErrors.newPassword" class="error-message">
            {{ formErrors.newPassword }}
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Xác nhận mật khẩu mới <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              v-model="changePasswordForm.confirmPassword"
              :type="showPasswords.confirm ? 'text' : 'password'"
              :class="['form-input', { 'error': formErrors.confirmPassword }]"
              placeholder="Nhập lại mật khẩu mới"
              @blur="validateConfirmPassword"
              @input="formErrors.confirmPassword = ''"
              @keyup.enter="handleChangePassword"
              required
            />
            <button 
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility('confirm')"
            >
              <svg v-if="showPasswords.confirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div v-if="formErrors.confirmPassword" class="error-message">
            {{ formErrors.confirmPassword }}
          </div>
        </div>

        <div class="security-tips">
          <div class="tips-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16l4-4-4-4M8 12h8"/>
            </svg>
            <span>Mẹo bảo mật</span>
          </div>
          <ul class="tips-list">
            <li>Sử dụng ít nhất 6 ký tự</li>
            <li>Kết hợp chữ hoa, chữ thường và số</li>
            <li>Không sử dụng thông tin cá nhân</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-actions">
        <button 
          class="btn btn-secondary"
          @click="closeChangePasswordModal"
          :disabled="changePasswordLoading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Hủy bỏ
        </button>
        <button 
          class="btn btn-primary"
          @click="handleChangePassword"
          :disabled="changePasswordLoading"
        >
          <svg 
            v-if="changePasswordLoading"
            class="loading-spinner"
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <svg 
            v-else
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ changePasswordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
        </button>
      </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  width: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  min-height: 72px;
  gap: 24px;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.3s ease;
  padding: 4px 8px;
  border-radius: 12px;
}

.logo-container:hover {
  transform: translateY(-2px);
  background: rgba(102, 126, 234, 0.05);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.logo-text {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.logo-primary {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-secondary {
  color: #175457;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.nav-item:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
}

.nav-item.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.12);
}

.nav-item-ai {
    background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item-ai:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(88, 80, 236, 0.45);
}

.navbar-middle {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 500px;
  min-width: 300px;
}

.searchbox {
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 18px;
  height: 44px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.searchbox:focus-within {
  border-color: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.searchbox svg {
  margin-right: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.searchbox:focus-within svg {
  color: #667eea;
}

.searchbox input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  background: transparent;
  width: 100%;
  color: #1e293b;
  flex: 1;
}

.searchbox input::placeholder {
  color: #94a3b8;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.navbar-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
}

.navbar-action:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  transform: translateY(-1px);
}

.action-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transition: all 0.3s ease;
}

.navbar-action:hover .action-icon-wrapper {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.action-label {
  white-space: nowrap;
}

.user-action {
  padding: 6px 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
      background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 🆕 Style cho avatar image */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-action:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: #94a3b8;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.user-action:hover .dropdown-arrow {
  color: #667eea;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.dropdown-item-content svg {
  color: #64748b;
}

.logout-item {
  color: #ef4444;
}

.logout-item svg {
  color: #ef4444;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .nav-links {
    gap: 2px;
  }

  .nav-item {
    padding: 10px 14px;
    font-size: 0.9rem;
  }

  .action-label {
    display: none;
  }

  .navbar-action {
    padding: 8px;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
    gap: 16px;
  }

  .navbar-left {
    gap: 16px;
  }

  .logo-text {
    font-size: 20px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
  }

  .nav-links {
    display: none;
  }

  .navbar-middle {
    min-width: 200px;
    max-width: 100%;
  }

  .searchbox input::placeholder {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    min-height: 64px;
    padding: 0 12px;
  }

  .logo-text {
    font-size: 18px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .navbar-middle {
    min-width: 150px;
  }

  .searchbox {
    padding: 0 12px;
    height: 40px;
  }

  .searchbox input {
    font-size: 0.85rem;
  }

  .navbar-action {
    padding: 6px;
  }

  .action-icon-wrapper,
  .user-avatar {
    width: 32px;
    height: 32px;
  }
}

/* Login Button Styles */
.login-section {
  display: flex;
  align-items: center;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
}

/* Notification Bell Styles */
.notification-bell {
  position: relative;
}

.notification-active {
  animation: bellRing 2s infinite;
  color: #f59e0b;
}

@keyframes bellRing {
  0%, 50%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(10deg); }
  20%, 40% { transform: rotate(-10deg); }
}

.notification-panel {
  padding: 0;
  max-height: 600px;
  overflow-y: auto;
  width: 100%;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
}

.notification-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.notification-loading,
.notification-empty {
  padding: 32px 16px;
  text-align: center;
  color: #9ca3af;
}

.notification-empty svg {
  margin-bottom: 12px;
}

.notification-empty p {
  margin: 0;
  font-size: 14px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.notification-item.severity-critical {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.notification-item.severity-high {
  background: #fef3c7;
  border-left: 4px solid #f97316;
}

.notification-item.severity-medium {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.notification-main {
  flex: 1;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.notification-type-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notification-type {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.notification-type.low {
  color: #1d4ed8;
  background: #dbeafe;
}

.notification-type.medium {
  color: #2563eb;
  background: #bfdbfe;
}

.notification-type.high {
  color: #ea580c;
  background: #fed7aa;
}

.notification-type.critical {
  color: #dc2626;
  background: #fecaca;
}

.alert-level {
  font-size: 11px;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.notification-date {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.notification-message-full {
  margin: 8px 0;
}

.notification-message-full p {
  margin: 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
}

.notification-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.rating-text {
  color: #6b7280;
}

.rating-value {
  color: #f59e0b;
  font-weight: 600;
}

.rating-count {
  color: #9ca3af;
}

.notification-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.notification-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 🎨 Change Password Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
}

.change-password-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 540px;
  width: auto;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  margin: auto;
  position: relative;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  flex-shrink: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.dialog-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.dialog-title p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.password-form {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-label svg {
  color: #667eea;
  flex-shrink: 0;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  box-sizing: border-box;
  color: #1e293b;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: #fefefe;
}

.form-input:hover {
  border-color: #cbd5e1;
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.error-message {
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.security-tips {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #059669;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #065f46;
}

.tips-list li {
  font-size: 13px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ffffff;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive for modal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .change-password-modal {
    min-width: 280px;
    max-width: 100%;
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .dialog-header {
    padding: 16px 20px;
    gap: 12px;
  }
  
  .dialog-title h3 {
    font-size: 18px;
  }
  
  .dialog-title p {
    font-size: 13px;
  }
  
  .password-form {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .dialog-actions {
    padding: 12px 20px;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .change-password-modal {
    min-width: 260px;
    margin: 5px;
    max-height: calc(100vh - 10px);
  }
  
  .dialog-header {
    flex-direction: column;
    text-align: center;
    padding: 16px;
    gap: 8px;
  }
  
  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  
  .dialog-icon {
    width: 40px;
    height: 40px;
  }
  
  .password-form {
    padding: 16px;
  }
  
  .dialog-actions {
    flex-direction: column-reverse;
    gap: 8px;
    padding: 12px 16px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (min-width: 769px) {
  .change-password-modal {
    width: 480px;
  }
}
</style>
