<template>
  <div
    v-if="show"
    class="rating-modal-overlay"
    @click="closeModal"
  >
    <div
      class="rating-modal"
      @click.stop
    >
      <div class="rating-header">
        <h3>{{ editing ? 'Chỉnh sửa đánh giá' : 'Đánh giá bệnh viện' }}</h3>
        <button
          @click="closeModal"
          class="close-btn"
        >
          &times;
        </button>
      </div>

      <div class="rating-content">
        <div class="hospital-info" v-if="hospital">
          <div class="hospital-logo">
            <img 
              :src="hospital.logo || '/uploads/hospital.png'" 
              :alt="hospital.name"
              class="logo-img"
            />
          </div>
          <div class="hospital-details">
            <h4>{{ hospital.name }}</h4>
            <p class="hospital-address">{{ hospital.address }}</p>
            <p class="hospital-phone">{{ hospital.phone }}</p>
          </div>
        </div>

        <div class="rating-form">
          <div class="form-group">
            <label>Đánh giá của bạn (1-5 sao):</label>
            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                @click="selectedRating = star"
                :class="['star-btn', { active: star <= selectedRating }]"
                class="star"
              >
                ★
              </button>
            </div>
            <p class="rating-text" v-if="selectedRating">
              {{ getRatingText(selectedRating) }}
            </p>
          </div>

          <div class="form-group">
            <label>Bình luận của bạn:</label>
            <textarea
              v-model="comment"
              placeholder="Chia sẻ trải nghiệm của bạn với bệnh viện này..."
              class="form-textarea"
              :class="{ error: commentError }"
            ></textarea>
            <p class="error-text" v-if="commentError">{{ commentError }}</p>
            <p class="char-count">{{ comment.length }}/500</p>
          </div>
        </div>

        <div class="rating-actions">
          <button
            @click="closeModal"
            class="btn-secondary"
          >
            Hủy
          </button>
          <button
            @click="submitRating"
            class="btn-primary"
            :disabled="!canSubmit"
            :class="{ loading: submitting }"
          >
            <span v-if="submitting">Đang gửi...</span>
            <span v-else>{{ editing ? 'Lưu thay đổi' : 'Gửi đánh giá' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'HospitalRatingModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    hospital: {
      type: Object,
      default: null
    },
    editRating: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      selectedRating: 0,
      comment: '',
      submitting: false,
      commentError: ''
    };
  },
  computed: {
    canSubmit() {
      return this.selectedRating > 0 && 
             this.comment.trim().length >= 10 && 
             this.comment.trim().length <= 500 &&
             !this.submitting;
    },
    editing() {
      return this.editRating !== null;
    }
  },
  watch: {
    comment(newValue) {
      if (newValue.length > 500) {
        this.commentError = 'Bình luận không được vượt quá 500 ký tự';
      } else if (newValue.trim().length < 10 && newValue.length > 0) {
        this.commentError = 'Bình luận phải có ít nhất 10 ký tự';
      } else {
        this.commentError = '';
      }
    },

    // 🟩 Khi người dùng chọn "Sửa" → tự động hiển thị dữ liệu cũ
    editRating: {
      immediate: true,
      handler(data) {
        if (data) {
          this.selectedRating = data.rating || 0;
          this.comment = data.comment || '';
        } else {
          this.resetForm();
        }
      }
    },

    // 🟩 Reset form mỗi khi đóng modal
    show(value) {
      if (!value) this.resetForm();
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
      this.resetForm();
    },
    
    getRatingText(rating) {
      const texts = {
        1: 'Rất không hài lòng',
        2: 'Không hài lòng', 
        3: 'Bình thường',
        4: 'Hài lòng',
        5: 'Rất hài lòng'
      };
      return texts[rating] || '';
    },

    async submitRating() {
      if (!this.canSubmit) return;

      this.submitting = true;
      try {
        const ratingData = {
          hospitalId: this.hospital.id,
          rating: this.selectedRating,
          comment: this.comment.trim()
        };

        if (this.editing && this.editRating?.id_fb_hos) {
          // 🟦 Nếu là chế độ sửa → xóa cũ rồi tạo mới
          await axios.delete(`/feedback/hospital-rating/${this.editRating.id_fb_hos}`);
          await axios.post('/feedback/hospital-rating', ratingData);
          
          this.$emit('show-message', {
            type: 'success',
            text: 'Đánh giá của bạn đã được cập nhật thành công.'
          });
        } else {
          // 🟩 Nếu là chế độ thêm mới
          await axios.post('/feedback/hospital-rating', ratingData);
          
          this.$emit('show-message', {
            type: 'success',
            text: 'Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.'
          });
        }

        this.$emit('rating-submitted');
        this.closeModal();
      } catch (error) {
        console.error('Rating submission error:', error);
        let errorMessage = 'Không thể gửi đánh giá. Vui lòng thử lại.';
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }

        this.$emit('show-message', {
          type: 'error',
          text: errorMessage
        });
      } finally {
        this.submitting = false;
      }
    },

    resetForm() {
      this.selectedRating = 0;
      this.comment = '';
      this.commentError = '';
    }
  }
};
</script>

<style scoped>
.rating-modal-overlay {
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

.rating-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.rating-header h3 {
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

.rating-content {
  padding: 24px;
}

.hospital-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.hospital-logo {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hospital-details h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.hospital-address {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.hospital-phone {
  margin: 0;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.rating-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.star-rating {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;
}

.star-btn:hover,
.star-btn.active {
  color: #fbbf24;
  transform: scale(1.1);
}

.rating-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.form-textarea {
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

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea.error {
  border-color: #ef4444;
}

.error-text {
  margin: 4px 0 0 0;
  color: #ef4444;
  font-size: 0.75rem;
}

.char-count {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.75rem;
  text-align: right;
}

.rating-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  position: relative;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-primary.loading {
  color: transparent;
}

.btn-primary.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

@media (max-width: 640px) {
  .rating-modal {
    width: 95%;
    margin: 20px;
  }

  .rating-content {
    padding: 16px;
  }

  .hospital-info {
    flex-direction: column;
    text-align: center;
  }

  .star-rating {
    justify-content: center;
  }

  .rating-actions {
    flex-direction: column;
  }
}
</style>
