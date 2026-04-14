<template>
  <div class="container">
    <!-- Navigation Breadcrumb -->
    <div v-if="currentSpecialty.name" class="breadcrumb">
      <button @click="goBackToSpecialties" class="breadcrumb-btn">
        <svg class="breadcrumb-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Quay lại chuyên khoa</span>
      </button>
    </div>

    <!-- Header Section -->
    <div class="header-section">
      <h1 class="page-title">
        <span v-if="currentSpecialty.name">Bác sĩ chuyên khoa {{ currentSpecialty.name }}</span>
        <span v-else>Đội ngũ bác sĩ</span>
      </h1>
      <p class="page-subtitle">
        <span v-if="currentSpecialty.name">Danh sách bác sĩ chuyên khoa {{ currentSpecialty.name }}</span>
        <span v-else>Tìm kiếm và lựa chọn bác sĩ phù hợp với nhu cầu của bạn</span>
      </p>
    </div>

    <!-- Search and Filter Section -->
    <div class="search-filter-section">
      <div class="search-row">
        <!-- Search Input -->
        <div class="search-box">
          <div class="search-input-wrapper">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="Tìm kiếm tên bác sĩ..."
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button v-if="searchKeyword" @click="clearSearch" class="clear-btn">
              <svg class="clear-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Specialty Filter -->
        <div class="filter-box">
          <select v-model="selectedSpecialtyId" @change="handleSpecialtyChange" class="specialty-select">
            <option value="">Tất cả chuyên khoa</option>
            <option 
              v-for="specialty in specialties" 
              :key="specialty.id" 
              :value="specialty.id"
            >
              {{ specialty.name }}
            </option>
          </select>
        </div>

        <!-- Search Button -->
        <button @click="handleSearch" class="search-btn">
          <svg class="search-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Tìm kiếm</span>
        </button>
      </div>

      <!-- Active Filters Display -->
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="filters-label">Bộ lọc đang áp dụng:</span>
        <div class="filter-tags">
          <div v-if="searchKeyword" class="filter-tag">
            <span>Tìm kiếm: "{{ searchKeyword }}"</span>
            <button @click="clearSearch" class="remove-filter-btn">×</button>
          </div>
          <div v-if="currentSpecialty.name" class="filter-tag">
            <span>Chuyên khoa: {{ currentSpecialty.name }}</span>
            <button @click="clearSpecialtyFilter" class="remove-filter-btn">×</button>
          </div>
        </div>
        <button @click="clearAllFilters" class="clear-all-btn">Xóa tất cả</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Đang tải danh sách bác sĩ...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && doctors.length === 0" class="empty-state">
      <div class="empty-icon">👨‍⚕️</div>
      <h3 class="empty-title">Không có bác sĩ nào</h3>
      <p class="empty-description">Hiện tại chưa có bác sĩ nào trong hệ thống.</p>
    </div>

    <!-- Doctor Grid -->
    <div v-else class="doctor-grid">
      <div
        v-for="(doctor, index) in doctors"
        :key="index"
        class="doctor-card"
        @click="goToDoctorDetail(doctor.dr_id)"
      >
        <div class="doctor-image-wrapper">
        <img
          class="doctor-image"
          :src="doctor.image"
            :alt="doctor.dr_name"
          @error="imageError($event)"
          loading="lazy"
        />
          <div class="image-overlay"></div>
          <div class="view-badge">
            <svg class="view-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Xem chi tiết</span>
          </div>
        </div>
        <div class="doctor-info">
          <h3 class="doctor-name">{{ doctor.dr_name }}</h3>
          <div class="doctor-specialty-wrapper">
            <svg class="specialty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          <p class="doctor-specialist">{{ doctor.specialty }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && doctors.length > 0 && totalPages > 1" class="pagination-wrapper">
    <div class="pagination">
      <button
          class="pagination-btn prev-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
          <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Trước</span>
      </button>

        <div class="page-numbers">
      <button
        v-for="page in visiblePages"
        :key="page"
        @click="changePage(page)"
            :class="['page-btn', { active: currentPage === page }]"
      >
        {{ page }}
      </button>
        </div>

      <button
          class="pagination-btn next-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
          <span>Sau</span>
          <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
      </button>
      </div>
      <p class="pagination-info">Trang {{ currentPage }} / {{ totalPages }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '@/axios';
import { useRouter, useRoute } from 'vue-router';

const doctors = ref([]);
const totalPages = ref(1);
const currentPage = ref(1);
const loading = ref(false);
const router = useRouter();
const route = useRoute();

// Search and Filter states
const searchKeyword = ref('');
const selectedSpecialtyId = ref('');
const specialties = ref([]);

// Thông tin chuyên khoa hiện tại
const currentSpecialty = ref({
  id: null,
  name: null
});

// Computed for active filters
const hasActiveFilters = computed(() => {
  return searchKeyword.value.trim() || currentSpecialty.value.name;
});

function goToDoctorDetail(dr_id) {
  router.push({ name: 'doctordetail', params: { dr_id } });
}

function goBackToSpecialties() {
  router.push({ name: 'specialties' });
}

// Search and Filter handlers
function handleSearch() {
  currentPage.value = 1;
  fetchDoctors(1);
}

function handleSpecialtyChange() {
  const selectedSpecialty = specialties.value.find(s => s.id == selectedSpecialtyId.value);
  if (selectedSpecialty) {
    currentSpecialty.value = {
      id: selectedSpecialty.id,
      name: selectedSpecialty.name
    };
  } else {
    currentSpecialty.value = {
      id: null,
      name: null
    };
  }
  currentPage.value = 1;
  fetchDoctors(1);
}

function clearSearch() {
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchDoctors(1);
}

function clearSpecialtyFilter() {
  selectedSpecialtyId.value = '';
  currentSpecialty.value = {
    id: null,
    name: null
  };
  currentPage.value = 1;
  fetchDoctors(1);
}

function clearAllFilters() {
  searchKeyword.value = '';
  selectedSpecialtyId.value = '';
  currentSpecialty.value = {
    id: null,
    name: null
  };
  currentPage.value = 1;
  fetchDoctors(1);
}

function imageError(e) {
  e.target.src = '/uploads/user.png';
}

async function fetchDoctors(page = 1) {
  try {
    loading.value = true;
    
    // Xây dựng URL với query parameters
    let url = `/doctors?page=${page}&limit=8`;
    
    // Thêm specialty filter nếu có
    if (selectedSpecialtyId.value || currentSpecialty.value.id) {
      const specialtyId = selectedSpecialtyId.value || currentSpecialty.value.id;
      url += `&specialty=${specialtyId}`;
    }
    
    // Thêm search keyword nếu có
    if (searchKeyword.value.trim()) {
      url += `&search=${encodeURIComponent(searchKeyword.value.trim())}`;
    }
    
    const res = await axios.get(url);
    doctors.value = res.data.data || [];
    totalPages.value = res.data.totalPages || 1;
    currentPage.value = res.data.currentPage || page;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    doctors.value = [];
  } finally {
    loading.value = false;
  }
}

// Load specialties for filter dropdown
async function loadSpecialties() {
  try {
    const response = await axios.get('/specialties');
    specialties.value = response.data || [];
  } catch (error) {
    console.error('Error loading specialties:', error);
    specialties.value = [];
  }
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchDoctors(page);
  }
}

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Kiểm tra route parameters khi component được mount
function checkRouteParams() {
  const specialtyId = route.query.specialty;
  const specialtyName = route.query.specialty_name;
  
  if (specialtyId && specialtyName) {
    currentSpecialty.value = {
      id: specialtyId,
      name: specialtyName
    };
    selectedSpecialtyId.value = specialtyId;
  } else {
    currentSpecialty.value = {
      id: null,
      name: null
    };
    selectedSpecialtyId.value = '';
  }
}

