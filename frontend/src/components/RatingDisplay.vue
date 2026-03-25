<template>
  <div class="rating-display">
    <div class="rating-summary" v-if="summary">
      <div class="average-rating">
        <div class="rating-number">{{ summary.averageRating }}</div>
        <div class="stars">
          <span
            v-for="star in 5"
            :key="star"
            :class="['star', { filled: star <= Math.round(summary.averageRating) }]"
          >
            ★
          </span>
        </div>
        <div class="rating-count">({{ summary.totalRatings }} đánh giá)</div>
      </div>
    </div>

    <div class="ratings-list" v-if="ratings && ratings.length > 0">
      <div class="ratings-header">
        <h4>Đánh giá từ người dùng</h4>
        <div class="rating-stats">
          <div class="stat-item" v-for="(count, rating) in ratingDistribution" :key="rating">
            <span class="rating-label">{{ rating }} sao</span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getPercentage(count, summary.totalRatings) + '%' }"
              ></div>
            </div>
            <span class="count">{{ count }}</span>
          </div>
        </div>
      </div>

      <div class="ratings-items">
        <div 
          v-for="rating in ratings" 
          :key="rating.id_fb || rating.id"
          class="rating-item"
        >
          <div class="rating-header">
            <div class="user-info">
              <div class="user-avatar">
                {{ rating.name_u ? rating.name_u.charAt(0).toUpperCase() : 'U' }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ rating.name_u || 'Người dùng ẩn danh' }}</div>
                <div class="rating-date">{{ formatDate(rating.created_at) }}</div>
              </div>
            </div>
            <div class="rating-stars">
              <span
                v-for="star in 5"
                :key="star"
                :class="['star', { filled: star <= rating.rating }]"
              >
                ★
              </span>
            </div>
          </div>
          <div class="rating-comment">
            {{ rating.comment }}
          </div>
          <div v-if="String(rating.id_u) === String(currentUserId)" class="owner-actions">
  <slot name="owner-actions" :rating="rating">
    <!-- Default buttons if parent không override -->
    <button class="edit-btn" @click="editRating(rating)">Sửa</button>
    <button class="delete-btn" @click="deleteRating(rating.id_fb_hos || rating.id_fb || rating.id)">Xóa</button>
  </slot>
</div>
        </div>
      </div>

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

    <div class="no-ratings" v-else-if="!loading">
      <div class="no-ratings-icon">⭐</div>
      <p>Chưa có đánh giá nào</p>
      <p class="no-ratings-subtitle">Hãy là người đầu tiên đánh giá!</p>
    </div>

    <div class="loading" v-if="loading">
      <div class="loading-spinner"></div>
      <p>Đang tải đánh giá...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RatingDisplay',
  props: {
    ratings: {
      type: Array,
      default: () => []
    },
    summary: {
      type: Object,
      default: null
    },
    pagination: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: [String, Number, null],
      default: null
    }
  },
  emits: ['load-page', 'edit-rating', 'delete-rating'],
  computed: {
    ratingDistribution() {
      if (!this.ratings || this.ratings.length === 0) return {};
      
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      this.ratings.forEach(rating => {
        distribution[rating.rating]++;
      });
      return distribution;
    }
  },
  methods: {
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  getPercentage(count, total) {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  },

  loadPage(page) {
    this.$emit('load-page', page);
  },

  // 🟩 thêm mới
  editRating(rating) {
    this.$emit('edit-rating', rating);
  },

  // 🟥 thêm mới
  deleteRating(id) {
    this.$emit('delete-rating', id);
  }
}
}
</script>

<style scoped>
.rating-display {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rating-summary {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-number {
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.5rem;
  color: #d1d5db;
  transition: color 0.2s;
}

.star.filled {
  color: #fbbf24;
}

.rating-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.ratings-header {
  margin-bottom: 20px;
}

.ratings-header h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.rating-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
}

.rating-label {
  min-width: 60px;
  color: #374151;
  font-weight: 500;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.count {
  min-width: 30px;
  text-align: right;
  color: #6b7280;
}

.ratings-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-item {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.rating-date {
  color: #6b7280;
  font-size: 0.75rem;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-comment {
  color: #374151;
  line-height: 1.5;
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
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

.no-ratings {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-ratings-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.no-ratings p {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 500;
}

.no-ratings-subtitle {
  font-size: 0.875rem;
  color: #9ca3af;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .rating-display {
    padding: 16px;
  }

  .average-rating {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rating-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }
}

/* Owner Actions Styles */
.owner-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .owner-actions {
    justify-content: center;
    gap: 12px;
  }
  
  .edit-btn, .delete-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}
</style>







