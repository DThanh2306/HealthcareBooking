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
        <h3>{{ editing ? 'Chỉnh sửa đánh giá' : 'Đánh giá bác sĩ' }}</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="rating-content">
        <div class="doctor-info" v-if="doctor">
          <div class="doctor-avatar">
            <img 
              :src="doctor?.image || placeholderImage"
          :alt="doctor?.dr_name"
              class="avatar-img"
            />
          </div>
          <div class="doctor-details">
            <h4>{{ doctor.dr_name }}</h4>
            <p class="doctor-specialty">{{ doctor.specialty }}</p>
            <p class="doctor-hospital">{{ doctor.dr_h_name}}</p>
          </div>
        </div>

        <div class="rating-form">
          <div class="form-group">
            <label>Đánh giá của bạn (1–5 sao):</label>
            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                @click="selectedRating = star"
                :class="['star-btn', { active: star <= selectedRating }]"
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
              placeholder="Chia sẻ trải nghiệm của bạn với bác sĩ này..."
              class="form-textarea"
              :class="{ error: commentError }"
            ></textarea>
            <p class="error-text" v-if="commentError">{{ commentError }}</p>
            <p class="char-count">{{ comment.length }}/500</p>
          </div>
        </div>

        <div class="rating-actions">
          <button @click="closeModal" class="btn-secondary">Hủy</button>
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
import axios from "../axios";

export default {
  name: "DoctorRatingModal",
  props: {
    show: { type: Boolean, default: false },
    doctor: { type: Object, default: null },
    editing: { type: Boolean, default: false },
    editingData: { type: Object, default: null } // { id_fb, rating, comment }
  },
  data() {
    return {
      selectedRating: 0,
      comment: "",
      submitting: false,
      commentError: ""
    };
  },
  computed: {
    canSubmit() {
      return (
        this.selectedRating > 0 &&
        this.comment.trim().length >= 10 &&
        this.comment.trim().length <= 500 &&
        !this.submitting
      );
    }
  },
  watch: {
    comment(newValue) {
      if (newValue.length > 500) {
        this.commentError = "Bình luận không được vượt quá 500 ký tự";
      } else if (newValue.trim().length < 10 && newValue.length > 0) {
        this.commentError = "Bình luận phải có ít nhất 10 ký tự";
      } else {
        this.commentError = "";
      }
    },

    // 🟩 Khi người dùng chọn "Sửa" → tự động hiển thị dữ liệu cũ
    editingData: {
      immediate: true,
      handler(data) {
        if (data) {
          this.selectedRating = data.rating || 0;
          this.comment = data.comment || "";
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
      this.$emit("close");
      this.resetForm();
    },

    getRatingText(rating) {
      const texts = {
        1: "Rất không hài lòng",
        2: "Không hài lòng",
        3: "Bình thường",
        4: "Hài lòng",
        5: "Rất hài lòng"
      };
      return texts[rating] || "";
    },

    async submitRating() {
      if (!this.canSubmit) return;

      this.submitting = true;
      try {
        const ratingData = {
          doctorId: this.doctor.dr_id,
          rating: this.selectedRating,
          comment: this.comment.trim()
        };

        if (this.editing && this.editingData?.id_fb) {
          // 🟦 Nếu là chế độ sửa → gọi API update
          await axios.put(`/feedback/doctor-rating/${this.editingData.id_fb}`, ratingData);
          this.$emit("show-message", {
            type: "success",
            text: "Đánh giá của bạn đã được cập nhật thành công."
          });
        } else {
          // 🟩 Nếu là chế độ thêm mới
          await axios.post("/feedback/doctor-rating", ratingData);
          this.$emit("show-message", {
            type: "success",
            text: "Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công."
          });
        }

        this.$emit("rating-submitted");
        this.closeModal();
      } catch (error) {
        console.error("Rating submission error:", error);
        let errorMessage = "Không thể gửi đánh giá. Vui lòng thử lại.";
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }

        this.$emit("show-message", {
          type: "error",
          text: errorMessage
        });
      } finally {
        this.submitting = false;
      }
    },

    resetForm() {
      this.selectedRating = 0;
      this.comment = "";
      this.commentError = "";
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

.doctor-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.doctor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doctor-details h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.doctor-specialty {
  margin: 0 0 4px 0;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.doctor-hospital {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
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
  background: #3b82f6;
  color: white;
  position: relative;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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

  .doctor-info {
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