// Watch route changes để cập nhật khi chuyển từ specialty khác
watch(() => route.query, () => {
  checkRouteParams();
  currentPage.value = 1; // Reset về trang đầu
  fetchDoctors(1);
}, { immediate: true });

onMounted(() => {
  loadSpecialties();
  checkRouteParams();
  fetchDoctors();
});
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 24px;
}

.breadcrumb-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
}

.breadcrumb-btn:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.breadcrumb-icon {
  width: 18px;
  height: 18px;
}

/* Search and Filter Section */
.search-filter-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
}

.search-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 2;
  min-width: 300px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 16px;
  color: #111827;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #9ca3af;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.clear-icon {
  width: 16px;
  height: 16px;
}

.filter-box {
  flex: 1;
  min-width: 200px;
}

.specialty-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 16px;
  color: #111827; 
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.specialty-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.search-btn-icon {
  width: 18px;
  height: 18px;
}

/* Active Filters */
.active-filters {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filters-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-filter-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.clear-all-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 2px solid #e5e7eb;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  background: #426184;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 18px;
  color: #64748b;
  font-weight: 400;
  margin: 0;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.empty-description {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* Doctor Grid */
.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.doctor-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  border: 1px solid #f1f5f9;
}

.doctor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.15);
  border-color: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
}

.doctor-image-wrapper {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.doctor-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.doctor-card:hover .doctor-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.doctor-card:hover .image-overlay {
  opacity: 1;
}

.view-badge {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.doctor-card:hover .view-badge {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.view-icon {
  width: 18px;
  height: 18px;
}

.doctor-info {
  padding: 24px;
}

.doctor-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.doctor-specialty-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.specialty-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
  flex-shrink: 0;
}

.doctor-specialist {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
  line-height: 1.5;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #3b82f6;
  color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.pagination-icon {
  width: 18px;
  height: 18px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.page-btn.active {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  font-weight: 600;
}

.page-btn.active:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .doctor-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }
  
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box,
  .filter-box {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 24px 16px;
  }

  .header-section {
    margin-bottom: 32px;
    padding-bottom: 24px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 16px;
  }
  
  .search-filter-section {
    padding: 20px;
  }

  .doctor-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .doctor-image-wrapper {
    height: 240px;
  }

  .doctor-info {
    padding: 20px;
  }

  .doctor-name {
    font-size: 18px;
  }

  .pagination {
    gap: 4px;
  }

  .pagination-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .page-btn {
    min-width: 40px;
    height: 40px;
    font-size: 13px;
  }
  
  .active-filters {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .doctor-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .pagination-btn span {
    display: none;
  }

  .pagination-btn {
    padding: 10px;
  }
  
  .search-filter-section {
    padding: 16px;
  }
  
  .search-input,
  .specialty-select {
    font-size: 14px;
    padding: 10px 12px;
  }
  
  .search-input {
    padding-left: 40px;
  }
  
  .search-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>
