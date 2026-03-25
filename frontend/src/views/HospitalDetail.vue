<template>
  <div class="hospital-home">
    <!-- Ảnh nền -->
    <div class="header-bg">
      <img
        class="header-img"
        src="../../public/uploads/photo.jpg"
        :alt="hospital?.h_name"
      />
      <div class="header-overlay">
        <div class="header-content">
          <div class="logo-wrapper">
            <img
              :src="hospital?.logo"
              :alt="Logo"
              class="logo"
            />
          </div>
          <div class="info">
            <h2 class="title">{{ hospital?.h_name }}</h2>
            <div class="address">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {{ hospital?.h_address }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu tabs -->
    <div class="menu-tabs-container">
      <div class="menu-tabs">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index"
          :class="['tab', activeTab === index ? 'active' : '']"
          @click="activeTab = index"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <!-- Vùng hỏi đáp -->
    <div class="ask-section">
      <div class="ask-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        Hỏi nhanh, đáp chuẩn - Đặt khám dễ dàng với {{ hospital?.h_name }}
      </div>
      <div class="ask-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 12px; color: #999;">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          class="ask-input"
          placeholder="Đặt câu hỏi với Trợ lý AI"
          v-model="aiQuestion"
          @keyup.enter="handleAIQuestion"
        />
        <button class="ask-btn" @click="handleAIQuestion">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2875bb"
            stroke-width="2"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
      <div class="ask-options">
        <span @click="scrollToBooking">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          Chọn bệnh viện/phòng khám
        </span>
        <span @click="scrollToBooking">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
          Khám chuyên khoa/bác sĩ
        </span>
      </div>
    </div>

    <!-- Cột câu hỏi -->
    <div class="faq-section">
      <div class="faq-header">
        <h3>Câu hỏi thường gặp</h3>
        <p>Những câu hỏi được nhiều người quan tâm về {{ hospital?.h_name }}</p>
      </div>
      <div class="faq-grid">
        <div class="faq-col">
          <div 
            v-for="(faq, index) in faqs.slice(0, 3)" 
            :key="index"
            :class="['faq-item', expandedFaqs.includes(index) ? 'active' : '']"
            @click="toggleFaq(index)"
          >
            <div class="faq-item-header">
              <span class="faq-question">{{ faq.question }}</span>
              <span :class="['faq-expand', expandedFaqs.includes(index) ? 'expanded' : '']">
                {{ expandedFaqs.includes(index) ? '−' : '+' }}
              </span>
            </div>
            <div v-if="expandedFaqs.includes(index)" class="faq-answer">
              {{ faq.answer }}
            </div>
          </div>
        </div>
        <div class="faq-col">
          <div 
            v-for="(faq, index) in faqs.slice(3, 6)" 
            :key="index + 3"
            :class="['faq-item', expandedFaqs.includes(index + 3) ? 'active' : '']"
            @click="toggleFaq(index + 3)"
          >
            <div class="faq-item-header">
              <span class="faq-question">{{ faq.question }}</span>
              <span :class="['faq-expand', expandedFaqs.includes(index + 3) ? 'expanded' : '']">
                {{ expandedFaqs.includes(index + 3) ? '−' : '+' }}
              </span>
            </div>
            <div v-if="expandedFaqs.includes(index + 3)" class="faq-answer">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-main">
      <div class="notification-yellow">
        <div class="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <strong>BookingCare</strong> là Nền tảng Y tế chăm sóc sức khỏe toàn diện hàng đầu Việt Nam kết nối người
          dùng với trên 200 bệnh viện - phòng khám uy tín, hơn 1,500 bác sĩ chuyên khoa giỏi và hàng
          nghìn dịch vụ, sản phẩm y tế chất lượng cao.
        </div>
      </div>
      <div class="notification-blue">
        <div class="notification-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <p>
            Hàng nghìn người bệnh đến khám tại <strong>{{ hospital?.h_name }}</strong> mỗi ngày. Nhằm nâng cao chất
            lượng dịch vụ và hỗ trợ người bệnh tốt hơn, {{ hospital?.h_name }} triển khai đặt khám
            online thông qua Nền tảng Đặt khám BookingCare.
          </p>
          <p>
            Để giảm thời gian chờ đợi và nhận được hướng dẫn đi khám tại {{ hospital?.h_name }}, người
            bệnh vui lòng:
          </p>
          <ul>
            <li>Chọn chuyên khoa phù hợp cần đi khám</li>
            <li>Chọn thời gian đặt khám</li>
            <li>Đặt hẹn online trước khi đến khám</li>
          </ul>
        </div>
      </div>

      <!-- Specialties Section -->
      <div class="section">
        <div class="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
          CHUYÊN KHOA TẠI {{ hospital?.h_name }}
        </div>
        <div v-if="hospitalSpecialties.length > 0" class="specialties-grid">
          <div
            v-for="specialty in hospitalSpecialties"
            :key="specialty.sp_id"
            class="specialty-card"
            @click="viewDoctorsBySpecialty(specialty)"
            :class="{ active: selectedSpecialty?.sp_id === specialty.sp_id }"
          >
            <div class="specialty-header">
              <div class="specialty-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div class="specialty-info">
                <h4 class="specialty-name">{{ specialty.sp_name }}</h4>
                <div class="doctor-count">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  {{ specialty.doctor_count }} bác sĩ
                </div>
              </div>
            </div>
            <p v-if="specialty.sp_description" class="specialty-description">
              {{ specialty.sp_description }}
            </p>
          </div>
        </div>

        <!-- Hiển thị danh sách bác sĩ theo chuyên khoa -->
        <div v-if="selectedSpecialty && specialtyDoctors.length > 0" class="doctors-by-specialty-section">
          <div class="doctors-section-header">
            <h3>Bác sĩ chuyên khoa {{ selectedSpecialty.sp_name }}</h3>
            <button @click="clearSelectedSpecialty" class="clear-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Đóng
            </button>
          </div>
          <div class="doctors-grid">
            <div
              v-for="doctor in specialtyDoctors"
              :key="doctor.dr_id"
              class="doctor-card"
              @click="viewDoctorDetail(doctor.dr_id)"
            >
              <div class="doctor-image">
                <img :src="doctor.image || '/uploads/user.png'" :alt="doctor.dr_name" />
              </div>
              <div class="doctor-info">
                <h4 class="doctor-name">{{ doctor.dr_name }}</h4>
                <p class="doctor-specialty">{{ doctor.specialty }}</p>
                <p class="doctor-experience">{{ doctor.dr_experience }} năm kinh nghiệm</p>
                <p class="doctor-price">{{ doctor.price }} VNĐ</p>
                <button class="book-doctor-btn" @click.stop="selectDoctorForBooking(doctor)">
                  Đặt khám
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedSpecialty && specialtyDoctors.length === 0 && !loadingSpecialtyDoctors" class="no-doctors">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <p>Không có bác sĩ nào trong chuyên khoa {{ selectedSpecialty.sp_name }}</p>
        </div>

        <div v-if="hospitalSpecialties.length === 0" class="no-specialties">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
          <p>Chưa có thông tin chuyên khoa cho bệnh viện này</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          GIỚI THIỆU
        </div>
        <div class="section-content">
          <p>{{ hospital?.h_description }}</p>
          <div class="address-card">
            <p class="section-bold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Địa chỉ bệnh viện:
            </p>
            <p>{{ hospital?.h_address }}</p>
          </div>
        </div>
      </div>

      <!-- Hospital Rating Section -->
      <hr />
      <div class="section">
        <div class="rating-section-header">
          <h2>Đánh giá từ bệnh nhân</h2>
          <button 
            @click="openRatingModal"
            class="rate-hospital-btn"
            v-if="!userHasRated"
          >
            Đánh giá bệnh viện
          </button>
        </div>
        
        <RatingDisplay
          :ratings="hospitalRatings"
          :summary="ratingSummary"
          :pagination="ratingPagination"
          :loading="loadingRatings"
          :current-user-id="currentUserId"
          @load-page="loadRatings"
          @edit-rating="editHospitalRating"
          @delete-rating="deleteHospitalRating"
        >
          <template #owner-actions="{ rating }">
            <div class="rating-actions">
              <button @click="editHospitalRating(rating)" class="edit-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Sửa
              </button>
              <button @click="deleteHospitalRating(rating)" class="delete-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Xóa
              </button>
            </div>
          </template>
        </RatingDisplay>
      </div>
    </div>

    <!-- Booking by Hospital Section -->
    <div class="content-main booking-section" id="booking-section">
      <div class="section">
        <div class="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
          </svg>
          ĐẶT LỊCH TẠI {{ hospital?.h_name }}
        </div>

        <div class="booking-card">
          <div class="booking-filters">
            <div class="filter-group">
              <label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                </svg>
                Chọn bác sĩ
              </label>
              <select v-model="selectedDoctorId" @change="onDoctorChange" class="form-select">
                <option value="" disabled>-- Chọn bác sĩ --</option>
                <option v-for="d in doctorsInHospital" :key="d.dr_id" :value="d.dr_id">
                  {{ d.dr_name }} ({{ d.specialty || 'Chuyên khoa' }})
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                Chọn ngày
              </label>
              <select v-model="selectedDate" @change="handleDateChange" class="form-select">
                <option v-for="(day, idx) in daysList" :key="idx" :value="day.value">{{ day.label }}</option>
              </select>
            </div>
          </div>

          <div v-if="selectedDoctorSchedules.length" class="slots-container">
            <div class="slots-header">
              <span>Chọn khung giờ khám</span>
              <span class="fee-badge">Phí đặt lịch: 0đ</span>
            </div>
            <div class="slots-list">
              <div
                v-for="(slot, index) in selectedDoctorSchedules"
                :key="index"
                :class="['time-slot', bookedSlots.includes(slot) ? 'booked' : 'available']"
                @click="goToBookingForm(slot)"
              >
                <svg v-if="!bookedSlots.includes(slot)" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                {{ slot }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
            <p>Vui lòng chọn bác sĩ để xem lịch khám</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hospital Rating Modal -->
    <HospitalRatingModal
      :show="showRatingModal"
      :hospital="{
        id: hospital?.h_id,
        name: hospital?.h_name,
        address: hospital?.h_address,
        logo: hospital?.logo
      }"
      :edit-rating="editingRating"
      @close="closeRatingModal"
      @rating-submitted="onRatingSubmitted"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';
import router from '@/router';
import HospitalRatingModal from '@/components/HospitalRatingModal.vue';
import RatingDisplay from '@/components/RatingDisplay.vue';

const route = useRoute();
const hospital = ref(null);
const hospitalSpecialties = ref([]);
const baseURL = 'http://localhost:3000';

// Specialty doctors state
const selectedSpecialty = ref(null);
const specialtyDoctors = ref([]);
const loadingSpecialtyDoctors = ref(false);

// Hospital rating state
const showRatingModal = ref(false);
const hospitalRatings = ref([]);
const ratingSummary = ref(null);
const ratingPagination = ref(null);
const loadingRatings = ref(false);
const currentUserId = ref(null);
const userHasRated = ref(false);

// Booking state for hospital-based booking
const doctors = ref([]);
const doctorsInHospital = ref([]);
const selectedDoctorId = ref('');
const selectedDate = ref('');
const daysList = ref([]);
const bookedSlots = ref([]);
const selectedDoctorSchedules = ref([]);
const doctorSchedulesRaw = ref([]);

// Tab state
const activeTab = ref(0);
const tabs = ref(['GIỚI THIỆU', 'THẾ MẠNH CHUYÊN MÔN', 'TRANG THIẾT BỊ', 'QUY TRÌNH KHÁM']);

// AI Question state
const aiQuestion = ref('');

// FAQ state
const expandedFaqs = ref([]);
const faqs = ref([
  {
    question: 'Tôi muốn nội soi và cắt polyp trong ngày tại Bệnh viện Hữu nghị Việt Đức có được không?',
    answer: 'Có, bệnh viện hỗ trợ nội soi và cắt polyp trong cùng ngày. Vui lòng đặt lịch trước và tuân thủ các hướng dẫn của bác sĩ.'
  },
  {
    question: 'Tôi bị đau các khớp tay và chân, đặt khám chuyên khoa nào tại Bệnh viện Hữu nghị Việt Đức?',
    answer: 'Bạn nên đặt khám tại khoa Cơ Xương Khớp hoặc khoa Nội tổng hợp. Các bác sĩ sẽ thăm khám và đưa ra phương án điều trị phù hợp.'
  },
  {
    question: 'Lịch khám bác sĩ khoa Chi trên và Y học thể thao, Bệnh viện Hữu nghị Việt Đức',
    answer: 'Lịch khám của khoa Chi trên và Y học thể thao được cập nhật hàng tuần. Vui lòng xem lịch chi tiết trên trang đặt lịch hoặc liên hệ hotline của bệnh viện.'
  },
  {
    question: 'Con tôi 16 tháng tuổi có khối u ở vùng thắt lưng, đã từng khám Bệnh viện Nhi Trung ương được bác sĩ hội chẩn khám tại Việt Đức, giờ phải làm gì?',
    answer: 'Bạn nên đặt lịch khám lại tại khoa Ngoại hoặc khoa liên quan để theo dõi tình trạng. Mang theo đầy đủ hồ sơ khám trước đó để bác sĩ có thể đánh giá chính xác.'
  },
  {
    question: 'Bác sĩ khoa Nội - Hồi sức thần kinh Bệnh viện Hữu nghị Việt Đức',
    answer: 'Khoa Nội - Hồi sức thần kinh có đội ngũ bác sĩ giàu kinh nghiệm. Bạn có thể đặt lịch khám trực tuyến hoặc liên hệ phòng khám để được tư vấn.'
  },
  {
    question: 'Khám bộ hiểm tại Bệnh viện Hữu nghị Việt Đức cần chuẩn bị gì?',
    answer: 'Khi khám bộ hiểm, bạn cần nhịn ăn từ đêm hôm trước, mang theo CMND/CCCD, và đến đúng giờ hẹn. Nên tham khảo thêm hướng dẫn chi tiết từ phòng khám.'
  }
]);

function toggleFaq(index) {
  const idx = expandedFaqs.value.indexOf(index);
  if (idx > -1) {
    expandedFaqs.value.splice(idx, 1);
  } else {
    expandedFaqs.value.push(index);
  }
}

function handleAIQuestion() {
  if (!aiQuestion.value.trim()) return;
  // TODO: Implement AI question handling
  console.log('AI Question:', aiQuestion.value);
  alert('Tính năng AI đang được phát triển. Câu hỏi của bạn: ' + aiQuestion.value);
  aiQuestion.value = '';
}

function scrollToBooking() {
  const element = document.getElementById('booking-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getUpcomingDays(numDays = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    days.push({ value, label });
  }
  return days;
}

function refreshSchedulesForSelectedDate() {
  const schedules = Array.isArray(doctorSchedulesRaw.value) ? doctorSchedulesRaw.value : [];
  // If schedules are plain strings, just normalize and sort
  if (schedules.every(s => typeof s === 'string')) {
    const unique = Array.from(new Set(schedules)).filter(Boolean);
    unique.sort((a, b) => {
      const getStart = (t) => (t?.split('-')[0] || '').trim();
      return getStart(a).localeCompare(getStart(b));
    });
    selectedDoctorSchedules.value = unique;
    return;
  }
  // If schedules are objects with day_of_week/specific_date
  const date = selectedDate.value;
  if (!date) { selectedDoctorSchedules.value = []; return; }
  const targetDay = (() => {
    const d = new Date(date);
    const jsDay = d.getDay(); // 0..6 (Sun..Sat)
    return jsDay === 0 ? 7 : jsDay; // 1..7 (Mon..Sun)
  })();
  const times = schedules
    .map((s) => {
      if (typeof s === 'string') return s;
      // If specific_date set and matches the selected date
      if (s && typeof s === 'object') {
        const ts = s.time_slot || s.time || '';
        const dayOk = s.day_of_week ? Number(s.day_of_week) === Number(targetDay) : true;
        const dateOk = s.specific_date ? String(s.specific_date).slice(0,10) === date : true;
        const recurringOk = s.is_recurring === undefined ? true : !!s.is_recurring;
        // Match either a one-off specific date, or a recurring matching day_of_week with no specific_date
        const matches = (s.specific_date ? dateOk : (recurringOk && dayOk));
        return matches ? ts : '';
      }
      return '';
    })
    .filter(Boolean);
  const unique = Array.from(new Set(times));
  unique.sort((a, b) => {
    const getStart = (t) => (t?.split('-')[0] || '').trim();
    return getStart(a).localeCompare(getStart(b));
  });
  selectedDoctorSchedules.value = unique;
}

async function loadBookedSlots() {
  if (!selectedDoctorId.value || !selectedDate.value) return (bookedSlots.value = []);
  try {
    const res = await axios.get(
      `/patients/booked/${selectedDoctorId.value}/${selectedDate.value}`
    );
    const raw = res.data || [];
    // Normalize booked slots to an array of time strings
    bookedSlots.value = (Array.isArray(raw) ? raw : []).map((it) => {
      if (typeof it === 'string') return it;
      if (it && typeof it === 'object') return it.time_slot || it.time || '';
      return '';
    }).filter(Boolean);
  } catch {
    bookedSlots.value = [];
  }
}

function onDoctorChange() {
  bookedSlots.value = [];
  selectedDoctorSchedules.value = [];
  doctorSchedulesRaw.value = [];
  if (!selectedDoctorId.value) return;
  // fetch selected doctor's schedules
  axios
    .get(`${baseURL}/api/doctors/${selectedDoctorId.value}`)
    .then((res) => {
      const dr = res.data || {};
      const schedules = Array.isArray(dr.schedules) ? dr.schedules : [];
      doctorSchedulesRaw.value = schedules;
      refreshSchedulesForSelectedDate();
      loadBookedSlots();
    })
    .catch(() => {
      selectedDoctorSchedules.value = [];
      doctorSchedulesRaw.value = [];
    });
}

function handleDateChange() {
  refreshSchedulesForSelectedDate();
  loadBookedSlots();
}

function goToBookingForm(slot) {
  if (bookedSlots.value.includes(slot)) return alert('Khung giờ này đã có người đặt!');

  router.push({
    name: 'bookingform',
    params: { dr_id: String(selectedDoctorId.value) },
    query: {
      dr_id: String(selectedDoctorId.value),
      date: selectedDate.value,
      time: slot
    }
  });
}

// Functions for specialty doctors
async function viewDoctorsBySpecialty(specialty) {
  selectedSpecialty.value = specialty;
  loadingSpecialtyDoctors.value = true;
  specialtyDoctors.value = [];

  try {
    const hospitalName = hospital.value?.h_name;
    if (!hospitalName) {
      throw new Error('Hospital name not available');
    }

    const response = await axios.get(
      `${baseURL}/api/doctors/hospital/${encodeURIComponent(hospitalName)}/specialty/${specialty.sp_id}`
    );
    
    specialtyDoctors.value = response.data || [];
  } catch (error) {
    console.error('Error loading specialty doctors:', error);
    specialtyDoctors.value = [];
    alert('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
  } finally {
    loadingSpecialtyDoctors.value = false;
  }
}

function clearSelectedSpecialty() {
  selectedSpecialty.value = null;
  specialtyDoctors.value = [];
}

function viewDoctorDetail(doctorId) {
  router.push({
    name: 'doctordetail',
    params: { dr_id: doctorId }
  });
}

function selectDoctorForBooking(doctor) {
  selectedDoctorId.value = doctor.dr_id;
  onDoctorChange();
  
  // Scroll to booking section
  scrollToBooking();
}

// Hospital rating functions

async function loadRatings(page = 1) {
  if (!hospital.value?.h_id) return;
  
  loadingRatings.value = true;
  try {
    const response = await axios.get(
      `/feedback/hospital/${hospital.value.h_id}?page=${page}&limit=10`
    );
    
    if (response.data.success) {
      hospitalRatings.value = response.data.data.ratings || [];
      ratingSummary.value = {
        averageRating: response.data.data.averageRating || 0,
        totalRatings: response.data.data.ratings?.length || 0
      };
      ratingPagination.value = response.data.data.pagination;
      
      // Cập nhật currentUserId từ API nếu chưa có
      if (response.data.data.currentUserId && !currentUserId.value) {
        currentUserId.value = response.data.data.currentUserId;
      }
      
      // Check if current user has already rated - giống DoctorDetail.vue
      userHasRated.value = !!(response.data.data.myRating || hospitalRatings.value.some(r => r.isOwner));
    }
  } catch (error) {
    console.error('Error loading hospital ratings:', error);
    hospitalRatings.value = [];
    ratingSummary.value = { averageRating: 0, totalRatings: 0 };
  } finally {
    loadingRatings.value = false;
  }
}

function onRatingSubmitted() {
  // Reload ratings after submission
  loadRatings();
  userHasRated.value = true;
  closeRatingModal();
}

function openRatingModal() {
  editingRating.value = null;
  showRatingModal.value = true;
}

function closeRatingModal() {
  showRatingModal.value = false;
  editingRating.value = null;
}

// Edit rating state
const editingRating = ref(null);

// 🟩 Hàm sửa đánh giá - giống DoctorDetail.vue
function editHospitalRating(rating) {
  // Mở modal sửa, hoặc gọi lại modal cũ với dữ liệu có sẵn
  showRatingModal.value = true;
  editingRating.value = rating;

  // Bạn có thể truyền dữ liệu rating này vào modal (nếu modal hỗ trợ)
  console.log("Sửa đánh giá hospital:", rating);
}

// 🟥 Hàm xóa đánh giá - giống DoctorDetail.vue  
async function deleteHospitalRating(rating) {
  if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;

  try {
    await axios.delete(`/feedback/hospital-rating/${rating.id_fb_hos}`);

    alert("Đã xóa đánh giá!");
    await loadRatings(); // Reload lại danh sách đánh giá
  } catch (err) {
    console.error("Lỗi xóa đánh giá:", err);
    alert("Không thể xóa đánh giá. Vui lòng thử lại!");
  }
}

onMounted(async () => {
  try {
    const h_id = route.params.h_id;
    const res = await axios.get(`/hospitals/${h_id}`);
    hospital.value = res.data;
  } catch (err) {
    alert('Không thể tải dữ liệu bệnh viện');
    console.error(err);
  }

  // Load hospital specialties
  try {
    const h_id = route.params.h_id;
    const specialtiesRes = await axios.get(`/hospitals/${h_id}/specialties`);
    hospitalSpecialties.value = Array.isArray(specialtiesRes.data) ? specialtiesRes.data : [];
  } catch (err) {
    console.error('Không thể tải chuyên khoa:', err);
    hospitalSpecialties.value = [];
  }

  // Load all doctors then filter by hospital name (dr_h_name)
  try {
    const drRes = await axios.get(`/doctors`);
    doctors.value = Array.isArray(drRes.data) ? drRes.data : [];
    const hospitalName = hospital.value?.h_name || '';
    doctorsInHospital.value = doctors.value.filter((d) => (d?.dr_h_name || '').trim() === hospitalName);
  } catch {
    doctorsInHospital.value = [];
  }

  // Initialize days and default date
  daysList.value = getUpcomingDays();
  selectedDate.value = daysList.value[0]?.value || '';

  // Lấy current user id từ localStorage như DoctorDetail.vue
  try {
    currentUserId.value = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('userId')
      : null;
  } catch {
    currentUserId.value = null;
  }

  // Load hospital ratings
  await loadRatings();
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.content-main {
  margin: 0 auto;
  max-width: 1180px;
  padding: 48px 24px 32px 24px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.notification-yellow {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #78350f;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  font-size: 1.04rem;
  max-width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-left: 4px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-yellow:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.notification-icon {
  flex-shrink: 0;
  color: #f59e0b;
  margin-top: 2px;
}

.notification-blue {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e3a8a;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 38px;
  font-size: 1.06rem;
  max-width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-blue:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.notification-icon-blue {
  flex-shrink: 0;
  color: #3b82f6;
  margin-top: 2px;
}

.notification-blue ul {
  margin-left: 18px;
  margin-bottom: 0;
  padding-left: 17px;
  line-height: 1.8;
}

.notification-blue ul li {
  margin-bottom: 8px;
}

.time-slot.booked {
  background: #f3f4f6 !important;
  color: #9ca3af;
  border-color: #e5e7eb !important;
  pointer-events: none;
  opacity: 0.6;
}

.time-slot.available {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  transition: all 0.2s;
}

.time-slot.available:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.section {
  margin-top: 32px;
}

.section-title {
  color: #2875bb;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0f2fe;
}

.section-content {
  line-height: 1.8;
  color: #374151;
}

.section-content p {
  margin-bottom: 16px;
  font-size: 1.05rem;
}

.section-bold {
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 8px;
  color: #1e40af;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.address-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #2875bb;
  margin-top: 16px;
}

.address-card p {
  margin: 0;
  color: #475569;
}

@media (max-width: 900px) {
  .content-main {
    padding: 32px 8px 24px 8px;
  }
}

@media (max-width: 600px) {
  .content-main {
    padding: 18px 0 8px 0;
  }
  .notification-yellow,
  .notification-blue {
    font-size: 0.97rem;
    padding: 9px 7px 9px 9px;
  }
  .section-title {
    font-size: 1.01rem;
  }
}

/* Specialties Section Styles */
.specialties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.specialty-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.specialty-card.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.specialty-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
}

.specialty-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.specialty-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.specialty-card:hover .specialty-icon {
  transform: scale(1.1);
}

.specialty-info {
  flex: 1;
}

.specialty-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 6px 0;
  line-height: 1.3;
}

.doctor-count {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.specialty-description {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.no-specialties {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.no-specialties svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-specialties p {
  margin: 0;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .specialties-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .specialty-card {
    padding: 16px;
  }
  
  .specialty-header {
    gap: 12px;
  }
  
  .specialty-icon {
    width: 38px;
    height: 38px;
  }
  
  .specialty-name {
    font-size: 1rem;
  }
}

.hospital-home {
  min-height: 150vh;
  background: linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 50%, #ffffff 100%);
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Header với ảnh nền hospital */
.header-bg {
  position: relative;
  width: 100%;
  height: 380px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.7) contrast(1.1);
  z-index: 1;
  transition: transform 0.3s ease;
}

.header-bg:hover .header-img {
  transform: scale(1.05);
}

.header-overlay {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40px;
}

.header-content {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 28px 40px 24px 28px;
  margin-bottom: -50px;
  gap: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-wrapper {
  position: relative;
  flex-shrink: 0;
}

.logo {
  width: 88px;
  height: 88px;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 4px solid #e0f2fe;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-weight: 700;
  font-size: 2.2rem;
  margin: 0;
  color: #1e3a8a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.address {
  font-size: 1.05rem;
  color: #475569;
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* Tabs menu */
.menu-tabs-container {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: 70px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #e5e7eb;
}

.menu-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
  font-size: 1.04rem;
}

.menu-tabs .tab {
  padding: 16px 24px;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  background: transparent;
  position: relative;
  text-transform: uppercase;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.menu-tabs .tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #2875bb);
  transition: width 0.3s ease;
}

.menu-tabs .tab:hover {
  color: #2875bb;
  background: #f8fafc;
}

.menu-tabs .tab:hover::before,
.menu-tabs .tab.active::before {
  width: 80%;
}

.menu-tabs .tab.active {
  color: #2875bb;
  background: #f0f9ff;
}

/* Ask Section */
.ask-section {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);
  margin-top: 0;
  padding: 48px 24px 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ask-title {
  font-weight: 600;
  font-size: 1.25rem;
  margin-bottom: 24px;
  color: #1e3a8a;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ask-box {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
  padding: 12px 16px 12px 20px;
  width: 100%;
  min-width: 300px;
  max-width: 650px;
  margin-bottom: 16px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  border: 2px solid transparent;
}

.ask-box:focus-within {
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.ask-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1.05rem;
  background: transparent;
  color: #1f2937;
}

.ask-input::placeholder {
  color: #9ca3af;
}

.ask-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2875bb 100%);
  border: none;
  outline: none;
  cursor: pointer;
  margin-left: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.ask-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.ask-btn svg {
  stroke: #fff;
}

.ask-options {
  display: flex;
  gap: 32px;
  font-size: 1rem;
  color: #1e40af;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.ask-options span {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.ask-options span:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* FAQ Section */
.faq-section {
  margin: 64px auto 0 auto;
  max-width: 1180px;
  padding: 0 24px 48px 24px;
}

.faq-header {
  text-align: center;
  margin-bottom: 40px;
}

.faq-header h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.faq-header p {
  font-size: 1.1rem;
  color: #64748b;
}

.faq-grid {
  display: flex;
  gap: 32px;
  justify-content: center;
}

.faq-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 340px;
  max-width: 540px;
}

.faq-item {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.faq-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.faq-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6, #2875bb);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.faq-item:hover::before,
.faq-item.active::before {
  transform: scaleY(1);
}

.faq-item:hover {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
  border-color: #dbeafe;
  background: #f8fafc;
}

.faq-question {
  color: #1e3a8a;
  font-size: 1.08rem;
  font-weight: 600;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.faq-item.active .faq-question {
  color: #2875bb;
}

.faq-answer {
  color: #475569;
  font-size: 1rem;
  line-height: 1.7;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-expand {
  font-size: 1.5rem;
  color: #3b82f6;
  font-weight: bold;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eff6ff;
  transition: all 0.3s ease;
  flex-shrink: 0;
  line-height: 1;
}

.faq-item:hover .faq-expand {
  background: #dbeafe;
  transform: rotate(90deg);
}

.faq-expand.expanded {
  background: #3b82f6;
  color: #fff;
  transform: rotate(45deg);
}

/* Booking Section */
.booking-section {
  margin-top: 24px;
}

.booking-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.booking-filters {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.filter-group {
  flex: 1;
  min-width: 250px;
}

.filter-group label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 10px;
  font-size: 1rem;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dbeafe;
  border-radius: 10px;
  font-size: 1rem;
  background: #fff;
  color: #1f2937;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233b82f6' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:hover {
  border-color: #93c5fd;
}

.slots-container {
  margin-top: 24px;
}

.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.slots-header span:first-child {
  font-size: 1.15rem;
  font-weight: 600;
  color: #1e3a8a;
}

.fee-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.slots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.time-slot {
  padding: 12px 20px;
  border: 2px solid #dbeafe;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-state svg {
  margin: 0 auto 20px;
  color: #cbd5e1;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

@media (max-width: 900px) {
  .content-main {
    padding: 32px 16px 24px 16px;
  }

  .faq-grid {
    flex-direction: column;
    gap: 20px;
  }

  .faq-col {
    min-width: unset;
    max-width: 100%;
  }

  .faq-header h3 {
    font-size: 1.5rem;
  }

  .ask-box {
    width: 100%;
    max-width: 100%;
    min-width: unset;
  }

  .header-content {
    width: 95%;
    max-width: 95%;
    padding: 20px 24px 18px 20px;
    gap: 16px;
  }

  .booking-card {
    padding: 24px 20px;
  }

  .booking-filters {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .slots-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .menu-tabs {
    padding: 0 16px;
    flex-wrap: wrap;
    gap: 4px;
  }

  .menu-tabs .tab {
    padding: 12px 16px;
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px 16px 14px 16px;
    margin-bottom: -30px;
    width: 90%;
  }

  .logo {
    width: 64px;
    height: 64px;
  }

  .title {
    font-size: 1.5rem;
  }

  .header-bg,
  .header-img {
    height: 240px;
  }

  .menu-tabs-container {
    margin-top: 50px;
  }

  .menu-tabs {
    flex-direction: row;
    overflow-x: auto;
    padding: 0 12px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .menu-tabs::-webkit-scrollbar {
    display: none;
  }

  .menu-tabs .tab {
    padding: 12px 14px;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .ask-section {
    padding: 32px 16px 24px 16px;
  }

  .ask-title {
    font-size: 1rem;
    flex-wrap: wrap;
  }

  .ask-options {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .ask-options span {
    width: 100%;
    justify-content: center;
  }

  .faq-header h3 {
    font-size: 1.3rem;
  }

  .faq-header p {
    font-size: 0.95rem;
  }

  .notification-yellow,
  .notification-blue {
    font-size: 0.95rem;
    padding: 16px 18px;
    flex-direction: column;
    gap: 12px;
  }

  .notification-icon,
  .notification-icon-blue {
    align-self: flex-start;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .booking-card {
    padding: 20px 16px;
  }

  .slots-list {
    gap: 8px;
  }

  .time-slot {
    min-width: 100px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

/* Doctors by Specialty Section */
.doctors-by-specialty-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px solid #e0f2fe;
}

.doctors-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.doctors-section-header h3 {
  color: #2875bb;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.clear-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.doctor-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.doctor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.doctor-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
  border: 3px solid #e0f2fe;
}

.doctor-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doctor-info {
  text-align: center;
}

.doctor-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.doctor-specialty {
  color: #3b82f6;
  font-weight: 600;
  margin: 4px 0;
  font-size: 0.95rem;
}

.doctor-experience {
  color: #64748b;
  font-size: 0.9rem;
  margin: 4px 0;
}

.doctor-price {
  color: #059669;
  font-weight: 700;
  font-size: 1.05rem;
  margin: 8px 0 16px 0;
}

.book-doctor-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2875bb 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  width: 100%;
}

.book-doctor-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.no-doctors {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin-top: 32px;
}

.no-doctors svg {
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-doctors p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .doctors-grid {
    grid-template-columns: 1fr;
  }
  
  .doctors-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .doctors-section-header h3 {
    font-size: 1.2rem;
  }
  
  .clear-btn {
    align-self: flex-end;
  }
}

/* Edit Rating Modal Specific Styles */
.rating-modal .form-group {
  margin-bottom: 20px;
}

.rating-modal .form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.rating-modal .star-rating {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.rating-modal .star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #d1d5db;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.rating-modal .star-btn:hover {
  transform: scale(1.1);
  color: #fbbf24;
}

.rating-modal .star-btn.active {
  color: #f59e0b;
}

.rating-modal .rating-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.rating-modal .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.rating-modal .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rating-modal .char-count {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.75rem;
  text-align: right;
}

.rating-modal .rating-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.rating-modal .cancel-btn {
  padding: 10px 20px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.rating-modal .cancel-btn:hover {
  background: #4b5563;
}

.rating-modal .submit-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 140px;
}

.rating-modal .submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.rating-modal .submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.rating-modal .close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rating-modal .close-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

/* Rating Section Styles - giống DoctorDetail.vue */
.rating-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.rate-hospital-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rate-hospital-btn:hover {
  background: #2563eb;
}

.rating-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.delete-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}
</style>
