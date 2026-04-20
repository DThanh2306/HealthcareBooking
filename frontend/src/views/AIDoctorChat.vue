<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';

const messages = ref([]);
const inputMessage = ref('');
const conversationId = ref(null);
const loadingInitial = ref(true);
const sending = ref(false);
const errorMessage = ref('');
const conversationState = reactive({});
const recommendations = ref(null);
const router = useRouter();

function openInNewTab(routeLocation) {
  // Resolve route to absolute href and open in a new tab
  const resolved = router.resolve(routeLocation);
  const href = resolved?.href || (typeof routeLocation === 'string' ? routeLocation : '/');
  window.open(href, '_blank');
}

function goHospitalDetail(h) {
  if (!h || h.inDatabase === false) return;
  const id = h.h_id || h.dbId;
  if (!id) return;
  openInNewTab({ path: `/hospital/${id}` });
}

function goDoctorDetail(d) {
  const did = d?.dr_id || d?.id;
  if (!did) return;
  openInNewTab({ name: 'doctordetail', params: { dr_id: did } });
}
const distanceFilterKm = ref(null);

const defaultRadiusKm = 50;
const filteredHospitals = computed(() => {
  if (!recommendations.value?.hospitals) return [];
  // Always exclude hospitals outside the system
  const inSystem = recommendations.value.hospitals.filter((h) => h.inDatabase !== false);
  // Determine current radius: user-selected or default
  const radius =
    typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : defaultRadiusKm;
  // Keep only nearby hospitals based on distance or sameProvince heuristic
  return inSystem.filter(
    (h) =>
      (typeof h.distance === 'number' && h.distance <= radius) || (!h.distance && h.sameProvince)
  );
});

const filteredDoctors = computed(() => {
  if (!recommendations.value?.doctors) return [];
  const radius =
    typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : defaultRadiusKm;
  return recommendations.value.doctors.filter(
    (d) =>
      (typeof d.distance === 'number' && d.distance <= radius) || (!d.distance && d.sameProvince)
  );
});
const chatBodyRef = ref(null);
const isDarkMode = ref(false);
const messageHistory = ref([]);
const currentMessageIndex = ref(-1);

const isCompleted = computed(() => Boolean(recommendations.value));
const stateEntries = computed(() =>
  Object.entries(conversationState).filter(([key]) => key !== '_symptomAnalysis')
);
const stateLabels = {
  gender: 'Giới tính',
  age: 'Tuổi',
  location: 'Khu vực',
  primaryConcern: 'Triệu chứng chính',
  symptomDuration: 'Thời gian xuất hiện',
  medicalHistory: 'Tiền sử sức khỏe'
};

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
    }
  });
}

function addMessage(role, content) {
  messages.value.push({
    id: `${role}-${Date.now()}-${Math.random()}`,
    role,
    content
  });
  scrollToBottom();
}

async function startConversation() {
  loadingInitial.value = true;
  errorMessage.value = '';
  messages.value = [];
  recommendations.value = null;
  Object.keys(conversationState).forEach((key) => delete conversationState[key]);

  try {
    const response = await axios.post('/ai-doctor/start');
    if (response.data?.success) {
      conversationId.value = response.data.data.conversationId;
      addMessage('assistant', response.data.data.message);
    } else {
      throw new Error(response.data?.message || 'Không thể khởi tạo cuộc trò chuyện.');
    }
  } catch (error) {
    console.error('startConversation error:', error);
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối tới bác sĩ AI. Vui lòng kiểm tra lại máy chủ.';
  } finally {
    loadingInitial.value = false;
  }
}

