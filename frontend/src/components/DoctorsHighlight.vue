<template>
  <section class="doctors-highlight-section">
    <div class="container">
      <div class="doctors-highlight-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div>
            <h2>Bác sĩ nổi bật</h2>
            <p class="header-subtitle">Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm</p>
          </div>
        </div>
        <button
          class="view-more-btn"
          @click="goToListDoctor"
        >
          <span>Xem thêm</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div class="doctors-list">
        <div
          v-for="doctor in doctors.slice(0, 4)"
          :key="doctor.dr_id"
          class="doctor-card"
          @click="goToDoctorDetail(doctor.dr_id)"
        >
          <div class="doctor-img-wrapper">
            <img
              :src="doctor.image"
              :alt="doctor.dr_name"
            />
            <div class="doctor-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
          <div class="doctor-info">
            <h3 class="doctor-title">{{ doctor.dr_name }}</h3>
            <p class="doctor-specialty">{{ doctor.specialty || 'Chuyên khoa' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Background decorations -->
    <div class="bg-decorations">
      <div class="decor-circle decor-1"></div>
      <div class="decor-circle decor-2"></div>
      <div class="decor-circle decor-3"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const doctors = ref([]);
import { useRouter } from 'vue-router';
const router = useRouter();

function goToDoctorDetail(dr_id) {
  router.push({ name: 'doctordetail', params: { dr_id } });
}

function goToListDoctor() {
  router.push({ name: 'listdoctor' });
}

const fetchDoctors = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/doctors');
    doctors.value = res.data.map((d) => ({
      ...d,
      image: d.image?.startsWith('/uploads/') ? `http://localhost:3000${d.image}` : d.image
    }));
  } catch (err) {
    console.error('Lỗi khi tải danh sách bác sĩ:', err);
  }
};

onMounted(fetchDoctors);
</script>

<style scoped>
.doctors-highlight-section {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 80px 0;
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

.doctors-highlight-header {
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

.doctors-highlight-header h2 {
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

.doctors-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px;
  justify-items: center;
}

.doctor-card {
  width: 100%;
  max-width: 280px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.doctor-card:hover {
  transform: translateY(-8px);
}

.doctor-img-wrapper {
  width: 200px;
  height: 200px;
  margin: 0 auto 24px auto;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  border: 4px solid #fff;
}

.doctor-card:hover .doctor-img-wrapper {
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.25);
  transform: scale(1.05);
  border-color: #e0e7ff;
}

.doctor-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.doctor-card:hover .doctor-img-wrapper img {
  transform: scale(1.1);
}

.doctor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 131, 226, 0.8) 0%, rgba(128, 195, 246, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.doctor-card:hover .doctor-overlay {
  opacity: 1;
}

.doctor-info {
  padding: 0 12px;
}

.doctor-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 8px 0;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.doctor-card:hover .doctor-title {
  color: #667eea;
}

.doctor-specialty {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
  transition: color 0.3s ease;
}

.doctor-card:hover .doctor-specialty {
  color: #475569;
}

/* Background decorations */
.bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.decor-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.08);
  animation: float 20s infinite ease-in-out;
}

.decor-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.decor-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 5s;
}

.decor-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(120deg);
  }
  66% {
    transform: translate(-20px, 20px) rotate(240deg);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .doctors-list {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 28px;
  }

  .doctor-img-wrapper {
    width: 180px;
    height: 180px;
  }
}

@media (max-width: 768px) {
  .doctors-highlight-section {
    padding: 60px 0;
  }

  .container {
    padding: 0 1.5rem;
  }

  .doctors-highlight-header {
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

  .doctors-highlight-header h2 {
    font-size: 1.75rem;
  }

  .header-subtitle {
    font-size: 1rem;
  }

  .view-more-btn {
    width: 100%;
    justify-content: center;
  }

  .doctors-list {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 24px;
  }

  .doctor-img-wrapper {
    width: 160px;
    height: 160px;
  }
}

@media (max-width: 480px) {
  .doctors-highlight-section {
    padding: 40px 0;
  }

  .container {
    padding: 0 1rem;
  }

  .doctors-highlight-header h2 {
    font-size: 1.5rem;
  }

  .doctors-list {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .doctor-img-wrapper {
    width: 150px;
    height: 150px;
  }

  .decor-1,
  .decor-2,
  .decor-3 {
    display: none;
  }
}
</style>
