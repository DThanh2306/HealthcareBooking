<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';

// ─── State ────────────────────────────────────────────────────────────────────
const messages = ref([]);
const conversationId = ref(null);
const loadingInitial = ref(true);
const sending = ref(false);
const errorMessage = ref('');
const conversationState = reactive({});
const recommendations = ref(null);
const router = useRouter();

// ─── Guided input state ───────────────────────────────────────────────────────
const inputConfig = ref(null);         // { type, options, allowFreetext, ... }
const selectedChips = ref([]);         // single: string[], multi: string[]
const freetextValue = ref('');         // freetext kèm theo
const gpsLoading = ref(false);

// ─── Chat refs ────────────────────────────────────────────────────────────────
const chatBodyRef = ref(null);
const isDarkMode = ref(false);
const distanceFilterKm = ref(null);
const defaultRadiusKm = 50;

// ─── Computed ─────────────────────────────────────────────────────────────────
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
  medicalHistory: 'Tiền sử sức khỏe',
};

// Giá trị sẽ gửi lên BE — ưu tiên chip đã chọn, fallback về freetext
const resolvedMessage = computed(() => {
  if (!inputConfig.value) return freetextValue.value.trim();

  const { type } = inputConfig.value;

  if (type === 'multi') {
    // Lọc bỏ chip "Khác..." vì đã có freetext
    const chips = selectedChips.value.filter((c) => c !== 'Khác...');
    const parts = [...chips];
    if (freetextValue.value.trim()) parts.push(freetextValue.value.trim());
    return parts.join(', ');
  }

  if (type === 'single' || type === 'location') {
    if (selectedChips.value.length > 0) {
      const chip = selectedChips.value[0];
      // Nếu chip là nhóm tuổi → gửi nguyên, BE sẽ validate
      if (freetextValue.value.trim() && chip === freetextValue.value.trim()) {
        return freetextValue.value.trim();
      }
      return freetextValue.value.trim() || chip;
    }
    return freetextValue.value.trim();
  }

  return freetextValue.value.trim();
});

const canSend = computed(() => {
  if (isCompleted.value || sending.value || loadingInitial.value) return false;
  return resolvedMessage.value.length > 0;
});

const filteredHospitals = computed(() => {
  if (!recommendations.value?.hospitals) return [];
  const inSystem = recommendations.value.hospitals.filter((h) => h.inDatabase !== false);
  const radius = typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : defaultRadiusKm;
  return inSystem.filter(
    (h) => (typeof h.distance === 'number' && h.distance <= radius) || (!h.distance && h.sameProvince)
  );
});

const filteredDoctors = computed(() => {
  if (!recommendations.value?.doctors) return [];
  const radius = typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : defaultRadiusKm;
  return recommendations.value.doctors.filter(
    (d) => (typeof d.distance === 'number' && d.distance <= radius) || (!d.distance && d.sameProvince)
  );
});

// ─── Chip logic ───────────────────────────────────────────────────────────────
function toggleChip(option) {
  if (!inputConfig.value) return;
  const { type } = inputConfig.value;

  if (type === 'single' || type === 'location') {
    if (selectedChips.value[0] === option) {
      selectedChips.value = [];
    } else {
      selectedChips.value = [option];
      // Khi chọn chip → clear freetext (trừ location vì có thể nhập địa chỉ rõ hơn)
      if (type !== 'location') freetextValue.value = '';
    }
  } else if (type === 'multi') {
    const idx = selectedChips.value.indexOf(option);
    if (idx >= 0) {
      selectedChips.value.splice(idx, 1);
    } else {
      selectedChips.value.push(option);
    }
  }
}

function isChipSelected(option) {
  return selectedChips.value.includes(option);
}