async function sendMessage() {
  if (!conversationId.value || !inputMessage.value.trim() || sending.value) {
    return;
  }

  const message = inputMessage.value.trim();

  // Save message to history for navigation
  messageHistory.value.push(message);
  currentMessageIndex.value = messageHistory.value.length - 1;

  inputMessage.value = '';
  addMessage('user', message);
  sending.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('/ai-doctor/message', {
      conversationId: conversationId.value,
      message,
      radiusKm: typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : undefined
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không nhận được trả lời từ bác sĩ AI.');
    }

    const data = response.data.data;
    if (data.state) {
      Object.assign(conversationState, data.state);
    }

    addMessage('assistant', data.message);

    if (data.recommendations) {
      recommendations.value = data.recommendations;
    }
  } catch (error) {
    console.error('sendMessage error:', error);
    errorMessage.value =
      error.response?.data?.message || error.message || 'Bác sĩ AI đang bận. Vui lòng thử lại sau.';
    addMessage(
      'assistant',
      'Xin lỗi bạn, hiện tôi đang gặp vấn đề khi xử lý câu trả lời. Bạn có thể thử lại sau ít phút nhé.'
    );
  } finally {
    sending.value = false;
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark', isDarkMode.value);
}

function navigateMessage(direction) {
  if (direction === 'prev' && currentMessageIndex.value > 0) {
    currentMessageIndex.value--;
    inputMessage.value = messageHistory.value[currentMessageIndex.value];
  } else if (direction === 'next' && currentMessageIndex.value < messageHistory.value.length - 1) {
    currentMessageIndex.value++;
    inputMessage.value = messageHistory.value[currentMessageIndex.value];
  } else if (
    direction === 'next' &&
    currentMessageIndex.value === messageHistory.value.length - 1
  ) {
    currentMessageIndex.value = messageHistory.value.length;
    inputMessage.value = '';
  }
}

function clearInput() {
  inputMessage.value = '';
  currentMessageIndex.value = messageHistory.value.length;
}

function editMessage(messageId, messageRole) {
  if (messageRole === 'user') {
    const message = messages.value.find((m) => m.id === messageId);
    if (message) {
      inputMessage.value = message.content;
      // Remove this message and all subsequent messages
      const messageIndex = messages.value.findIndex((m) => m.id === messageId);
      messages.value.splice(messageIndex);
      recommendations.value = null;
    }
  }
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Đang cập nhật';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return `${number.toLocaleString('vi-VN')} đ`;
}

function getUrgencyClass(urgencyLevel) {
  const classes = {
    'khẩn cấp': 'urgency-emergency',
    'cần khám sớm': 'urgency-soon',
    'có thể đợi': 'urgency-normal',
    'bình thường': 'urgency-normal'
  };
  return classes[urgencyLevel] || 'urgency-normal';
}

function getUrgencyIcon(urgencyLevel) {
  const icons = {
    'khẩn cấp': '🚨',
    'cần khám sớm': '⚠️',
    'có thể đợi': '📅',
    'bình thường': '✅'
  };
  return icons[urgencyLevel] || '✅';
}

function getUrgencyText(urgencyLevel) {
  const texts = {
    'khẩn cấp': 'Cần cấp cứu ngay',
    'cần khám sớm': 'Nên khám trong vài ngày',
    'có thể đợi': 'Có thể đợi khám',
    'bình thường': 'Tình trạng bình thường'
  };
  return texts[urgencyLevel] || 'Tình trạng bình thường';
}

onMounted(() => {
  startConversation();
  // Initialize dark mode from localStorage
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  }
});

// Watch for dark mode changes and save to localStorage
watch(isDarkMode, (newValue) => {
  localStorage.setItem('darkMode', newValue.toString());
});
</script>

