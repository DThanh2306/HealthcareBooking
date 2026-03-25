<template>
  <div class="home-page">
    <!-- Hero Header -->
    <div class="hero-header">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Nền tảng đặt khám uy tín
        </div>
        <h1 class="hero-title">
          Chăm sóc sức khỏe của bạn
          <span class="highlight">một cách thông minh</span>
        </h1>
        <p class="hero-description">
          Kết nối với hàng trăm bác sĩ chuyên khoa và bệnh viện uy tín. 
          Đặt lịch khám nhanh chóng, tiện lợi với công nghệ hiện đại.
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-number">200+</div>
            <div class="stat-label">Bệnh viện</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">1,500+</div>
            <div class="stat-label">Bác sĩ</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">50K+</div>
            <div class="stat-label">Người dùng</div>
          </div>
        </div>
      </div>
      <div class="hero-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- Navigation bar -->
    <NavBar />

    <!-- Main Content -->
    <div class="main-content">
      <!-- AI Doctor Callout -->
      <div class="container">
        <section class="ai-doctor-callout">
          <div class="callout-content">
            <h2>Gặp bác sĩ AI của bạn</h2>
            <p>
              Trò chuyện trực tiếp với bác sĩ AI bằng tiếng Việt. Bạn chỉ cần trả lời từng câu hỏi,
              hệ thống sẽ phân tích và gợi ý chuyên khoa, bệnh viện, bác sĩ phù hợp nhất.
            </p>
            <ul>
              <li>Thu thập thông tin sức khỏe theo từng bước</li>
              <li>Phân tích và đề xuất dựa trên dữ liệu thực tế</li>
              <li>Miễn phí, nhanh chóng, không thay thế khám trực tiếp</li>
            </ul>
            <button class="cta-btn primary" @click="handleAIDoctorClick">
              Trải nghiệm bác sĩ AI
            </button>
          </div>
          <div class="callout-illustration">
            <img
              src="../../public/uploads/ai.png"
              alt="Minh họa bác sĩ AI"
            >
          </div>
        </section>
      </div>

      <!-- Hospital List Section -->
      <div class="section-wrapper">
        <HospitalSection />
      </div>

      <!-- Doctors Highlight Section -->
      <div class="section-wrapper">
        <DoctorsHighlight />
      </div>
    </div>

    <!-- Footer CTA Section -->
    <div class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Bắt đầu hành trình chăm sóc sức khỏe của bạn ngay hôm nay</h2>
          <p>Đặt lịch khám với bác sĩ chuyên khoa chỉ trong vài cú click</p>
          <div class="cta-buttons">
            <button class="cta-btn primary" @click="scrollToBooking">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
              </svg>
              Đặt lịch khám
            </button>
            <button class="cta-btn secondary" @click="handleAIDoctorClick">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
              {{ isLoggedIn ? 'Bác sĩ AI' : 'Đăng nhập để dùng AI' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import HospitalSection from '@/components/HospitalSection.vue';
import DoctorsHighlight from '@/components/DoctorsHighlight.vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('userToken');
});

function scrollToBooking() {
  const element = document.querySelector('.hospitals-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goToAIDoctor() {
  router.push({ name: 'ai-doctor' });
}

function handleAIDoctorClick() {
  if (!isLoggedIn.value) {
    ElMessage.warning('Vui lòng đăng nhập để sử dụng tính năng Bác sĩ AI');
    router.push('/auth');
    return;
  }
  goToAIDoctor();
}

onMounted(() => {
  // Add scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  const sections = document.querySelectorAll('.section-wrapper');
  sections.forEach(section => observer.observe(section));
});
</script>

<style scoped>
.home-page {
  background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 20%);
  min-height: 100vh;
  position: relative;
}

/* Hero Header */
.hero-header {
  position: relative;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6ec1e4 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  width: 100%;
  padding: 0 2rem;
  text-align: center;
  color: white;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideIn 0.8s ease-out 0.2s both;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.hero-title .highlight {
  background: linear-gradient(120deg, #ffd700 0%, #ffed4e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  margin: 0 auto 40px;
  max-width: 700px;
  opacity: 0.95;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.hero-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 4px;
  background: linear-gradient(120deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.3);
}

/* Hero Shapes Animation */
.hero-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  right: 100px;
  animation-delay: 5s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: -75px;
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

/* Main Content */
.main-content {
  position: relative;
  z-index: 10;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.ai-doctor-callout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  padding: 36px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);
  border-radius: 28px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  align-items: center;
}

.ai-doctor-callout h2 {
  margin: 0 0 16px;
  font-size: 2rem;
  color: #1e293b;
}

.ai-doctor-callout p {
  margin: 0 0 16px;
  color: #334155;
  line-height: 1.7;
  font-size: 1.05rem;
}

.ai-doctor-callout ul {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1e3a8a;
  font-weight: 600;
}

.ai-doctor-callout ul li::before {
  content: "✔";
  margin-right: 10px;
  color: #2563eb;
  font-weight: 700;
}

.ai-doctor-callout .cta-btn {
  margin-top: 12px;
}

.callout-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.callout-illustration img {
  width: 100%;
  max-width: 360px;
  filter: drop-shadow(0 20px 32px rgba(30, 64, 175, 0.18));
}

.section-wrapper {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
}

.section-wrapper.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 0;
  margin-top: 60px;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.cta-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.cta-content p {
  font-size: 1.25rem;
  opacity: 0.95;
  margin: 0 0 40px 0;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  text-decoration: none;
}

.cta-btn.primary {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.cta-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.3);
}

.cta-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.cta-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .stat-number {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .hero-header {
    height: 400px;
    padding: 2rem 0;
  }

  .hero-content {
    padding: 0 1.5rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
    margin-bottom: 30px;
  }

  .hero-stats {
    gap: 20px;
    flex-wrap: wrap;
  }

  .stat-number {
    font-size: 1.8rem;
  }

  .stat-label {
    font-size: 0.9rem;
  }

  .stat-divider {
    display: none;
  }

  .container {
    padding: 2rem 1.5rem;
  }

  .cta-section {
    padding: 60px 0;
  }

  .cta-content h2 {
    font-size: 1.8rem;
  }

  .cta-content p {
    font-size: 1.1rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .cta-btn {
    width: 100%;
    justify-content: center;
  }

  .shape-1,
  .shape-2,
  .shape-3 {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-header {
    height: 350px;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-badge {
    font-size: 0.85rem;
    padding: 6px 16px;
  }

  .hero-stats {
    gap: 16px;
  }

  .stat-item {
    flex: 1;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
