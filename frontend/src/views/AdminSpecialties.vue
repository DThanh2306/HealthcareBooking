<template>
  <div class="admin-page">
    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý chuyên khoa</h1>
        <p>Tạo, chỉnh sửa và quản lý danh sách chuyên khoa.</p>
      </div>
    </div>
    

    <div class="header-row">
      <div class="actions" style="margin-left: 4px; width: 100%; justify-content: space-between;">
        <input v-model="search" class="search" type="text" placeholder="Tìm chuyên khoa theo tên..." />
        <button class="add-btn" @click="openCreate">
          <span class="icon">＋</span> Thêm mới
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="list-header">
        <span>Danh sách chuyên khoa</span>
        <span class="muted">Tổng: {{ filteredSpecialties.length }}</span>
      </div>

      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <div v-if="loading" class="loading-state">Đang tải dữ liệu...</div>

      <table v-else-if="filteredSpecialties.length" class="hospital-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên chuyên khoa</th>
            <th>Mô tả chuyên khoa</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredSpecialties" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.description || '—' }}</td>
            
            <td class="act-group">
              
              <button
                class="i-btn"
                title="Edit"
                @click="openEdit(item)"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                >
                  <rect
                    x="3"
                    y="10"
                    width="8"
                    height="2"
                    fill="#437ef7"
                  />
                  <rect
                    x="6"
                    y="7"
                    width="2"
                    height="5"
                    fill="#437ef7"
                  />
                  <rect
                    transform="rotate(45,8,8)"
                    x="7"
                    y="3"
                    width="2"
                    height="8"
                    fill="#437ef7"
                  />
                </svg>
              </button>
              <button
                class="i-btn"
                title="Delete"
                @click="deleteSpecialty(item)"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                >
                  <rect
                    x="5"
                    y="5"
                    width="6"
                    height="8"
                    fill="none"
                    stroke="#dc2626"
                    stroke-width="2"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="10"
                    height="2"
                    fill="#dc2626"
                  />
                  <rect
                    x="7"
                    y="7"
                    width="2"
                    height="4"
                    fill="#dc2626"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <p>Chưa có chuyên khoa nào. Hãy thêm chuyên khoa đầu tiên của bạn.</p>
      </div>
    </div>

    <!-- 🎨 Modern Specialty Form Modal -->
    <div v-if="showForm" class="modern-modal-overlay" @click.self="closeForm">
      <div class="modern-modal">
        <!-- Header với gradient đẹp -->
        <div class="modern-modal-header">
          <div class="header-content">
            <div class="header-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 class="modal-title">{{ isEdit ? 'Cập nhật chuyên khoa' : 'Thêm chuyên khoa mới' }}</h2>
              <p class="modal-subtitle">{{ isEdit ? 'Chỉnh sửa thông tin chuyên khoa' : 'Tạo chuyên khoa y tế mới' }}</p>
            </div>
          </div>
          <button type="button" class="close-button" @click="closeForm" :disabled="saving">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

   
        <form @submit.prevent="submitForm" class="modern-modal-body">
          <div class="form-section">
            <div class="input-group">
              <label class="modern-label">
                <span class="label-text">Tên chuyên khoa *</span>
                <span class="label-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="modern-input"
                placeholder="Ví dụ: Tim mạch, Nhi khoa, Da liễu..."
                required
                :disabled="saving"
                autocomplete="off"
              />
              <div class="input-border"></div>
            </div>

            <div class="input-group">
              <label class="modern-label">
                <span class="label-text">Mô tả chuyên khoa</span>
                <span class="label-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </span>
              </label>
              <textarea
                v-model="form.description"
                rows="4"
                class="modern-textarea"
                placeholder="Mô tả chi tiết về chuyên khoa này (tùy chọn)..."
                :disabled="saving"
              ></textarea>
              <div class="input-border"></div>
            </div>
          </div>

          <!-- Error message với animation -->
          <div v-if="formError" class="error-message">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formError }}
          </div>
        </form>

        <!-- Footer với buttons đẹp -->
        <div class="modern-modal-footer">
          <button
            type="button"
            class="cancel-button"
            @click="closeForm"
            :disabled="saving"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Hủy bỏ
          </button>
          <button
            type="submit"
            class="save-button"
            :disabled="saving || !form.name.trim()"
            @click="submitForm"
          >
            <svg v-if="saving" class="loading-spinner" width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/>
            </svg>
            <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M5 13l4 4L19 7" />
            </svg>
            {{ saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from '../axios';

const specialties = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const formError = ref('');
const search = ref('');

const showForm = ref(false);
const isEdit = ref(false);
const form = ref({
  id: null,
  name: '',
  description: ''
});

function resetForm() {
  form.value = {
    id: null,
    name: '',
    description: ''
  };
  formError.value = '';
}

async function fetchSpecialties() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get('/specialties');
    specialties.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('❌ Load specialties error:', err);
    error.value =
      err.response?.data?.error || 'Không thể tải danh sách chuyên khoa.';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  isEdit.value = false;
  showForm.value = true;
}

function openEdit(item) {
  form.value = {
    id: item.id,
    name: item.name,
    description: item.description || ''
  };
  formError.value = '';
  isEdit.value = true;
  showForm.value = true;
}

function closeForm() {
  if (saving.value) return;
  showForm.value = false;
  resetForm();
}

async function submitForm() {
  formError.value = '';
  const payload = {
    name: form.value.name?.trim(),
    description: form.value.description?.trim() || ''
  };

  if (!payload.name) {
    formError.value = 'Tên chuyên khoa là bắt buộc.';
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value && form.value.id) {
      await axios.put(`/specialties/${form.value.id}`, payload);
    } else {
      await axios.post('/specialties', payload);
    }
    await fetchSpecialties();
    closeForm();
  } catch (err) {
    console.error('❌ Save specialty error:', err);
    formError.value =
      err.response?.data?.error || 'Không thể lưu chuyên khoa. Vui lòng thử lại.';
  } finally {
    saving.value = false;
  }
}

