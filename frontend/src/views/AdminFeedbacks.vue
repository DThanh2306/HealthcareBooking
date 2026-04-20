<template>
  <div class="admin-feedbacks">
    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý đánh giá</h1>
        <p>Theo dõi và xử lý đánh giá của bác sĩ và bệnh viện.</p>
      </div>
    </div>
    <div class="page-header">
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          <span v-if="loading">Đang tải...</span>
          <span v-else>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      
      <div 
        class="stat-card average-card" 
        role="button" 
        tabindex="0"
        @click="openAverageModal"
        @keydown.enter.prevent="openAverageModal"
        @keydown.space.prevent="openAverageModal"
      >
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.averageRating }}</div>
          <div class="stat-label">Điểm trung bình</div>
          <div class="stat-extra">Nhấn để xem chi tiết</div>
        </div>
      </div>
      <div class="stat-card average-card" :class="{ warning: alertStats.critical_alerts > 0 }" role="button" tabindex="0" @click="openAlertsModal" @keydown.enter.prevent="openAlertsModal" @keydown.space.prevent="openAlertsModal">
        <div class="stat-icon">🚨</div>
        <div class="stat-content">
          <div class="stat-number">{{ alertStats.unread_alerts }}</div>
          <div class="stat-label">Cảnh báo chưa đọc</div>
          <div class="stat-extra">Nhấn để xem chi tiết</div>
          <div class="stat-extra" v-if="alertStats.critical_alerts > 0">
            {{ alertStats.critical_alerts }} nghiêm trọng
          </div>
        </div>
      </div>
    </div>

    <!-- Warning for low average rating -->
    <div 
      v-if="stats && stats.averageRating !== undefined && stats.averageRating < 3" 
      class="warning-banner"
    >
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <div class="warning-title">Cảnh báo chất lượng đánh giá thấp</div>
        <div class="warning-text">
          Điểm đánh giá trung bình hiện tại đang dưới 3 sao. 
          Vui lòng kiểm tra lại các đánh giá của bác sĩ và bệnh viện để có biện pháp xử lý phù hợp.
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Loại đánh giá:</label>
        <select v-model="filters.type" @change="applyFilters">
          <option value="all">Tất cả</option>
          <option value="doctor">Bác sĩ</option>
          <option value="hospital">Bệnh viện</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Đánh giá:</label>
        <select v-model="filters.rating" @change="applyFilters">
          <option value="all">Tất cả</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Lọc theo người đánh giá:</label>
        <select v-model="filters.userFilter" @change="applyFilters">
          <option value="all">Tất cả người dùng</option>
          <option value="named">Chỉ người có tên</option>
          <option value="anonymous">Chỉ ẩn danh</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tìm kiếm:</label>
        <input 
          v-model="filters.search" 
          @input="applyFilters"
          placeholder="Tìm theo tên bác sĩ, bệnh viện, người đánh giá hoặc bình luận..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Feedbacks Table -->
    <div class="feedbacks-table">
      <div class="table-header">
        <h3>Danh sách đánh giá</h3>
        <div class="table-actions">
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Loại</th>
              <th>Tên</th>
              <th>Đánh giá</th>
              <th>Bình luận</th>
              <th>Người đánh giá</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="feedback in filteredFeedbacks" :key="feedback.id">
              <td>
                <span :class="['type-badge', feedback.type]">
                  {{ feedback.type === 'doctor' ? 'Bác sĩ' : 'Bệnh viện' }}
                </span>
              </td>
              <td>
                <div class="name-cell">
                  <div class="name">
                    <span class="name-icon">
                      {{ feedback.type === 'doctor' ? '👨‍⚕️' : '🏥' }}
                    </span>
                    {{ feedback.name }}
                  </div>
                  <div class="subtitle">
                    {{ feedback.type === 'doctor' ? 'Bác sĩ' : 'Bệnh viện' }}
                    {{ feedback.subtitle ? ` • ${feedback.subtitle}` : '' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="rating-cell">
                  <div class="stars">
                    <span
                      v-for="star in 5"
                      :key="star"
                      :class="['star', { filled: star <= feedback.rating }]"
                    >
                      ★
                    </span>
                  </div>
                  <div class="rating-number">{{ feedback.rating }}/5</div>
                  <div
                    v-if="feedback.average_rating !== undefined && feedback.average_rating !== null && feedback.average_rating < 3"
                    class="entity-warning"
                  >
                    ⚠️ Điểm TB {{ formatAverage(feedback.average_rating) }} sao (thấp)
                  </div>
                </div>
              </td>
              <td>
                <div class="comment-cell">
                  <div class="comment-text">{{ feedback.comment }}</div>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    <span class="avatar-icon">👤</span>
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ feedback.name_u || 'Ẩn danh' }}</div>
                    <div class="user-email">{{ feedback.email_u || '' }}</div>
                    <div class="user-meta" v-if="feedback.name_u">
                      Đã đánh giá {{ feedback.type === 'doctor' ? 'bác sĩ' : 'bệnh viện' }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="date-cell">
                  {{ formatDate(feedback.created_at) }}
                </div>
              </td>
              <td>
                <div class="actions-cell">
                  <button 
                    @click="viewFeedback(feedback)" 
                    class="action-btn view"
                    title="Xem chi tiết"
                  >
                    👁️
                  </button>
                  <button 
                    @click="deleteFeedback(feedback)" 
                    class="action-btn delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination && pagination.totalPages > 1">
        <button
          @click="loadPage(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="page-btn"
        >
          Trước
        </button>
        <span class="page-info">
          Trang {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          @click="loadPage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.totalPages"
          class="page-btn"
        >
          Sau
        </button>
      </div>
    </div>

    <!-- Feedback Detail Modal -->
    <div v-if="selectedFeedback" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Chi tiết đánh giá</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="feedback-detail">
            <div class="detail-row">
              <label>Loại:</label>
              <span :class="['type-badge', selectedFeedback.type]">
                {{ selectedFeedback.type === 'doctor' ? 'Bác sĩ' : 'Bệnh viện' }}
              </span>
            </div>
            <div class="detail-row">
              <label>Tên:</label>
              <span>{{ selectedFeedback.name }}</span>
            </div>
            <div class="detail-row">
              <label>Đánh giá:</label>
              <div class="stars">
                <span
                  v-for="star in 5"
                  :key="star"
                  :class="['star', { filled: star <= selectedFeedback.rating }]"
                >
                  ★
                </span>
                <span class="rating-text">{{ selectedFeedback.rating }}/5</span>
              </div>
            </div>
            <div class="detail-row">
              <label>Bình luận:</label>
              <div class="comment-detail">{{ selectedFeedback.comment }}</div>
            </div>
            <div class="detail-row">
              <label>Người đánh giá:</label>
              <div class="user-detail">
                <div class="user-avatar">
                  <span class="avatar-icon">👤</span>
                </div>
                <div class="user-info">
                  <div class="user-name">{{ selectedFeedback.name_u || 'Ẩn danh' }}</div>
                  <div class="user-email">{{ selectedFeedback.email_u || 'Không có email' }}</div>
                  <div class="user-action">
                    Đã đánh giá {{ selectedFeedback.type === 'doctor' ? 'bác sĩ' : 'bệnh viện' }} 
                    <strong>{{ selectedFeedback.name }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="detail-row">
              <label>Ngày tạo:</label>
              <span>{{ formatDate(selectedFeedback.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Đóng</button>
          <button @click="deleteFeedback(selectedFeedback)" class="btn-danger">Xóa đánh giá</button>
        </div>
      </div>
    </div>

    <!-- Average Ratings Modal -->
    <div v-if="averageModal.visible" class="modal-overlay" @click="closeAverageModal">
      <div class="modal-content wide" @click.stop>
        <div class="modal-header">
          <h3>Điểm trung bình theo từng đơn vị</h3>
          <button @click="closeAverageModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body average-modal">
          <div class="average-tabs">
            <div class="tab-buttons">
              <button
                class="average-tab-btn"
                :class="{ active: averageModal.tab === 'doctor' }"
                @click="setAverageTab('doctor')"
              >
                Bác sĩ ({{ averageModal.doctors.length }})
              </button>
              <button
                class="average-tab-btn"
                :class="{ active: averageModal.tab === 'hospital' }"
                @click="setAverageTab('hospital')"
              >
                Bệnh viện ({{ averageModal.hospitals.length }})
              </button>
            </div>
            <div class="average-filters">
              <input 
                v-model.trim="averageModal.search"
                class="average-search"
                type="text"
                :placeholder="averageModal.tab === 'doctor' ? 'Tìm tên bác sĩ...' : 'Tìm tên bệnh viện...'"
              />
              <select v-model="averageModal.sort" class="average-sort">
                <option value="asc">Điểm TB: Thấp → Cao</option>
                <option value="desc">Điểm TB: Cao → Thấp</option>
              </select>
              <div v-if="averageModal.tab === 'doctor'" class="cooldown-group">
                <select id="cooldownDays" v-model.number="cooldownDays" class="average-sort">
                  <option :value="7">7 ngày</option>
                  <option :value="14">14 ngày</option>
                  <option :value="30">30 ngày</option>
                </select>
              </div>
              <button 
                v-if="averageModal.tab === 'doctor'"
                @click="generateAutoAlerts"
                class="auto-alert-btn"
                :disabled="generatingAlerts"
              >
                {{ generatingAlerts ? 'Đang tạo...' : '🤖 Tự động gửi cảnh báo' }}
              </button>
            </div>
          </div>

          <div v-if="averageModal.loading" class="average-loading">
            Đang tải dữ liệu...
          </div>
          <div v-else-if="processedAverageList.length === 0" class="average-empty">
            Chưa có dữ liệu để hiển thị.
          </div>
          <div v-else class="average-list">
            <div 
              class="average-row"
              v-for="item in processedAverageList"
              :key="`${averageModal.tab}-${item.id}`"
            >
              <div class="average-info">
                <div class="average-name">{{ item.name }}</div>
                <div class="average-subtitle">
                  {{ item.subtitle || (averageModal.tab === 'doctor' ? 'Chưa có chuyên khoa' : 'Chưa có địa chỉ') }}
                </div>
              </div>
              <div class="average-meta">
                <div 
                  :class="['average-score', { low: isLowAverage(item.average_rating) }]"
                  title="Điểm trung bình"
                >
                  {{ formatAverage(item.average_rating) }}
                </div>
                <div class="average-count">
                  {{ item.total_ratings }} đánh giá
                </div>
                <div 
                  v-if="averageModal.tab === 'doctor' && isLowAverage(item.average_rating)"
                  class="average-actions"
                >
                  <div class="alert-status">
                    <span 
                      v-if="hasSentAlert(item)"
                      class="alert-sent"
                      :class="getAlertSeverityClass(item.average_rating)"
                    >
                      {{ getAlertStatusText(item) }}
                    </span>
                    <button
                      v-else
                      class="avg-alert-btn"
                      :class="getAlertButtonClass(item.average_rating)"
                      :disabled="alertingDoctorId === item.id"
                      @click="sendLowRatingAlert(item)"
                    >
                      {{ alertingDoctorId === item.id ? 'Đang gửi...' : getAlertButtonText(item.average_rating) }}
                    </button>
                  </div>
                  <div class="severity-indicator">
                    {{ getSeverityText(item.average_rating) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

   <!-- Alerts Detail Modal -->
   <div v-if="alertsModal.visible" class="modal-overlay" @click="closeAlertsModal">
     <div class="modal-content wide" @click.stop>
       <div class="modal-header">
         <h3>Chi tiết cảnh báo ({{ alertsModal.status === 'unread' ? 'Chưa đọc' : 'Tất cả' }})</h3>
         <button @click="closeAlertsModal" class="close-btn">&times;</button>
       </div>
       <div class="modal-body average-modal">
         <div class="average-tabs">
           <div class="tab-buttons">
             <button class="average-tab-btn active" disabled>
               Cảnh báo ({{ filteredAlerts.length }})
             </button>
           </div>
           <div class="average-filters">
             <input
               v-model.trim="alertsModal.search"
               class="average-search"
               type="text"
               placeholder="Tìm theo tên bác sĩ hoặc nội dung..."
             />
             <select v-model="alertsModal.status" class="average-sort" @change="loadAlerts">
               <option value="unread">Chưa đọc</option>
               <option value="all">Tất cả</option>
             </select>
           </div>
         </div>

         <div v-if="alertsModal.loading" class="average-loading">
           Đang tải dữ liệu...
         </div>
         <div v-else-if="filteredAlerts.length === 0" class="average-empty">
           Không có cảnh báo phù hợp.
         </div>
         <div v-else class="average-list">
           <div
             class="average-row"
             v-for="item in filteredAlerts"
             :key="item.id"
           >
             <div class="average-info">
               <div class="average-name">{{ item.doctor_name }}</div>
               <div class="average-subtitle">
                 <span class="badge badge-specialty">{{ item.specialty_name || 'Chưa có chuyên khoa' }}</span>
                 <span v-if="item.hospital_name" class="badge badge-hospital">{{ item.hospital_name }}</span>
               </div>
               <div class="average-subtitle small">
                 {{ (item.message || '').substring(0, 160) }}<span v-if="(item.message || '').length > 160">...</span>
               </div>
             </div>
             <div class="average-meta">
               <div :class="['average-score', { low: (parseAverageValue(item.average_rating) || 0) < 3 }]">
                 {{ formatAverage(item.average_rating) }}
               </div>
               <div class="average-count">
                 Cấp {{ item.alert_level }} • {{ mapSeverity(item.severity) }}
               </div>
               <div class="status-chip" :class="getStatusClass(item.status)">
                 {{ getStatusText(item.status) }}
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'AdminFeedbacks',
  data() {
    return {
      cooldownDays: 14,
      loading: false,
      feedbacks: [],
      filteredFeedbacks: [],
      stats: {
        totalDoctorRatings: 0,
        totalHospitalRatings: 0,
        averageRating: 0,
        totalFeedbacks: 0
      },
      pagination: null,
      selectedFeedback: null,
      filters: {
        type: 'all',
        rating: 'all',
        search: '',
        userFilter: 'all'
      },
      alertsModal: {
        visible: false,
        loading: false,
        items: [],
        search: '',
        status: 'unread'
      },
      averageModal: {
        visible: false,
        loading: false,
        tab: 'doctor',
        doctors: [],
        hospitals: [],
        loaded: false,
        search: '',
        sort: 'asc'
      },
      alertingDoctorId: null,
      alertedDoctorIds: [],
      generatingAlerts: false,
      alertStats: {
        total_alerts: 0,
        unread_alerts: 0,
        critical_alerts: 0,
        doctors_with_alerts: 0
      }
    };
  },
  computed: {
    filteredAlerts() {
      let list = Array.isArray(this.alertsModal.items) ? [...this.alertsModal.items] : [];
      if (this.alertsModal.status === 'unread') {
        list = list.filter(i => i.status === 'unread');
      }
      if (this.alertsModal.search) {
        const s = this.alertsModal.search.toLowerCase();
        list = list.filter(i => (i.doctor_name || '').toLowerCase().includes(s) || (i.message || '').toLowerCase().includes(s));
      }
      return list;
    },
    activeAverageList() {
      return this.averageModal.tab === 'doctor'
        ? this.averageModal.doctors
        : this.averageModal.hospitals;
    },
    processedAverageList() {
      let list = [...this.activeAverageList];

      if (this.averageModal.search) {
        const search = this.averageModal.search.toLowerCase();
        list = list.filter(item =>
          (item.name && item.name.toLowerCase().includes(search)) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(search))
        );
      }

      list.sort((a, b) => {
        const aVal = this.parseAverageValue(a.average_rating);
        const bVal = this.parseAverageValue(b.average_rating);
        if (this.averageModal.sort === 'asc') {
          return aVal - bVal || a.name.localeCompare(b.name);
        }
        return bVal - aVal || a.name.localeCompare(b.name);
      });

      return list;
    }
  },
  mounted() {
    // Restore locally alerted doctor ids
    try {
      const savedIds = JSON.parse(localStorage.getItem('admin_alerted_doctor_ids') || '[]');
      if (Array.isArray(savedIds)) this.alertedDoctorIds = savedIds;
    } catch (e) {}
    this.loadFeedbacks();
    this.loadStats();
    this.loadAlertStats();
  },
  methods: {
    async loadFeedbacks(page = 1) {
      this.loading = true;
      try {
        const params = {
          page,
          limit: 20,
          ...this.filters
        };
        
        const res = await axios.get('/admin/feedbacks', { params });
        this.feedbacks = res.data.feedbacks || [];
        console.log('Feedbacks:', this.feedbacks);
        this.pagination = res.data.pagination;
        this.applyFilters();
      } catch (error) {
        console.error('Lỗi tải đánh giá:', error);
        alert('Không thể tải danh sách đánh giá');
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        const res = await axios.get('/admin/feedback-stats');
        this.stats = res.data;
      } catch (error) {
        console.error('Lỗi tải thống kê:', error);
      }
    },

    applyFilters() {
      let filtered = [...this.feedbacks];

      // Filter by type
      if (this.filters.type !== 'all') {
        filtered = filtered.filter(f => f.type === this.filters.type);
      }

      // Filter by rating
      if (this.filters.rating !== 'all') {
        filtered = filtered.filter(f => f.rating === parseInt(this.filters.rating));
      }

      // Filter by user type
      if (this.filters.userFilter === 'named') {
        filtered = filtered.filter(f => f.name_u);
      } else if (this.filters.userFilter === 'anonymous') {
        filtered = filtered.filter(f => !f.name_u);
      }

      // Filter by search
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        filtered = filtered.filter(f => 
          (f.name && f.name.toLowerCase().includes(search)) ||
          (f.comment && f.comment.toLowerCase().includes(search)) ||
          (f.name_u && f.name_u.toLowerCase().includes(search)) ||
          (f.email_u && f.email_u.toLowerCase().includes(search))
        );
      }

      this.filteredFeedbacks = filtered;
    },

    loadPage(page) {
      this.loadFeedbacks(page);
    },

    viewFeedback(feedback) {
      this.selectedFeedback = feedback;
    },

    closeModal() {
      this.selectedFeedback = null;
    },

    async deleteFeedback(feedback) {
      if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;

      try {
        const endpoint = feedback.type === 'doctor' 
          ? `/admin/doctor-ratings/${feedback.id}`
          : `/admin/hospital-ratings/${feedback.id}`;
        
        await axios.delete(endpoint);
        
        // Remove from local array
        this.feedbacks = this.feedbacks.filter(f => f.id !== feedback.id);
        this.applyFilters();
        this.closeModal();
        
        alert('Xóa đánh giá thành công');
      } catch (error) {
        console.error('Lỗi xóa đánh giá:', error);
        alert('Không thể xóa đánh giá');
      }
    },

    async exportFeedbacks() {
      try {
        const res = await axios.get('/admin/feedbacks/export', {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `feedbacks_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Lỗi xuất file:', error);
        alert('Không thể xuất file');
      }
    },

    async loadAlerts() {
      this.alertsModal.loading = true;
      try {
        const res = await axios.get('/admin/doctor-alerts', { params: { status: this.alertsModal.status } });
        const notifications = res.data?.notifications || [];
        this.alertsModal.items = notifications.map(n => ({
          ...n,
          hospital_name: n.hospital_name || n.h_name || null,
          specialty_name: n.specialty_name || n.sp_name || null
        }));
      } catch (error) {
        console.error('Lỗi tải danh sách cảnh báo:', error);
        this.alertsModal.items = [];
      } finally {
        this.alertsModal.loading = false;
      }
    },

    async loadAlertStats() {
      try {
        const res = await axios.get('/admin/doctor-alerts/stats');
        this.alertStats = res.data.stats;
      } catch (error) {
        console.error('Lỗi tải thống kê cảnh báo:', error);
      }
    },

    async generateAutoAlerts() {
      if (!confirm('Tự động tạo cảnh báo cho tất cả bác sĩ có điểm đánh giá thấp?\n\nHệ thống sẽ phân tích và chỉ gửi cảnh báo phù hợp.')) return;
      
      this.generatingAlerts = true;
      try {
        const res = await axios.post('/admin/doctor-alerts/auto-generate', { cooldownDays: this.cooldownDays });
        const { generated, eligible } = res.data;
        
        if (generated > 0) {
          alert(`✅ Đã tạo ${generated} cảnh báo tự động từ ${eligible} bác sĩ đủ điều kiện.\n\nCác bác sĩ sẽ nhận được thông báo phù hợp với mức độ vấn đề.`);
          await this.loadAverageBreakdown();
          await this.loadAlertStats();
        } else {
          alert(`ℹ️ Không có bác sĩ nào cần cảnh báo lúc này.\n\nĐã kiểm tra ${eligible} bác sĩ.`);
        }
      } catch (error) {
        console.error('Lỗi tạo cảnh báo tự động:', error);
        const errorMsg = error.response?.data?.error || 'Không thể tạo cảnh báo tự động';
        alert('❌ ' + errorMsg);
      } finally {
        this.generatingAlerts = false;
      }
    },

    refreshData() {
      this.loadFeedbacks();
      this.loadStats();
      this.loadAlertStats();
    },

    openAverageModal() {
      this.averageModal.visible = true;
      if (!this.averageModal.loaded) {
        this.loadAverageBreakdown();
      }
    },

    async openAlertsModal() {
      this.alertsModal.visible = true;
      await this.loadAlerts();
    },

    closeAverageModal() {
      this.averageModal.visible = false;
    },

    closeAlertsModal() {
      this.alertsModal.visible = false;
    },

    setAverageTab(tab) {
      if (this.averageModal.tab === tab) return;
      this.averageModal.tab = tab;
    },

    async loadAverageBreakdown() {
      this.averageModal.loading = true;
      try {
        const res = await axios.get('/admin/feedback-averages');
        const data = res.data?.data || {};
        this.averageModal.doctors = (data.doctors || []).map(d => {
          const docId = d.id || d.dr_id || d.doctor_id;
          return {
            ...d,
            id: docId,
            alertSent: d.alertSent || d.has_alert || (docId && this.alertedDoctorIds.includes(docId))
          };
        });
        this.averageModal.hospitals = data.hospitals || [];
        this.averageModal.loaded = true;
      } catch (error) {
        console.error('Lỗi tải điểm trung bình:', error);
        alert('Không thể tải dữ liệu điểm trung bình');
      } finally {
        this.averageModal.loading = false;
      }
    },

    async sendLowRatingAlert(item) {
      if (!item?.id) return;
      
      // Show smart confirmation with context
      const alertMessage = this.generateAlertConfirmation(item);
      if (!confirm(alertMessage)) return;

      this.alertingDoctorId = item.id || item.dr_id || item.doctor_id;
      try {
        const docId = item.id || item.dr_id || item.doctor_id;
        await axios.post('/admin/doctor-alerts', {
          doctorId: docId,
          averageRating: this.parseAverageValue(item.average_rating),
          totalRatings: item.total_ratings,
          autoGenerated: false
        });
        
        // Show success with next steps
        alert(`Đã gửi cảnh báo đến bác sĩ ${item.name}. Hệ thống sẽ theo dõi phản hồi và cải thiện.`);
        
        const docId2 = item.id || item.dr_id || item.doctor_id;
        if (docId2 && !this.alertedDoctorIds.includes(docId2)) {
          this.alertedDoctorIds.push(docId2);
          try { localStorage.setItem('admin_alerted_doctor_ids', JSON.stringify(this.alertedDoctorIds)); } catch(e) {}
        }
        item.alertSent = true;
        
        // Refresh data to show updated status
        await this.loadAverageBreakdown();
      } catch (error) {
        console.error('Lỗi gửi cảnh báo:', error);
        const errorMsg = error.response?.data?.error || 'Không thể gửi cảnh báo';
        alert(errorMsg);
      } finally {
        this.alertingDoctorId = null;
      }
    },

    generateAlertConfirmation(item) {
      const rating = this.parseAverageValue(item.average_rating);
      const ratings = item.total_ratings || 0;
      
      let severity = 'medium';
      if (rating <= 2.0) severity = 'critical';
      else if (rating <= 2.5) severity = 'high';
      
      const messages = {
        critical: `🚨 CẢNH BÁO NGHIÊM TRỌNG
Bác sĩ ${item.name} có điểm đánh giá cực thấp ${rating}/5 sao (${ratings} đánh giá).
Đây có thể là trường hợp cần can thiệp khẩn cấp.

Gửi cảnh báo mức độ nghiêm trọng?`,
        
        high: `⚠️ CẢNH BÁO QUAN TRỌNG  
Bác sĩ ${item.name} có điểm đánh giá thấp ${rating}/5 sao (${ratings} đánh giá).
Cần có biện pháp cải thiện ngay.

Gửi cảnh báo yêu cầu cải thiện?`,
        
        medium: `📋 THÔNG BÁO CẢI THIỆN
Bác sĩ ${item.name} có điểm đánh giá ${rating}/5 sao (${ratings} đánh giá).
Đề xuất hỗ trợ cải thiện chất lượng dịch vụ.

Gửi thông báo nhắc nhở?`
      };
      
      return messages[severity];
    },

    hasSentAlert(item) {
      const docId = item?.id || item?.dr_id || item?.doctor_id;
      return (
        item?.alertSent ||
        item?.has_alert ||
        (docId && this.alertedDoctorIds.includes(docId))
      );
    },

    getSeverityText(rating) {
      const numRating = this.parseAverageValue(rating);
      if (numRating <= 2.0) return '🚨 Nghiêm trọng';
      if (numRating <= 2.5) return '⚠️ Cao';
      return '📋 Trung bình';
    },

    getAlertSeverityClass(rating) {
      const numRating = this.parseAverageValue(rating);
      if (numRating <= 2.0) return 'alert-critical';
      if (numRating <= 2.5) return 'alert-high';
      return 'alert-medium';
    },

    getAlertButtonClass(rating) {
      const numRating = this.parseAverageValue(rating);
      if (numRating <= 2.0) return 'btn-critical';
      if (numRating <= 2.5) return 'btn-high';
      return 'btn-medium';
    },

    getAlertButtonText(rating) {
      const numRating = this.parseAverageValue(rating);
      if (numRating <= 2.0) return '🚨 Cảnh báo khẩn cấp';
      if (numRating <= 2.5) return '⚠️ Gửi cảnh báo';
      return '📋 Nhắc nhở';
    },

    getAlertStatusText(item) {
      const numRating = this.parseAverageValue(item.average_rating);
      if (numRating <= 2.0) return '🚨 Đã cảnh báo khẩn cấp';
      if (numRating <= 2.5) return '⚠️ Đã gửi cảnh báo';
      return '📋 Đã nhắc nhở';
    },

    getStatusText(status) {
      const map = { unread: 'Chưa đọc', read: 'Đã đọc', acknowledged: 'Đã xác nhận' };
      return map[status] || 'Không xác định';
    },

    getStatusClass(status) {
      return {
        'status-unread': status === 'unread',
        'status-read': status === 'read',
        'status-ack': status === 'acknowledged'
      };
    },

    mapSeverity(sev) {
      if (sev === 'critical') return 'Nghiêm trọng';
      if (sev === 'high') return 'Cao';
      return 'Trung bình';
    },

    parseAverageValue(value) {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return Number.isFinite(num) ? num : 0;
    },

    formatAverage(value) {
      if (value === null || value === undefined) return '-';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (Number.isNaN(num)) return '-';
      return num.toFixed(1);
    },

    isLowAverage(value) {
      if (value === null || value === undefined) return false;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (Number.isNaN(num)) return false;
      return num < 3;
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.admin-feedbacks {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.hero { 
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 16px; 
  color: #fff; padding: 28px 24px; 
  margin: 12px 0 20px; 
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); 
}
.hero-content h1 { margin: 0 0 6px 0; font-size: 1.8rem; font-weight: 700; }
.hero-content p { margin: 0; opacity: 0.95; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

/* Heading now in hero */

.refresh-btn {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 10px;
  padding: 14px 16px;
  color: #92400e;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 1.5rem;
  margin-top: 2px;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.warning-text {
  font-size: 0.85rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card.average-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card.average-card:focus,
.stat-card.average-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
  outline: none;
}

.stat-extra {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #4f46e5;
  font-weight: 500;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 4px;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 24px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-group select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 150px;
  background: white;
  color: #1f2937;
}

.search-input {
  min-width: 300px;
}

.feedbacks-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.table-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.export-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background: #059669;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

td {
  font-size: 0.875rem;
  color: #1f2937;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-badge.doctor {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.hospital {
  background: #dcfce7;
  color: #166534;
}

.name-cell {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 500;
  color: #1f2937;
}

.subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #d1d5db;
  font-size: 1rem;
}

.star.filled {
  color: #fbbf24;
}

.rating-number {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.entity-warning {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #b91c1c;
  background: #fee2e2;
  border-radius: 999px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.comment-cell {
  max-width: 200px;
}

.comment-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 14px;
  color: #6b7280;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.user-meta {
  font-size: 0.75rem;
  color: #059669;
  margin-top: 2px;
  font-style: italic;
}

.date-cell {
  color: #6b7280;
  font-size: 0.75rem;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.delete:hover {
  background: #fef2f2;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.feedback-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-row label {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.detail-row span {
  color: #1f2937;
  font-size: 0.875rem;
}

.comment-detail {
  color: #1f2937;
  font-size: 0.875rem;
  line-height: 1.5;
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.rating-text {
  margin-left: 8px;
  color: #6b7280;
  font-size: 0.75rem;
}

.user-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.user-detail .user-info {
  flex: 1;
}

.user-action {
  font-size: 0.75rem;
  color: #374151;
  margin-top: 4px;
  line-height: 1.4;
}

.user-action strong {
  color: #059669;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .admin-feedbacks {
    padding: 16px;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: unset;
  }

  .table-container {
    font-size: 0.75rem;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }
}

.modal-content.wide {
  max-width: 900px;
}

.average-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.average-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.tab-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.average-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.average-tab-btn {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
}

.average-tab-btn.active {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.average-loading,
.average-empty {
  text-align: center;
  padding: 32px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.average-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.average-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  gap: 16px;
}

.average-info {
  flex: 1;
  min-width: 0;
}

.average-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.average-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.average-subtitle.small {
  font-size: 0.75rem;
  color: #6b7280;
}



.average-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.average-score {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.average-score.low {
  color: #dc2626;
}

.average-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.average-actions {
  margin-top: 4px;
}

.avg-alert-btn {
  background: #f97316;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.avg-alert-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.avg-alert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-sent {
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
  background: #d1fae5;
  border-radius: 999px;
  padding: 4px 10px;
}

.average-search {
  background-color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  min-width: 220px;
  font-size: 0.85rem;
}

.average-sort {
  color: #475569;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 0.85rem;
  min-width: 160px;
}

/* Enhanced Alert Styles */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid transparent;
  background: #f3f4f6;
  color: #374151;
}
.badge-specialty {
  background: #eef2ff; /* indigo-50 */
  color: #3730a3;      /* indigo-800 */
  border-color: #c7d2fe;
}
.badge-hospital {
  background: #ecfeff; /* cyan-50 */
  color: #155e75;      /* cyan-800 */
  border-color: #a5f3fc;
}

.auto-alert-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 8px;
}

.auto-alert-btn:hover:not(:disabled) {
  background: #7c3aed;
}

.auto-alert-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.stat-card.warning {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
}

.stat-card.warning .stat-icon {
  color: #ef4444;
}

.alert-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.severity-indicator {
  font-size: 0.65rem;
  color: #6b7280;
  font-weight: 500;
}

.alert-sent.alert-critical {
  color: #7f1d1d;
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.alert-sent.alert-high {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.alert-sent.alert-medium {
  color: #1e40af;
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.avg-alert-btn.btn-critical {
  background: #dc2626;
  animation: pulse 2s infinite;
}

.avg-alert-btn.btn-critical:hover:not(:disabled) {
  background: #b91c1c;
}

.avg-alert-btn.btn-high {
  background: #d97706;
}

.avg-alert-btn.btn-high:hover:not(:disabled) {
  background: #b45309;
}

.avg-alert-btn.btn-medium {
  background: #2563eb;
}

.avg-alert-btn.btn-medium:hover:not(:disabled) {
  background: #1d4ed8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.status-chip {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid transparent;
}
.status-unread {
  color: #7f1d1d;
  background: #fee2e2;
  border-color: #fecaca;
}
.status-read {
  color: #92400e;
  background: #fef3c7;
  border-color: #fde68a;
}
.status-ack {
  color: #064e3b;
  background: #d1fae5;
  border-color: #a7f3d0;
}

</style>
