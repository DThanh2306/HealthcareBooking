<template>
  <section class="hospitals-section">
    <div class="container">
      <div class="header-hospital">
        <div class="header-content">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div>
            <h2>Bệnh viện hàng đầu</h2>
            <p class="header-subtitle">Kết nối với các bệnh viện uy tín hàng đầu Việt Nam</p>
          </div>
        </div>
        <button
          class="view-more-btn"
          @click="goToHospitalPage"
          v-if="hospitals.length > 10"
        >
          <span>Xem thêm</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div class="hospital-grid">
        <div
          v-for="h in displayedHospitals"
          :key="h.h_id"
          class="hospital-card"
          @click="goToDetail(h.h_id)"
        >
          <div class="hospital-logo-wrapper">
            <img
              :src="h.logo || placeholderImage"
              :alt="h.h_name"
              class="hospital-logo"
              @error="usePlaceholderImage"
            />
          </div>
          <div class="hospital-info">
            <h3 class="hospital-name">{{ h.h_name }}</h3>
            <div class="hospital-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const hospitals = ref([]);
const router = useRouter();
const placeholderImage = 'https://placehold.co/200x150/e2e8f0/64748b/png?text=Hospital';

const usePlaceholderImage = (e) => {
  e.target.src = placeholderImage;
};


const displayedHospitals = computed(() => {
  return hospitals.value.slice(0, 8);
});

const goToDetail = (id) => {
  router.push(`/hospital/${id}`);
};

const goToHospitalPage = () => {
  router.push({ name: 'hospitals' });
};

onMounted(async () => {
  const res = await axios.get('http://localhost:3000/api/hospitals');
  hospitals.value = res.data;
});
</script>

<style scoped>
.hospitals-section {
  padding: 60px 0;
  background: #ffffff;
  margin-bottom: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.header-hospital {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  flex-wrap: wrap;
  gap: 24px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-content h2 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: #1e3a8a;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.hospital-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.hospital-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px 24px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.hospital-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.hospital-card:hover::before {
  transform: scaleX(1);
}

.hospital-card:hover {
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
  transform: translateY(-4px);
  border-color: #e0e7ff;
}

.hospital-logo-wrapper {
  width: 120px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.hospital-card:hover .hospital-logo-wrapper {
  background: #f0f9ff;
  transform: scale(1.05);
}

.hospital-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.hospital-card:hover .hospital-logo {
  transform: scale(1.1);
}

.hospital-info {
  width: 100%;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
}

.hospital-name {
  margin: 0;
  color: #1e3a8a;
  font-weight: 700;
  font-size: 1.15rem;
  line-height: 1.4;
  text-align: center;
  transition: color 0.3s ease;
  grid-column: 2;
}

.hospital-card:hover .hospital-name {
  color: #667eea;
}

.hospital-arrow {
  grid-column: 3;
  justify-self: center;
  transform: translateX(10px);
  color: #667eea;
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
}

.hospital-card:hover .hospital-arrow {
  opacity: 1;
  transform: translateX(0);
  background: rgba(102, 126, 234, 0.2);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hospital-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
  }

  .header-hospital {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
  }

  .header-content h2 {
    font-size: 1.75rem;
  }

  .header-subtitle {
    font-size: 1rem;
  }

  .view-more-btn {
    width: 100%;
    justify-content: center;
  }

  .hospital-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .hospital-card {
    padding: 24px 20px 20px 20px;
  }

  .hospital-logo-wrapper {
    width: 100px;
    height: 80px;
  }
}

@media (max-width: 480px) {
  .hospitals-section {
    padding: 40px 0;
  }

  .container {
    padding: 0 1rem;
  }

  .header-content h2 {
    font-size: 1.5rem;
  }

  .hospital-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .hospital-logo-wrapper {
    width: 90px;
    height: 70px;
  }
}

/* View More Button */
.view-more-btn {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  padding: 12px 28px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.view-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
}
</style>
