<template>
  <div class="hospital-page">
    <div class="page-header">
      <h1 class="page-title">Bệnh viện</h1>
      <p class="page-description">
        Khám phá mạng lưới bệnh viện uy tín hàng đầu với cơ sở vật chất hiện đại
      </p>
    </div>

    <!-- Search and Filter Section -->
    <div class="search-filter-section">
      <div class="search-container">
        <div class="search-input-group">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm kiếm bệnh viện..."
            class="search-input"
            @input="filterHospitals"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Đang tải danh sách bệnh viện...</p>
    </div>

    <!-- Hospital Grid -->
    <div v-else-if="filteredHospitals.length > 0" class="hospital-grid">
      <div
        v-for="hospital in filteredHospitals"
        :key="hospital.h_id"
        class="hospital-card"
        @click="goToDetail(hospital.h_id)"
      >
        <div class="hospital-image-container">
          <img
            :src="hospital.logo || placeholderImage"
            :alt="hospital.h_name"
            class="hospital-image"
            @error="usePlaceholderImage"
          />
          <div class="hospital-overlay">
            <div class="hospital-info-badge">
              <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 11.5A2.5 2.5 0 1 1 12 8a2.5 2.5 0 0 1 0 5.5Z"/>
              </svg>
              <span>Xem chi tiết</span>
            </div>
          </div>
        </div>
        
        <div class="hospital-content">
          <h3 class="hospital-name">{{ hospital.h_name }}</h3>
          <div class="hospital-address" v-if="hospital.h_address">
            <svg class="address-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 11.5A2.5 2.5 0 1 1 12 8a2.5 2.5 0 0 1 0 5.5Z"/>
            </svg>
            <span>{{ hospital.h_address }}</span>
          </div>
          
          <div class="hospital-features">
            <div class="feature-item">
              <svg class="feature-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Đội ngũ y bác sĩ chuyên môn cao</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <span>Cơ sở vật chất hiện đại</span>
            </div>
          </div>

          <!-- Rating Display -->
          <div class="hospital-rating">
            <div class="rating-stars">
              <span
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ filled: i <= (hospital.averageRating || 0) }"
              >
                ★
              </span>
            </div>
            <span class="rating-text">
              {{ hospital.averageRating ? hospital.averageRating.toFixed(1) : 'Chưa có đánh giá' }}
              <span v-if="hospital.totalRatings" class="rating-count">
                ({{ hospital.totalRatings }} đánh giá)
              </span>
            </span>
          </div>
        </div>

        <div class="hospital-arrow">
          <svg class="arrow-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
      </div>
      <h3>{{ searchKeyword ? 'Không tìm thấy bệnh viện' : 'Chưa có bệnh viện' }}</h3>
      <p>
        {{ searchKeyword 
          ? `Không có bệnh viện nào phù hợp với từ khóa "${searchKeyword}"` 
          : 'Hiện tại chưa có bệnh viện nào được đăng ký trong hệ thống.' 
        }}
      </p>
      <button v-if="searchKeyword" @click="clearSearch" class="clear-search-btn">
        Xóa bộ lọc
      </button>
    </div>

    <!-- Statistics Section -->
    <div class="statistics-section" v-if="hospitals.length > 0">
      <div class="stat-card">
        <div class="stat-number">{{ hospitals.length }}</div>
        <div class="stat-label">Bệnh viện</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ totalDoctors }}</div>
        <div class="stat-label">Bác sĩ</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">24/7</div>
        <div class="stat-label">Hỗ trợ</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axios'

const router = useRouter()
const hospitals = ref([])
const loading = ref(true)
const searchKeyword = ref('')
const totalDoctors = ref(0)

const baseURL = 'http://localhost:3000'
const placeholderImage = 'https://placehold.co/300x200/e2e8f0/64748b/png?text=Hospital'

const usePlaceholderImage = (e) => {
  e.target.src = placeholderImage
}

// Filtered hospitals based on search
const filteredHospitals = computed(() => {
  if (!searchKeyword.value.trim()) {
    return hospitals.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return hospitals.value.filter(hospital => 
    hospital.h_name.toLowerCase().includes(keyword) ||
    hospital.h_address?.toLowerCase().includes(keyword)
  )
})

// Load hospitals
async function loadHospitals() {
  try {
    loading.value = true
    const response = await axios.get(`${baseURL}/api/hospitals`)
    hospitals.value = response.data.map(hospital => ({
      ...hospital,
      // Backend đã trả về URL đầy đủ rồi, không cần thêm baseURL
      logo: hospital.logo || null,
      averageRating: Math.floor(Math.random() * 2) + 4, // Mock rating 4-5 stars
      totalRatings: Math.floor(Math.random() * 100) + 10 // Mock rating count
    }))
    
    // Calculate total doctors (mock data)
    totalDoctors.value = hospitals.value.length * Math.floor(Math.random() * 20 + 10)
  } catch (error) {
    console.error('Lỗi khi tải danh sách bệnh viện:', error)
    alert('Không thể tải danh sách bệnh viện')
  } finally {
    loading.value = false
  }
}

// Go to hospital detail
function goToDetail(hospitalId) {
  router.push(`/hospital/${hospitalId}`)
}

// Filter hospitals
function filterHospitals() {
  // Filtering is handled by computed property
}

// Clear search
function clearSearch() {
  searchKeyword.value = ''
}

onMounted(() => {
  loadHospitals()
})
</script>

<style scoped>
.hospital-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 50px;
  padding: 50px 0;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 20px;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-description {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 700px;
  margin: 0 auto;
}

/* Search and Filter */
.search-filter-section {
  margin-bottom: 40px;
  padding: 30px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.search-container {
  max-width: 600px;
  margin: 0 auto;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #9ca3af;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  color: #111827;
  transition: border-color 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 80px 20px;
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

/* Hospital Grid */
.hospital-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.hospital-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.hospital-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.hospital-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.hospital-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  transition: transform 0.3s ease;
}

.hospital-card:hover .hospital-image {
  transform: scale(1.05);
}

.hospital-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 131, 226, 0.8) 0%, rgba(128, 195, 246, 0.8) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hospital-card:hover .hospital-overlay {
  opacity: 1;
}

.hospital-info-badge {
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.hospital-content {
  padding: 24px;
  flex: 1;
}

.hospital-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.4;
}

.hospital-address {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.address-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

.hospital-features {
  margin-bottom: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 6px;
}

.feature-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

.hospital-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #d1d5db;
  font-size: 1rem;
  transition: color 0.2s ease;
}

.star.filled {
  color: #fbbf24;
}

.rating-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.rating-count {
  color: #9ca3af;
}

.hospital-arrow {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #6b7280;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.hospital-card:hover .hospital-arrow {
  background: white;
  color: #3b82f6;
  transform: scale(1.1);
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

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #374151;
}

.clear-search-btn {
  margin-top: 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.clear-search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Statistics Section */
.statistics-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 60px;
  padding: 40px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 20px;
  border: 1px solid #e5e7eb;
}

.stat-card {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f3f4f6;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #335283;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .hospital-page {
    padding: 15px;
  }
  
  .page-header {
    padding: 40px 20px;
    margin-bottom: 30px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-description {
    font-size: 1rem;
  }
  
  .hospital-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .hospital-card {
    margin-bottom: 0;
  }
  
  .search-filter-section {
    padding: 20px;
  }
  
  .statistics-section {
    grid-template-columns: 1fr;
    padding: 30px 20px;
  }
}
</style>