async function deleteSpecialty(item) {
  if (
    !confirm(
      `Bạn có chắc muốn xóa chuyên khoa "${item.name}"? Hành động này không thể hoàn tác.`
    )
  ) {
    return;
  }
  try {
    await axios.delete(`/specialties/${item.id}`);
    specialties.value = specialties.value.filter((sp) => sp.id !== item.id);
  } catch (err) {
    console.error('❌ Delete specialty error:', err);
    alert(err.response?.data?.error || 'Không thể xóa chuyên khoa.');
  }
}

const filteredSpecialties = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return specialties.value;
  return specialties.value.filter((item) => {
    const name = item.name?.toLowerCase() || '';
    const desc = item.description?.toLowerCase() || '';
    return name.includes(keyword) || desc.includes(keyword);
  });
});

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(() => {
  fetchSpecialties();
});
</script>

<style scoped>
body {
  background: #f5f6fa;
}
.admin-page {
  padding: 32px;
  background: #f5f6fa;
  min-height: 100vh;
}
.hero { background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%); border-radius: 16px; color: #fff; padding: 28px 24px; margin: 12px 0 20px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); }
.hero-content h1 { margin: 0 0 6px 0; font-size: 1.8rem; font-weight: 700; }
.hero-content p { margin: 0; opacity: 0.95; }
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
h2 { margin: 0; font-size: 2rem; font-weight: 700; color: #000000; }
.title-wrap .sub { color: #6b7280; margin-top: 4px; font-size: .95rem; }
.actions { display: flex; align-items: center; gap: 12px; }
.search { height: 36px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 12px; min-width: 260px; background: #f3f6fb; color: #111827;  }
.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background:linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  outline: none;
  border-radius: 6px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px 0 #437ef732;
  transition: background 0.2s;
  cursor: pointer;
}
.add-btn:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}
.add-btn .icon {
  font-size: 18px;
}
.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0px 2px 16px 0px #e4eaee;
  padding: 0 0 30px 0;
  margin: 0 auto;
  max-width: 1250px;
}
.list-header { display:flex; justify-content:space-between; align-items:center; color:#111827; font-weight:600; font-size:1.1rem; padding:18px 24px 14px 24px; border-radius:12px 12px 0 0; background:#f9fafb; border-bottom:1px solid #eef2ff; }
.list-header .muted { color:#6b7280; font-weight:500; }
.form {
  display: flex;
  gap: 10px;
  margin: 20px 24px 8px 24px;
}
.form input {
  flex: 1 1 150px;
  padding: 8px 12px;
  border-radius: 5px;
  border: 1px solid #d7def0;
  font-size: 1rem;
}
.form button {
  padding: 7px 16px;
  border: none;
  border-radius: 5px;
  background: #437ef7;
  color: #fff;
  font-weight: 600;
  margin-right: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.form button[type='button'] {
  background: #eee;
  color: #666;
}
.hospital-table {
  margin: 0 24px;
  width: calc(100% - 48px);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px #f8fafb;
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}
.hospital-table thead th {
  background: #f5f7fa;
  color: #4b5563;
  font-weight: 600;
  font-size: 15px;
  border: 0;
  padding: 12px 11px;
  text-align: left;
}
.hospital-table tbody td {
  border-top: 1px solid #edf1f9;
  font-size: 15px;
  color: #374151;
  padding: 13px 10px;
  vertical-align: middle;
  background: #fff;
}
.hospital-table tr:last-child td {
  border-bottom: none;
}
.act-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.i-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  display: inline-block;
}
.i-btn svg,
.i-btn img {
  vertical-align: middle;
}
.hospital-table img {
  height: 32px;
  width: auto;
  border-radius: 4px;
  background: #eee;
}

/* ===== 🎨 MODERN MODAL STYLES ===== */
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
  max-width: 520px;
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

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
  position: relative;
}

.header-icon {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(10px);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 4px 0 0 0;
  font-weight: 400;
}

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

.close-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.modern-modal-body {
  padding: 32px 28px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group {
  position: relative;
}

.modern-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
}

.label-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  opacity: 0.6;
}

.modern-input, .modern-textarea {
  width: 100%;
  padding: 16px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  color: #111827;
}

.modern-input:focus, .modern-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  transform: translateY(-2px);
  box-shadow: 
    0 10px 25px -5px rgba(102, 126, 234, 0.25),
    0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modern-input::placeholder, .modern-textarea::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.modern-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.5;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: all 0.3s ease;
  transform: translateX(-50%);
  border-radius: 2px;
}

.modern-input:focus + .input-border,
.modern-textarea:focus + .input-border {
  width: 100%;
}

.error-message {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-left: 4px solid #ef4444;
  color: #dc2626;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  font-weight: 500;
  animation: errorSlideIn 0.3s ease;
}

.modern-modal-footer {
  background: #f8fafc;
  padding: 20px 28px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
}

.cancel-button, .save-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.cancel-button {
  background: #f1f5f9;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.cancel-button:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}

.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid transparent;
  min-width: 120px;
  justify-content: center;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* ===== 🎬 ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes errorSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 📱 RESPONSIVE ===== */
@media (max-width: 640px) {
  .modern-modal {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .modern-modal-header, .modern-modal-body, .modern-modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .modal-title {
    font-size: 1.25rem;
  }
  
  .modern-modal-footer {
    flex-direction: column;
  }
  
  .cancel-button, .save-button {
    width: 100%;
    justify-content: center;
  }
}
</style>