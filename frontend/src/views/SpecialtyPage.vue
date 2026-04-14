<template>
  <div class="specialty-page">
    <div class="page-header">
      <h1 class="page-title">Chuyên khoa</h1>
      <p class="page-description">
        Khám phá các chuyên khoa y tế với đội ngũ bác sĩ chuyên môn cao
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Đang tải danh sách chuyên khoa...</p>
    </div>

    <!-- Specialty Grid -->
    <div v-else-if="specialties.length > 0" class="specialty-grid">
      <div
        v-for="specialty in specialties"
        :key="specialty.id"
        class="specialty-card"
        @click="viewSpecialtyDoctors(specialty.id, specialty.name)"
      >
        <div class="specialty-icon">
          <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>
        
        <div class="specialty-content">
          <h3 class="specialty-name">{{ specialty.name }}</h3>
          <p class="specialty-description" v-if="specialty.description">
            {{ specialty.description }}
          </p>
          <p class="specialty-description" v-else>
            Chuyên khoa {{ specialty.name.toLowerCase() }} với đội ngũ bác sĩ giàu kinh nghiệm
          </p>
          
          <div class="specialty-stats">
            <span class="stat-item">
              <svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Bác sĩ chuyên khoa
            </span>
          </div>
        </div>

        <div class="specialty-arrow">
          <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
      </div>
      <h3>Chưa có chuyên khoa</h3>
      <p>Hiện tại chưa có chuyên khoa nào được đăng ký trong hệ thống.</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <h3>Tìm kiếm bác sĩ theo chuyên khoa</h3>
      <div class="search-input-group">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Nhập tên chuyên khoa hoặc bác sĩ..."
          class="search-input"
          @keyup.enter="searchDoctors"
        />
        <button @click="searchDoctors" class="search-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axios'

const router = useRouter()
const specialties = ref([])
const loading = ref(true)
const searchKeyword = ref('')

const baseURL = 'http://localhost:3000/api'

// Load danh sách chuyên khoa
async function loadSpecialties() {
  try {
    loading.value = true
    const response = await axios.get(`${baseURL}/specialties`)
    specialties.value = response.data || []
  } catch (error) {
    console.error('Lỗi khi tải danh sách chuyên khoa:', error)
    alert('Không thể tải danh sách chuyên khoa')
  } finally {
    loading.value = false
  }
}

// Xem bác sĩ theo chuyên khoa
function viewSpecialtyDoctors(specialtyId, specialtyName) {
  // Chuyển đến trang danh sách bác sĩ với filter chuyên khoa
  router.push({
    name: 'listdoctor',
    query: {
      specialty: specialtyId,
      specialty_name: specialtyName
    }
  })
}

// Tìm kiếm bác sĩ
function searchDoctors() {
  if (!searchKeyword.value.trim()) {
    alert('Vui lòng nhập từ khóa tìm kiếm')
    return
  }
  
  router.push({
    name: 'search',
    query: {
      q: searchKeyword.value.trim(),
      type: 'specialty'
    }
  })
}

onMounted(() => {
  loadSpecialties()
})
</script>

<style scoped>
.specialty-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);  
  border-radius: 20px;
  color: white;
  margin-bottom: 50px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-description {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Specialty Grid */
.specialty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.specialty-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.specialty-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.specialty-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.specialty-card:hover::before {
  transform: scaleY(1);
}

.specialty-icon {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.specialty-content {
  flex: 1;
}

.specialty-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.specialty-description {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.specialty-stats {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
}

.stat-icon {
  color: #3b82f6;
}

.specialty-arrow {
  color: #9ca3af;
  transition: all 0.3s ease;
}

.specialty-card:hover .specialty-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
}

/* Search Section */
.search-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.search-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.search-input-group {
  display: flex;
  max-width: 500px;
  margin: 0 auto;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  background-color: #ffffff; /* nền trắng */
  color: #111827;
  transition: border-color 0.3s ease;
}

.search-input:focus {
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .specialty-page {
    padding: 15px;
  }
  
  .page-header {
    padding: 30px 20px;
    margin-bottom: 30px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-description {
    font-size: 1rem;
  }
  
  .specialty-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .specialty-card {
    padding: 20px;
  }
  
  .search-input-group {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>