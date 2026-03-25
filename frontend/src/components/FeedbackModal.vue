<template>
  <div
    v-if="show"
    class="feedback-modal-overlay"
    @click="closeModal"
  >
    <div
      class="feedback-modal"
      @click.stop
    >
      <div class="feedback-header">
        <h3>Đánh giá kết quả chẩn đoán</h3>
        <button
          @click="closeModal"
          class="close-btn"
        >
          &times;
        </button>
      </div>

      <div class="feedback-content">
        <div class="diagnosis-summary">
          <h4>Kết quả chẩn đoán:</h4>
          <div class="symptoms-list">
            <span
              v-for="symptom in diagnosisData.symptoms"
              :key="symptom.id"
              class="symptom-tag"
            >
              {{ symptom.name }}
            </span>
          </div>
          <div class="specialties-list">
            <span
              v-for="specialty in diagnosisData.specialties"
              :key="specialty"
              class="specialty-tag"
            >
              {{ specialty }}
            </span>
          </div>
        </div>

        <div class="feedback-form">
          <div class="form-group">
            <label>Độ chính xác của chẩn đoán (1-5):</label>
            <div class="rating-buttons">
              <button
                v-for="rating in 5"
                :key="rating"
                @click="selectedAccuracy = rating"
                :class="['rating-btn', { active: selectedAccuracy === rating }]"
              >
                {{ rating }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Chuyên khoa thực tế (nếu khác):</label>
            <input
              v-model="actualSpecialties"
              type="text"
              placeholder="Ví dụ: Tim mạch, Nội khoa"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Ghi chú thêm:</label>
            <textarea
              v-model="notes"
              placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
              class="form-textarea"
            ></textarea>
          </div>
        </div>

        <div class="feedback-actions">
          <button
            @click="closeModal"
            class="btn-secondary"
          >
            Bỏ qua
          </button>
          <button
            @click="submitFeedback"
            class="btn-primary"
            :disabled="!selectedAccuracy"
          >
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'FeedbackModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    diagnosisData: {
      type: Object,
      default: () => ({
        symptoms: [],
        specialties: [],
        confidence: 0
      })
    }
  },
  data() {
    return {
      selectedAccuracy: null,
      actualSpecialties: '',
      notes: '',
      submitting: false
    };
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    async submitFeedback() {
      if (!this.selectedAccuracy) return;

      this.submitting = true;
      try {
        const feedbackData = {
          symptoms: this.diagnosisData.symptoms.map((s) => s.name),
          suggestedSpecialties: this.diagnosisData.specialties,
          actualSpecialties: this.actualSpecialties
            ? this.actualSpecialties.split(',').map((s) => s.trim())
            : [],
          accuracy: this.selectedAccuracy,
          notes: this.notes
        };

        await axios.post('/api/feedback/diagnosis', feedbackData);

        this.$emit('feedback-submitted', {
          accuracy: this.selectedAccuracy,
          notes: this.notes
        });

        this.closeModal();
        this.resetForm();

        // Hiển thị thông báo thành công
        this.$emit('show-message', {
          type: 'success',
          text: 'Cảm ơn bạn đã đánh giá! Điều này giúp chúng tôi cải thiện hệ thống.'
        });
      } catch (error) {
        console.error('Feedback submission error:', error);
        this.$emit('show-message', {
          type: 'error',
          text: 'Không thể gửi đánh giá. Vui lòng thử lại.'
        });
      } finally {
        this.submitting = false;
      }
    },
    resetForm() {
      this.selectedAccuracy = null;
      this.actualSpecialties = '';
      this.notes = '';
    }
  }
};
</script>

<style scoped>
.feedback-modal-overlay {
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

.feedback-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.feedback-header h3 {
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

.feedback-content {
  padding: 24px;
}

.diagnosis-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.diagnosis-summary h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.symptoms-list,
.specialties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.symptom-tag,
.specialty-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.specialty-tag {
  background: #dcfce7;
  color: #166534;
}

.feedback-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.rating-buttons {
  display: flex;
  gap: 8px;
}

.rating-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
}

.rating-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.rating-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.feedback-actions {
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
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .feedback-modal {
    width: 95%;
    margin: 20px;
  }

  .feedback-content {
    padding: 16px;
  }

  .rating-buttons {
    justify-content: center;
  }

  .feedback-actions {
    flex-direction: column;
  }
}
</style>