// ─── GPS ──────────────────────────────────────────────────────────────────────
async function useGPSLocation() {
  if (!navigator.geolocation) {
    errorMessage.value = 'Trình duyệt không hỗ trợ GPS.';
    return;
  }
  gpsLoading.value = true;
  errorMessage.value = '';
  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );
    const { latitude, longitude } = position.coords;
    freetextValue.value = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    selectedChips.value = [];
  } catch {
    errorMessage.value = 'Không thể lấy vị trí GPS. Vui lòng nhập địa chỉ thủ công.';
  } finally {
    gpsLoading.value = false;
  }
}

// ─── Reset input sau khi gửi ──────────────────────────────────────────────────
function resetInput() {
  selectedChips.value = [];
  freetextValue.value = '';
}

function applyInputConfig(config) {
  inputConfig.value = config || null;
  resetInput();
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────
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
    content,
  });
  scrollToBottom();
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function startConversation() {
  loadingInitial.value = true;
  errorMessage.value = '';
  messages.value = [];
  recommendations.value = null;
  inputConfig.value = null;
  resetInput();
  Object.keys(conversationState).forEach((key) => delete conversationState[key]);

  try {
    const response = await axios.post('/ai-doctor/start');
    if (response.data?.success) {
      const data = response.data.data;
      conversationId.value = data.conversationId;
      addMessage('assistant', data.message);
      applyInputConfig(data.inputConfig);
    } else {
      throw new Error(response.data?.message || 'Không thể khởi tạo cuộc trò chuyện.');
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || error.message || 'Không thể kết nối tới bác sĩ AI.';
  } finally {
    loadingInitial.value = false;
  }
}

async function sendMessage() {
  if (!canSend.value) return;

  const message = resolvedMessage.value;
  addMessage('user', message);
  resetInput();
  sending.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('/ai-doctor/message', {
      conversationId: conversationId.value,
      message,
      radiusKm: typeof distanceFilterKm.value === 'number' ? distanceFilterKm.value : undefined,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không nhận được trả lời từ bác sĩ AI.');
    }

    const data = response.data.data;
    if (data.state) Object.assign(conversationState, data.state);

    addMessage('assistant', data.message);
    applyInputConfig(data.inputConfig || null);

    if (data.recommendations) {
      recommendations.value = data.recommendations;
      inputConfig.value = null; // ẩn input khi xong
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || error.message || 'Bác sĩ AI đang bận. Vui lòng thử lại.';
    addMessage('assistant', 'Xin lỗi bạn, tôi đang gặp sự cố. Bạn có thể thử lại sau ít phút.');
  } finally {
    sending.value = false;
  }
}

// ─── Navigation helpers ───────────────────────────────────────────────────────
function openInNewTab(routeLocation) {
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

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark', isDarkMode.value);
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Đang cập nhật';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return `${number.toLocaleString('vi-VN')} đ`;
}

function getUrgencyClass(u) {
  return { 'khẩn cấp': 'urgency-emergency', 'cần khám sớm': 'urgency-soon' }[u] || 'urgency-normal';
}
function getUrgencyIcon(u) {
  return { 'khẩn cấp': '🚨', 'cần khám sớm': '⚠️', 'có thể đợi': '📅' }[u] || '✅';
}
function getUrgencyText(u) {
  return (
    { 'khẩn cấp': 'Cần cấp cứu ngay', 'cần khám sớm': 'Nên khám trong vài ngày', 'có thể đợi': 'Có thể đợi khám' }[u] ||
    'Tình trạng bình thường'
  );
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  startConversation();
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  }
});

watch(isDarkMode, (v) => localStorage.setItem('darkMode', v.toString()));
</script>

