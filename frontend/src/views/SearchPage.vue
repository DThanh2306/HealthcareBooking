<template>
  <div class="page-container">
    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-wrapper">
        <div class="search-input-container">
          <div class="search-icon">
            <Search class="icon-sm" />
          </div>
          <input
            type="text"
            placeholder="Tìm tất cả"
            class="search-input"
            v-model="searchQuery"
          />
          <div class="dropdown-container">
            <button
              @click="toggleDropdown"
              class="dropdown-button"
            >
              <span>Tất cả</span>
              <ChevronDown class="icon-xs" />
            </button>
            <div
              v-if="showDropdown"
              class="dropdown-menu"
            >
              <div class="dropdown-content">
                <button class="dropdown-item">Tất cả</button>
                <button class="dropdown-item">Bác sĩ</button>
                <button class="dropdown-item">Bệnh viện</button>
                <button class="dropdown-item">Chuyên khoa</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Không có kết quả -->
      <p v-if="!doctors.length && !hospitals.length && searchQuery">Không tìm thấy kết quả nào.</p>

      <!-- Cơ sở y tế Section -->
      <div
        v-if="hospitals.length"
        class="section"
      >
        <h2 class="section-title">Cơ sở y tế</h2>
        <div class="list-container">
          <div
            v-for="hospital in hospitals"
            :key="hospital.id"
            class="list-item"
          >
            <div class="hospital-image">
              <img
                :src="hospital.logo"
                :alt="hospital.ten_bv"
                class="image-cover"
              />
            </div>
            <span class="item-text">{{ hospital.ten_bv }}</span>
          </div>
        </div>
      </div>

      <!-- Bác sĩ Section -->
      <div
        v-if="doctors.length"
        class="section"
      >
        <h2 class="section-title">Bác sĩ</h2>
        <div class="doctor-list">
          <div
            v-for="doctor in doctors"
            :key="doctor.id"
            class="doctor-item"
          >
            <div class="doctor-avatar">
              <img
                :src="doctor.image"
                :alt="doctor.name"
                class="image-cover"
              />
            </div>
            <div class="doctor-info">
              <h3 class="doctor-name">{{ doctor.name }}</h3>
              <p class="doctor-specialty">{{ doctor.specialty }}</p>
              <p class="doctor-hospital">{{ doctor.bv_bs }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import { Search, ChevronDown } from 'lucide-vue-next';
import { debounce } from 'lodash-es';

const route = useRoute();
const router = useRouter();

const searchQuery = ref(route.query.q || '');
const showDropdown = ref(false);

const hospitals = ref([]);
const doctors = ref([]);

const fetchResults = async () => {
  if (!searchQuery.value.trim()) {
    hospitals.value = [];
    doctors.value = [];
    return;
  }
  try {
    const res = await axios.get(`/search/all/${encodeURIComponent(searchQuery.value)}`);
    console.log('📥 Dữ liệu nhận được từ API:', res.data);

    hospitals.value = res.data.hospitals || [];
    doctors.value = res.data.doctors || [];
  } catch (err) {
    console.error('Lỗi khi tìm kiếm:', err);
  }
};

const debouncedFetch = debounce(() => {
  router.replace({ path: '/search', query: { key: searchQuery.value } });
  fetchResults();
}, 400);

watch(searchQuery, () => {
  debouncedFetch();
});

watch(
  () => route.query.q,
  (newVal) => {
    searchQuery.value = newVal || '';
    fetchResults();
  },
  { immediate: true }
);

const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    showDropdown.value = false;
  }
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Layout */
.page-container {
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.5rem;
}

/* Search Section */
.search-section {
  background-color: #fbbf24;
  padding: 1rem;
}

.search-wrapper {
  max-width: 64rem;
  margin: 0 auto;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border-radius: 0.5rem 0 0 0.5rem;
  background-color: #ffffff;
  color: #111827;
  border: none;
  outline: none;
  font-size: 1rem;
}

.search-input:focus {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

/* Dropdown */
.dropdown-container {
  position: relative;
}

.dropdown-button {
  background-color: #ffffff;
  color: #111827;
  padding: 0.75rem 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  border-left: 1px solid #020a15;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-button:hover {
  background-color: #f9fafb;
}

.dropdown-button:focus {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  background-color: black;
  border: 1px solid #000206;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 7.5rem;
}

.dropdown-content {
  padding: 0.25rem 0;
}

.dropdown-item {
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

/* Sections */
.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

/* Lists */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: #f3f4f6;
}

.item-text {
  color: #374151;
  font-size: 0.875rem;
}

/* Icons */
.icon-xs {
  width: 1rem;
  height: 1rem;
}

.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
  color: #4b5563;
}

.icon-md {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-container {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.specialty-icon {
  color: #3b82f6;
}

/* Images */
.image-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hospital-image {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  flex-shrink: 0;
  overflow: hidden;
}

/* Doctor Section */
.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.doctor-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.doctor-item:hover {
  background-color: #f3f4f6;
}

.doctor-avatar {
  width: 3rem;
  height: 3rem;
  background-color: #e5e7eb;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}

.doctor-info {
  flex: 1;
}

.doctor-name {
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.doctor-specialty {
  font-size: 0.75rem;
  color: #4b5563;
  margin: 0 0 0.125rem 0;
}

.doctor-hospital {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }

  .search-input-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-input {
    border-radius: 0.5rem;
  }

  .dropdown-button {
    border-radius: 0.5rem;
    border-left: none;
    border-top: 1px solid #d1d5db;
  }
}
</style>