<template>
  <div
    class="ai-doctor-page"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <div class="chat-container">
      <header class="chat-header">
        <div class="header-content">
          <div class="header-title">
            <h1>🩺 Bác sĩ AI</h1>
            <div class="ai-status">
              <div
                class="status-indicator"
                :class="{ active: !loadingInitial }"
              ></div>
              <span>{{ loadingInitial ? 'Đang kết nối...' : 'Trực tuyến' }}</span>
            </div>
          </div>
          <p>
            Trò chuyện với bác sĩ AI để được gợi ý chuyên khoa, bệnh viện, bác sĩ phù hợp. Đây là tư
            vấn tham khảo và không thay thế khám chữa bệnh trực tiếp.
          </p>
        </div>
        <div class="header-controls">
          <button
            class="control-btn dark-mode-btn"
            @click="toggleDarkMode"
            :title="isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
          <button
            class="control-btn restart-btn"
            @click="startConversation"
            :disabled="loadingInitial || sending"
            title="Bắt đầu lại cuộc trò chuyện"
          >
            🔄 Bắt đầu lại
          </button>
        </div>
      </header>

      <div
        class="chat-body"
        ref="chatBodyRef"
      >
        <div
          v-if="loadingInitial"
          class="chat-loading"
        >
          <div class="spinner"></div>
          <p>Đang kết nối với bác sĩ AI...</p>
        </div>

        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            class="chat-message"
            :class="message.role"
          >
            <div class="avatar">
              <span v-if="message.role === 'assistant'">🩺</span>
              <span v-else>👤</span>
            </div>
            <div class="message-wrapper">
              <div
                class="bubble"
                v-html="message.content.replace(/\n/g, '<br/>')"
              ></div>
              <div
                class="message-actions"
                v-if="message.role === 'user'"
              >
                <button
                  class="action-btn edit-btn"
                  @click="editMessage(message.id, message.role)"
                  title="Chỉnh sửa tin nhắn này"
                >
                  ✏️
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="sending"
            class="chat-message assistant typing"
          >
            <div class="avatar">🩺</div>
            <div class="bubble typing-indicator"><span></span><span></span><span></span></div>
          </div>
        </template>
      </div>

      <div class="chat-footer">
        <div class="input-wrapper">
          <div class="input-container">
            <textarea
              v-model="inputMessage"
              :disabled="loadingInitial || sending || isCompleted"
              placeholder="Nhập câu trả lời của bạn..."
              @keyup.enter.exact.prevent="sendMessage"
              @keyup.up.prevent="navigateMessage('prev')"
              @keyup.down.prevent="navigateMessage('next')"
            />
            <div class="input-actions">
              <button
                v-if="inputMessage.trim()"
                class="action-btn clear-btn"
                @click="clearInput"
                title="Xóa tin nhắn"
              >
                ✖️
              </button>
              <button
                class="action-btn nav-btn"
                @click="navigateMessage('prev')"
                :disabled="currentMessageIndex <= 0 || !messageHistory.length"
                title="Tin nhắn trước (↑)"
              >
                ⬆️
              </button>
              <button
                class="action-btn nav-btn"
                @click="navigateMessage('next')"
                :disabled="currentMessageIndex >= messageHistory.length"
                title="Tin nhắn sau (↓)"
              >
                ⬇️
              </button>
            </div>
          </div>
          <button
            class="send-btn"
            :disabled="!inputMessage.trim() || loadingInitial || sending || isCompleted"
            @click="sendMessage"
          >
            <span v-if="sending">⏳</span>
            <span v-else>📤</span>
            Gửi
          </button>
        </div>
        <p class="disclaimer">
          Bác sĩ AI chỉ mang tính tham khảo. Nếu bạn có dấu hiệu nguy hiểm (sốt cao, khó thở, đau
          ngực dữ dội...), hãy liên hệ cấp cứu 115 hoặc đến cơ sở y tế gần nhất.
        </p>
        <p
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </p>
      </div>
    </div>

    <aside class="sidebar">
      <section class="info-card">
        <h2>Thông tin đã thu thập</h2>
        <ul>
          <li
            v-for="[key, value] in stateEntries"
            :key="key"
          >
            <strong>{{ stateLabels[key] || key }}</strong>
            <span>{{ value }}</span>
          </li>
          <li v-if="!stateEntries.length">
            Chưa có thông tin. Hãy bắt đầu trả lời các câu hỏi nhé.
          </li>
        </ul>
      </section>

      <section
        v-if="recommendations"
        class="info-card"
      >
        <h2>Kết quả gợi ý</h2>

        <div
          v-if="recommendations.specialties?.length"
          class="result-block"
        >
          <h3>Chuyên khoa phù hợp</h3>
          <div class="chip-list">
            <span
              v-for="specialty in recommendations.specialties"
              :key="specialty"
              class="chip"
            >
              {{ specialty }}
            </span>
          </div>
        </div>

        <div class="result-block">
          <h3>Bác sĩ đề xuất</h3>
          <div class="filter-row">
            <label style="font-weight: 600; color: #475569">
              Lọc theo bán kính:
              <select v-model.number="distanceFilterKm">
                <option :value="null">Tất cả</option>
                <option :value="5">≤ 5 km</option>
                <option :value="10">≤ 10 km</option>
                <option :value="20">≤ 20 km</option>
                <option :value="50">≤ 50 km</option>
                <option :value="100">≤ 100 km</option>
                <option :value="150">≤ 150 km</option>
                <option :value="200">≤ 200 km</option>
              </select>
            </label>
          </div>
          <div
            v-if="filteredDoctors.length === 0"
            class="empty-state"
            style="color: #475569; font-weight: 600"
          >
            Không tìm thấy bác sĩ phù hợp với bạn.
          </div>
          <article
            v-else
            v-for="doctor in filteredDoctors"
            :key="doctor.id || doctor.name"
            class="doctor-card"
            :class="{ disabled: !(doctor.dr_id || doctor.id) }"
            @click="goDoctorDetail(doctor)"
          >
            <div class="doctor-info">
              <div class="hospital-header">
                <h4>{{ doctor.name }}</h4>
                <span
                  v-if="doctor.distanceText"
                  class="distance-badge"
                  title="Khoảng cách tới cơ sở làm việc"
                >
                  {{ doctor.distanceText }}
                </span>
              </div>
              <p class="doctor-specialty">{{ doctor.specialty }}</p>
              <p class="doctor-hospital">
                {{ doctor.hospitalName }}
              </p>
              <p
                v-if="doctor.hospitalAddress"
                class="doctor-address"
              >
                {{ doctor.hospitalAddress }}
              </p>
            </div>
            <div class="doctor-meta">
              <span class="price">{{ formatPrice(doctor.price) }}</span>
              <span
                class="score"
                v-if="doctor.matchScore"
              >
                Độ phù hợp: {{ (doctor.matchScore * 100).toFixed(0) }}%
              </span>
            </div>
          </article>
        </div>

        <!-- Enhanced Medical Context Display -->
        <div
          v-if="recommendations._symptomAnalysis"
          class="result-block medical-context"
        >
          <h3>Phân tích y khoa</h3>
          <div class="medical-info">
            <div
              class="urgency-level"
              :class="getUrgencyClass(recommendations._symptomAnalysis.urgencyLevel)"
            >
              <span class="urgency-icon">{{
                getUrgencyIcon(recommendations._symptomAnalysis.urgencyLevel)
              }}</span>
              <span class="urgency-text">{{
                getUrgencyText(recommendations._symptomAnalysis.urgencyLevel)
              }}</span>
            </div>
            <div
              v-if="recommendations._symptomAnalysis.matchedSymptoms?.length"
              class="matched-symptoms"
            >
              <strong>Triệu chứng được nhận diện:</strong>
              <div class="symptom-tags">
                <span
                  v-for="symptom in recommendations._symptomAnalysis.matchedSymptoms"
                  :key="symptom"
                  class="symptom-tag"
                >
                  {{ symptom }}
                </span>
              </div>
            </div>
            <div class="confidence-score">
              <strong>Độ tin cậy phân tích:</strong>
              <div class="confidence-bar">
                <div
                  class="confidence-fill"
                  :style="{ width: recommendations._symptomAnalysis.confidence * 100 + '%' }"
                ></div>
              </div>
              <span>{{ (recommendations._symptomAnalysis.confidence * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div
          v-if="recommendations.hospitals?.length"
          class="result-block"
        >
          <h3>Cơ sở y tế gợi ý</h3>
          <div class="filter-row">
            <label style="font-weight: 600; color: #475569">
              Lọc theo bán kính:
              <select v-model.number="distanceFilterKm">
                <option :value="null">Tất cả</option>
                <option :value="5">≤ 5 km</option>
                <option :value="10">≤ 10 km</option>
                <option :value="20">≤ 20 km</option>
                <option :value="50">≤ 50 km</option>
                <option :value="100">≤ 100 km</option>
                <option :value="150">≤ 150 km</option>
                <option :value="200">≤ 200 km</option>
              </select>
            </label>
          </div>
          <div
            v-if="filteredHospitals.length === 0"
            class="empty-state"
            style="color: #475569; font-weight: 600"
          >
            Không tìm thấy cơ sở y tế phù hợp trong bán kính
            {{ typeof distanceFilterKm === 'number' ? distanceFilterKm : defaultRadiusKm }} km.
          </div>
          <article
            v-else
            v-for="hospital in filteredHospitals"
            :key="hospital.id || hospital.name"
            class="hospital-card"
            :class="{
              disabled: hospital.inDatabase === false || !(hospital.h_id || hospital.dbId)
            }"
            @click="goHospitalDetail(hospital)"
          >
            <div class="hospital-header">
              <h4>{{ hospital.name }}</h4>
              <span
                v-if="hospital.inDatabase === false"
                class="external-badge"
                title="Bệnh viện ngoài hệ thống"
                >Ngoài hệ thống</span
              >
              <span
                v-if="hospital.distanceText"
                class="distance-badge"
                :title="
                  hospital.locationMethod === 'gps'
                    ? 'Khoảng cách tính theo GPS'
                    : 'Khoảng cách ước lượng'
                "
              >
                {{ hospital.distanceText }}
              </span>
            </div>
            <p v-if="hospital.address">{{ hospital.address }}</p>
            <p v-if="hospital.phone">Điện thoại: {{ hospital.phone }}</p>
          </article>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.ai-doctor-page {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 24px 32px 32px;
  background: linear-gradient(135deg, #f5f7fb 0%, #e0f2fe 100%);
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.ai-doctor-page.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.dark-mode .chat-container,
.dark-mode .info-card {
  background: #1e293b;
  border: 1px solid #334155;
  color: #010811;
}

.dark-mode .chat-header {
  border-bottom-color: #334155;
}

.dark-mode .chat-body {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}

.dark-mode .bubble {
  background: #334155;
  color: #e2e8f0;
}

.dark-mode .chat-message.user .bubble {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
}

.dark-mode .input-wrapper textarea {
  background: #334155;
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .input-wrapper textarea::placeholder {
  color: #94a3b8;
}

.dark-mode .chat-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.chat-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(10px);
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1e293b;
  background: #175457;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #64748b;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.status-indicator.active {
  background: #10b981;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.chat-header p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.control-btn {
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark-mode-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.restart-btn {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
}

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.chat-body {
  min-height: 400px;
  max-height: 2000px;
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
}

.chat-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #475569;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #cbd5f5;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-message .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.chat-message.user .avatar {
  background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%);
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 75%;
}

.chat-message .bubble {
  padding: 16px 20px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  line-height: 1.6;
  font-size: 0.95rem;
  color: #1e293b;
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.chat-message.user .bubble {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chat-message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.1);
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.typing .bubble {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  display: inline-block;
  animation: blink 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}

.chat-footer {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-container {
  flex: 1;
  position: relative;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.dark-mode .input-container {
  background: #334155;
  border-color: #475569;
}

.input-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15);
}

.input-wrapper textarea {
  width: 100%;
  box-sizing: border-box;
  padding-right: 90px;
  padding: 16px 20px;
  border: none;
  border-radius: 0;
  resize: none;
  min-height: 70px;
  font-size: 0.95rem;
  font-family: inherit;
  background: transparent;
  outline: none;
  color: #1e293b;
}

.input-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  background: rgba(248, 250, 252, 0.9);
  padding: 4px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.input-actions .action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 14px;
}

.nav-btn:disabled {
  opacity: 0.3;
}

.send-btn {
  padding: 16px 24px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 70px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.send-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
}

.disclaimer {
  margin: 12px 0 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
}

.error-message {
  margin-top: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.dark-mode .info-card h2 {
  margin: 0 0 16px;
  color: #f0f2f6;
}

.info-card h2 {
  color: #02060c;
}

.info-card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.info-card li strong {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #475569;
  letter-spacing: 0.02em;
}

.dark-mode .info-card li span {
  color: #0f172a;
  font-weight: 600;
}

.info-card li,
.info-card li span {
  color: #0f172a;
}

.result-block {
  margin-bottom: 20px;
}

.result-block h3 {
  margin: 0 0 12px;
  color: #1e293b;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
  font-size: 0.85rem;
}

.doctor-card,
.hospital-card {
  color: #475569;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: #f8fafc;
  margin-bottom: 12px;
}

.hospital-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hospital-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.doctor-card h4,
.hospital-card h4 {
  margin: 0 0 8px;
  color: #1e293b;
}

.distance-badge {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.filter-row {
  margin: 8px 0 12px;
}
.filter-row select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.distance-badge {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.doctor-specialty {
  margin: 4px 0;
  color: #0f172a;
  font-weight: 600;
}

.doctor-hospital,
.doctor-address {
  margin: 2px 0;
  color: #475569;
  font-size: 0.9rem;
}

.doctor-meta {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 0.9rem;
}

.doctor-meta .price {
  color: #0f172a;
}

.doctor-meta .score {
  color: #16a34a;
}

/* Enhanced Medical Context Styles */
.medical-context {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 16px;
  padding: 20px;
}

.medical-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.urgency-level {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
}

.urgency-emergency {
  background: #fee2e2;
  color: #dc2626;
  border: 2px solid #f87171;
}

.urgency-soon {
  background: #fef3c7;
  color: #d97706;
  border: 2px solid #fbbf24;
}

.urgency-normal {
  background: #dcfce7;
  color: #16a34a;
  border: 2px solid #4ade80;
}

.urgency-icon {
  font-size: 1.2rem;
}

.matched-symptoms {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.symptom-tag {
  padding: 6px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.confidence-score {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confidence-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

@media (max-width: 1200px) {
  .ai-doctor-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .ai-doctor-page {
    padding: 16px;
  }

  .chat-container {
    border-radius: 16px;
  }

  .chat-header {
    flex-direction: column;
    align-items: stretch;
  }

  .input-wrapper {
    flex-direction: column;
  }

  .input-wrapper textarea {
    min-height: 120px;
  }

  .send-btn {
    width: 100%;
    height: 48px;
  }
}
.hospital-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.external-badge {
  margin-left: 8px;
  background: #f97316;
  color: #fff;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
}
.doctor-hospital.linkable {
  cursor: pointer;
  text-decoration: underline;
}
</style>