<template>
  <div class="ai-doctor-page" :class="{ 'dark-mode': isDarkMode }">

    <!-- ── Chat panel ── -->
    <div class="chat-container">
      <header class="chat-header">
        <div class="header-content">
          <div class="header-title">
            <h1>🩺 Bác sĩ AI</h1>
            <div class="ai-status">
              <div class="status-indicator" :class="{ active: !loadingInitial }"></div>
              <span>{{ loadingInitial ? 'Đang kết nối...' : 'Trực tuyến' }}</span>
            </div>
          </div>
          <p>Trả lời các câu hỏi để nhận gợi ý chuyên khoa, bác sĩ và bệnh viện phù hợp.</p>
        </div>
        <div class="header-controls">
          <button class="control-btn dark-mode-btn" @click="toggleDarkMode"
            :title="isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
          <button class="control-btn restart-btn" @click="startConversation"
            :disabled="loadingInitial || sending" title="Bắt đầu lại">
            🔄 Bắt đầu lại
          </button>
        </div>
      </header>

      <!-- Messages -->
      <div class="chat-body" ref="chatBodyRef">
        <div v-if="loadingInitial" class="chat-loading">
          <div class="spinner"></div>
          <p>Đang kết nối với bác sĩ AI...</p>
        </div>

        <template v-else>
          <div v-for="message in messages" :key="message.id"
            class="chat-message" :class="message.role">
            <div class="avatar">
              <span v-if="message.role === 'assistant'">🩺</span>
              <span v-else>👤</span>
            </div>
            <div class="bubble" v-html="message.content.replace(/\n/g, '<br/>')"></div>
          </div>

          <div v-if="sending" class="chat-message assistant typing">
            <div class="avatar">🩺</div>
            <div class="bubble typing-indicator"><span></span><span></span><span></span></div>
          </div>
        </template>
      </div>

      <!-- ── Guided input footer ── -->
      <div class="chat-footer" v-if="!loadingInitial && !isCompleted">

        <!-- SINGLE / MULTI chips -->
        <template v-if="inputConfig && (inputConfig.type === 'single' || inputConfig.type === 'multi')">
          <div class="input-hint">
            <span v-if="inputConfig.type === 'single'">Chọn một lựa chọn</span>
            <span v-else>Có thể chọn nhiều</span>
          </div>
          <div class="chips-container">
            <button
              v-for="option in inputConfig.options"
              :key="option"
              class="chip"
              :class="{
                'chip--selected': isChipSelected(option),
                'chip--multi': inputConfig.type === 'multi',
                'chip--other': option === 'Khác...',
              }"
              @click="toggleChip(option)"
              :disabled="sending"
            >
              <span class="chip-check" v-if="isChipSelected(option)">✓</span>
              {{ option }}
            </button>
          </div>

          <!-- Freetext bổ sung -->
          <div v-if="inputConfig.allowFreetext &&
              (inputConfig.type === 'multi' || selectedChips.length === 0 || inputConfig.type === 'single')"
            class="freetext-row">
            <input
              v-model="freetextValue"
              :placeholder="inputConfig.freetextPlaceholder || 'Nhập thêm...'"
              :disabled="sending"
              @keyup.enter="sendMessage"
              class="freetext-input"
            />
          </div>
        </template>

        <!-- LOCATION input -->
        <template v-else-if="inputConfig && inputConfig.type === 'location'">
          <div class="input-hint">Nhập địa chỉ hoặc dùng GPS</div>
          <div class="location-row">
            <input
              v-model="freetextValue"
              :placeholder="inputConfig.freetextPlaceholder"
              :disabled="sending || gpsLoading"
              @keyup.enter="sendMessage"
              class="freetext-input location-input"
            />
            <button
              class="gps-btn"
              @click="useGPSLocation"
              :disabled="sending || gpsLoading"
              title="Dùng vị trí GPS hiện tại"
            >
              <span v-if="gpsLoading" class="gps-spinner"></span>
              <span v-else>📍</span>
              {{ gpsLoading ? 'Đang lấy vị trí...' : 'GPS' }}
            </button>
          </div>
        </template>

        <!-- FREETEXT thuần (fallback khi BE không gửi inputConfig) -->
        <template v-else>
          <div class="freetext-row freetext-row--full">
            <textarea
              v-model="freetextValue"
              :disabled="sending"
              placeholder="Nhập câu trả lời của bạn..."
              @keyup.enter.exact.prevent="sendMessage"
              class="freetext-textarea"
              rows="2"
            />
          </div>
        </template>

        <!-- Send button -->
        <div class="footer-actions">
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <button class="send-btn" :disabled="!canSend" @click="sendMessage">
            <span v-if="sending">⏳</span>
            <span v-else>📤</span>
            Gửi
          </button>
        </div>

        <p class="disclaimer">
          Bác sĩ AI chỉ mang tính tham khảo. Trường hợp khẩn cấp hãy gọi 115.
        </p>
      </div>

      <!-- Completed state footer -->
      <div class="chat-footer chat-footer--done" v-if="isCompleted">
        <p class="done-text">✅ Đã hoàn tất tư vấn. Xem kết quả ở bên phải.</p>
        <button class="control-btn restart-btn" @click="startConversation">
          🔄 Tư vấn lần khác
        </button>
      </div>
    </div>

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <section class="info-card">
        <h2>Thông tin đã thu thập</h2>
        <ul>
          <li v-for="[key, value] in stateEntries" :key="key">
            <strong>{{ stateLabels[key] || key }}</strong>
            <span>{{ value }}</span>
          </li>
          <li v-if="!stateEntries.length">
            Chưa có thông tin. Hãy bắt đầu trả lời các câu hỏi nhé.
          </li>
        </ul>
      </section>

      <section v-if="recommendations" class="info-card">
        <h2>Kết quả gợi ý</h2>

        <div v-if="recommendations.specialties?.length" class="result-block">
          <h3>Chuyên khoa phù hợp</h3>
          <div class="chip-list">
            <span v-for="s in recommendations.specialties" :key="s" class="chip chip--specialty">
              {{ s }}
            </span>
          </div>
        </div>

        <div class="result-block">
          <h3>Bác sĩ đề xuất</h3>
          <div class="filter-row">
            <label>Bán kính:
              <select v-model.number="distanceFilterKm">
                <option :value="null">Tất cả</option>
                <option :value="5">≤ 5 km</option>
                <option :value="10">≤ 10 km</option>
                <option :value="20">≤ 20 km</option>
                <option :value="50">≤ 50 km</option>
                <option :value="100">≤ 100 km</option>
              </select>
            </label>
          </div>
          <div v-if="filteredDoctors.length === 0" class="empty-state">
            Không tìm thấy bác sĩ phù hợp.
          </div>
          <article v-else v-for="doctor in filteredDoctors" :key="doctor.id || doctor.name"
            class="doctor-card" :class="{ disabled: !(doctor.dr_id || doctor.id) }"
            @click="goDoctorDetail(doctor)">
            <div class="doctor-info">
              <div class="card-header-row">
                <h4>{{ doctor.name }}</h4>
                <span v-if="doctor.distanceText" class="distance-badge">{{ doctor.distanceText }}</span>
              </div>
              <p class="doctor-specialty">{{ doctor.specialty }}</p>
              <p class="doctor-hospital">{{ doctor.hospitalName }}</p>
              <p v-if="doctor.hospitalAddress" class="doctor-address">{{ doctor.hospitalAddress }}</p>
            </div>
            <div class="doctor-meta">
              <span class="price">{{ formatPrice(doctor.price) }}</span>
              <span class="score" v-if="doctor.matchScore">
                Phù hợp: {{ (doctor.matchScore * 100).toFixed(0) }}%
              </span>
            </div>
          </article>
        </div>

        <div v-if="recommendations._symptomAnalysis" class="result-block medical-context">
          <h3>Phân tích y khoa</h3>
          <div class="medical-info">
            <div class="urgency-level" :class="getUrgencyClass(recommendations._symptomAnalysis.urgencyLevel)">
              <span>{{ getUrgencyIcon(recommendations._symptomAnalysis.urgencyLevel) }}</span>
              <span>{{ getUrgencyText(recommendations._symptomAnalysis.urgencyLevel) }}</span>
            </div>
            <div v-if="recommendations._symptomAnalysis.matchedSymptoms?.length" class="matched-symptoms">
              <strong>Triệu chứng nhận diện:</strong>
              <div class="symptom-tags">
                <span v-for="s in recommendations._symptomAnalysis.matchedSymptoms" :key="s" class="symptom-tag">
                  {{ s }}
                </span>
              </div>
            </div>
            <div class="confidence-score">
              <strong>Độ tin cậy:</strong>
              <div class="confidence-bar">
                <div class="confidence-fill"
                  :style="{ width: recommendations._symptomAnalysis.confidence * 100 + '%' }">
                </div>
              </div>
              <span>{{ (recommendations._symptomAnalysis.confidence * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div v-if="recommendations.hospitals?.length" class="result-block">
          <h3>Cơ sở y tế gợi ý</h3>
          <div class="filter-row">
            <label>Bán kính:
              <select v-model.number="distanceFilterKm">
                <option :value="null">Tất cả</option>
                <option :value="5">≤ 5 km</option>
                <option :value="10">≤ 10 km</option>
                <option :value="20">≤ 20 km</option>
                <option :value="50">≤ 50 km</option>
                <option :value="100">≤ 100 km</option>
              </select>
            </label>
          </div>
          <div v-if="filteredHospitals.length === 0" class="empty-state">
            Không tìm thấy cơ sở y tế phù hợp.
          </div>
          <article v-else v-for="hospital in filteredHospitals" :key="hospital.id || hospital.name"
            class="hospital-card"
            :class="{ disabled: hospital.inDatabase === false || !(hospital.h_id || hospital.dbId) }"
            @click="goHospitalDetail(hospital)">
            <div class="card-header-row">
              <h4>{{ hospital.name }}</h4>
              <span v-if="hospital.inDatabase === false" class="external-badge">Ngoài hệ thống</span>
              <span v-if="hospital.distanceText" class="distance-badge">{{ hospital.distanceText }}</span>
            </div>
            <p v-if="hospital.address">{{ hospital.address }}</p>
            <p v-if="hospital.phone">📞 {{ hospital.phone }}</p>
          </article>
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.ai-doctor-page {
  display: flex;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f8fafc;
  color: #1e293b;
}
.dark-mode { background: #0f172a; color: #e2e8f0; }

/* ── Chat container ── */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  max-height: 90vh;
}
.dark-mode .chat-container { background: #1e293b; border-color: #334155; }

/* ── Header ── */
.chat-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: #f8fafc;
}
.dark-mode .chat-header { background: #1e293b; border-color: #334155; }
.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h1 { font-size: 1.25rem; font-weight: 600; margin: 0; }
.header-content p { margin: 0.4rem 0 0; font-size: 0.85rem; color: #64748b; }
.ai-status { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #64748b; }
.status-indicator {
  width: 8px; height: 8px; border-radius: 50%;
  background: #94a3b8; transition: background 0.3s;
}
.status-indicator.active { background: #22c55e; }
.header-controls { display: flex; gap: 0.5rem; flex-shrink: 0; }
.control-btn {
  padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0;
  background: transparent; cursor: pointer; font-size: 0.85rem;
  color: inherit; transition: background 0.15s;
}
.control-btn:hover:not(:disabled) { background: #f1f5f9; }
.dark-mode .control-btn:hover:not(:disabled) { background: #334155; }
.control-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Chat body ── */
.chat-body {
  flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.chat-loading { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem; color: #64748b; }
.spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #e2e8f0; border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Messages ── */
.chat-message { display: flex; gap: 0.75rem; align-items: flex-start; }
.chat-message.user { flex-direction: row-reverse; }
.avatar { font-size: 1.25rem; flex-shrink: 0; margin-top: 2px; }
.bubble {
  max-width: 78%; padding: 0.75rem 1rem;
  border-radius: 14px; font-size: 0.925rem; line-height: 1.6;
}
.assistant .bubble {
  background: #f1f5f9; color: #1e293b;
  border-bottom-left-radius: 4px;
}
.user .bubble {
  background: #6366f1; color: #fff;
  border-bottom-right-radius: 4px;
}
.dark-mode .assistant .bubble { background: #334155; color: #e2e8f0; }

/* Typing */
.typing-indicator { display: flex; gap: 5px; align-items: center; padding: 0.75rem 1rem; }
.typing-indicator span {
  width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }

/* ── Footer ── */
.chat-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 0.75rem;
  background: #fafafa;
}
.dark-mode .chat-footer { background: #1e293b; border-color: #334155; }
.chat-footer--done {
  flex-direction: row; align-items: center; justify-content: space-between;
}
.done-text { font-size: 0.9rem; color: #22c55e; font-weight: 500; }

.input-hint { font-size: 0.8rem; color: #64748b; }

/* ── Chips ── */
.chips-container {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.chip {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 5px;
  user-select: none;
}
.chip:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.chip--selected {
  background: #eef2ff; border-color: #6366f1;
  color: #4338ca; font-weight: 500;
}
.chip--multi { border-style: dashed; }
.chip--multi.chip--selected { border-style: solid; }
.chip--other { border-style: dotted; }
.chip--specialty {
  background: #f0fdf4; border-color: #86efac;
  color: #15803d; border-style: solid; cursor: default;
}
.chip-check { font-size: 0.75rem; }
.dark-mode .chip { background: #334155; border-color: #475569; color: #cbd5e1; }
.dark-mode .chip:hover:not(:disabled) { border-color: #818cf8; color: #818cf8; background: #1e1b4b; }
.dark-mode .chip--selected { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }

/* ── Freetext & Location ── */
.freetext-row { display: flex; gap: 0.5rem; }
.freetext-row--full { width: 100%; }
.freetext-input {
  flex: 1; padding: 0.55rem 0.875rem;
  border-radius: 10px; border: 1.5px solid #cbd5e1;
  font-size: 0.9rem; background: #fff; color: inherit;
  outline: none; transition: border-color 0.15s;
  font-family: inherit;
}
.freetext-input:focus { border-color: #6366f1; }
.dark-mode .freetext-input { background: #334155; border-color: #475569; color: #e2e8f0; }
.freetext-textarea {
  width: 100%; padding: 0.65rem 0.875rem;
  border-radius: 10px; border: 1.5px solid #cbd5e1;
  font-size: 0.9rem; background: #fff; color: inherit;
  outline: none; resize: none; font-family: inherit;
  transition: border-color 0.15s;
}
.freetext-textarea:focus { border-color: #6366f1; }
.dark-mode .freetext-textarea { background: #334155; border-color: #475569; color: #e2e8f0; }
.location-row { display: flex; gap: 0.5rem; }
.location-input { flex: 1; }
.gps-btn {
  padding: 0.55rem 1rem; border-radius: 10px;
  border: 1.5px solid #cbd5e1; background: #fff;
  color: #475569; cursor: pointer; font-size: 0.85rem;
  display: flex; align-items: center; gap: 5px;
  white-space: nowrap; transition: all 0.15s;
}
.gps-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.gps-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.gps-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid #e2e8f0; border-top-color: #6366f1;
  animation: spin 0.8s linear infinite; display: inline-block;
}

/* ── Send button ── */
.footer-actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; }
.send-btn {
  padding: 0.6rem 1.5rem; border-radius: 10px;
  background: #6366f1; color: #fff; border: none;
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background 0.15s, opacity 0.15s;
}
.send-btn:hover:not(:disabled) { background: #4f46e5; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.disclaimer { font-size: 0.78rem; color: #94a3b8; margin: 0; }
.error-message { font-size: 0.85rem; color: #ef4444; margin: 0; }

/* ── Sidebar ── */
.sidebar {
  width: 340px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 1rem;
  max-height: 90vh; overflow-y: auto;
}
.info-card {
  background: #fff; border-radius: 14px;
  border: 1px solid #e2e8f0; padding: 1.25rem;
}
.dark-mode .info-card { background: #1e293b; border-color: #334155; }
.info-card h2 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; }
.info-card h3 { font-size: 0.875rem; font-weight: 600; margin: 0.75rem 0 0.5rem; color: #475569; }
.dark-mode .info-card h3 { color: #94a3b8; }
.info-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.info-card li { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.875rem; }
.info-card li strong { color: #64748b; flex-shrink: 0; }

/* ── Result blocks ── */
.result-block { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
.dark-mode .result-block { border-color: #334155; }
.chip-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.4rem; }
.filter-row { margin-bottom: 0.5rem; font-size: 0.85rem; }
.filter-row select {
  margin-left: 0.4rem; padding: 2px 6px;
  border-radius: 6px; border: 1px solid #cbd5e1;
  background: #fff; color: inherit; font-size: 0.85rem;
}
.dark-mode .filter-row select { background: #334155; border-color: #475569; }
.empty-state { font-size: 0.875rem; color: #94a3b8; padding: 0.5rem 0; }

/* ── Doctor/Hospital cards ── */
.doctor-card, .hospital-card {
  padding: 0.875rem; border-radius: 10px;
  border: 1px solid #e2e8f0; margin-top: 0.5rem;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.doctor-card:hover, .hospital-card:hover { border-color: #6366f1; background: #fafafe; }
.dark-mode .doctor-card, .dark-mode .hospital-card { border-color: #334155; }
.dark-mode .doctor-card:hover, .dark-mode .hospital-card:hover {
  border-color: #818cf8; background: #1e1b4b;
}
.doctor-card.disabled, .hospital-card.disabled { cursor: default; opacity: 0.7; }
.doctor-card.disabled:hover, .hospital-card.disabled:hover {
  border-color: #e2e8f0; background: inherit;
}
.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.card-header-row h4 { font-size: 0.9rem; font-weight: 600; margin: 0; }
.doctor-specialty { font-size: 0.8rem; color: #6366f1; margin: 0.2rem 0 0; }
.doctor-hospital { font-size: 0.8rem; color: #64748b; margin: 0.15rem 0 0; }
.doctor-address { font-size: 0.78rem; color: #94a3b8; margin: 0.1rem 0 0; }
.doctor-meta {
  display: flex; justify-content: space-between;
  margin-top: 0.5rem; font-size: 0.8rem;
}
.price { color: #16a34a; font-weight: 500; }
.score { color: #6366f1; }
.distance-badge {
  font-size: 0.75rem; padding: 2px 8px;
  border-radius: 999px; background: #f0fdf4;
  color: #16a34a; border: 1px solid #86efac;
  white-space: nowrap; flex-shrink: 0;
}
.external-badge {
  font-size: 0.72rem; padding: 2px 7px;
  border-radius: 999px; background: #fef9c3;
  color: #854d0e; border: 1px solid #fde047;
}

/* ── Medical context ── */
.urgency-level {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; border-radius: 8px;
  font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;
}
.urgency-emergency { background: #fee2e2; color: #b91c1c; }
.urgency-soon { background: #fef9c3; color: #854d0e; }
.urgency-normal { background: #dcfce7; color: #15803d; }
.symptom-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem; }
.symptom-tag {
  font-size: 0.78rem; padding: 2px 8px;
  border-radius: 999px; background: #eff6ff; color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.confidence-score { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; margin-top: 0.5rem; }
.confidence-bar {
  flex: 1; height: 6px; background: #e2e8f0;
  border-radius: 999px; overflow: hidden;
}
.confidence-fill { height: 100%; background: #6366f1; border-radius: 999px; transition: width 0.4s; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .ai-doctor-page { flex-direction: column; padding: 1rem; }
  .sidebar { width: 100%; max-height: none; }
}
</style>