<template>
  <div class="appointments-container">
    <el-card class="appointments-card">
      <template #header>
        <div class="header-title">🩺 Lịch khám của bạn</div>
      </template>

      <div class="filters">
        <el-input
          v-model="searchName"
          placeholder="Tìm theo bác sĩ"
          clearable
          class="filter-input"
        />
        <el-date-picker
          v-model="filterDate"
          type="date"
          placeholder="Lọc theo ngày khám"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          class="filter-date"
          clearable
        />
        <el-button @click="clearFilters">Xóa lọc</el-button>
      </div>

      <el-table
        :data="filteredAppointments"
        style="width: 100%"
        v-loading="loading"
        empty-text="Không có lịch khám nào"
      >
        <el-table-column label="Bác sĩ" prop="dr_name" />
        <el-table-column label="Chuyên khoa" prop="specialty" />
        <el-table-column label="Ngày khám" prop="appointment_date">
          <template #default="scope">
            {{ formatDate(scope.row.appointment_date) }}
          </template>
        </el-table-column>

        <el-table-column label="Số thứ tự" prop="queue_number">
          <template #default="scope">
            {{ scope.row.queue_number }}
          </template>
        </el-table-column>
        <el-table-column label="Cơ sở y tế" prop="dr_h_name" />
        <el-table-column label="Đổi lịch" min-width="220">
          <template #default="scope">
            <div class="reschedule-content">
              <div
                v-if="
                  scope.row.reschedule_status === 'requested' &&
                  scope.row.reschedule_requested_by === 'doctor'
                "
              >
                <div style="margin-bottom: 8px">
                  <el-tag type="warning">Đề xuất đổi lịch đang chờ</el-tag>
                </div>
                <div class="reschedule-info" style="margin-bottom: 8px">
                  <strong>Đề xuất:</strong>
                  {{ formatDate(scope.row.proposed_appointment_date) }} (số thứ tự sẽ được cấp khi
                  chấp nhận)
                </div>
                <div
                  v-if="scope.row.reschedule_reason"
                  class="reschedule-info"
                  style="margin-bottom: 12px"
                >
                  <strong>Lý do:</strong> {{ scope.row.reschedule_reason }}
                </div>
                <div class="reschedule-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="acceptReschedule(scope.row.id_appointment)"
                    >Đồng ý</el-button
                  >
                  <el-button
                    size="small"
                    type="danger"
                    @click="declineReschedule(scope.row.id_appointment)"
                    >Từ chối</el-button
                  >
                </div>
              </div>
              <div
                v-else-if="
                  scope.row.reschedule_status === 'requested' &&
                  scope.row.reschedule_requested_by === 'patient'
                "
              >
                <el-tag type="warning">Bạn đã gửi đề xuất - chờ bác sĩ</el-tag>
                <div
                  class="reschedule-info"
                  style="margin-top: 8px"
                >
                  <strong>Đề xuất:</strong>
                  {{ scope.row.proposed_appointment_date ? formatDate(scope.row.proposed_appointment_date) : 'Chưa chọn ngày' }}
                </div>
                <div
                  v-if="scope.row.reschedule_reason"
                  class="reschedule-info"
                  style="margin-top: 8px"
                >
                  <strong>Lý do:</strong> {{ scope.row.reschedule_reason }}
                </div>
              </div>
              <div v-else-if="scope.row.reschedule_status === 'accepted'">
                <el-tag type="success">Đã chấp nhận đổi lịch</el-tag>
              </div>
              <div v-else-if="scope.row.reschedule_status === 'declined'">
                <el-tag type="info">Bạn đã từ chối đổi lịch</el-tag>
              </div>
              <div v-else>
                <el-button
                  size="small"
                  @click="openReschedule(scope.row)"
                  :disabled="isAppointmentInPast(scope.row.appointment_date)"
                >
                  {{
                    isAppointmentInPast(scope.row.appointment_date)
                      ? 'Không thể đổi'
                      : 'Đề xuất đổi lịch'
                  }}
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" min-width="180">
          <template #default="scope">
            <div class="status-column">
              <div style="margin-bottom: 8px">
                <el-tag
                  :type="
                    scope.row.status === 'approved'
                      ? 'success'
                      : scope.row.status === 'pending'
                        ? 'warning'
                        : 'danger'
                  "
                >
                  {{
                    scope.row.status === 'approved'
                      ? 'Đã xác nhận'
                      : scope.row.status === 'pending'
                        ? 'Chờ xác nhận'
                        : 'Từ chối'
                  }}
                </el-tag>
              </div>
              <div class="action-buttons">
                <el-button size="small" @click="viewDetail(scope.row)"> Chi tiết </el-button>
                <el-button
                  v-if="scope.row.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="cancelAppointment(scope.row.id_appointment)"
                >
                  Hủy lịch
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="Chi tiết lịch khám">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Họ tên">{{ selectedPatient?.p_name }}</el-descriptions-item>
        <el-descriptions-item label="Giới tính">{{ selectedPatient?.gender }}</el-descriptions-item>
        <el-descriptions-item label="Ngày sinh">{{
          formatDate(selectedPatient?.dob)
        }}</el-descriptions-item>
        <el-descriptions-item label="Ngày/số thứ tự khám">
          {{ formatDate(selectedPatient?.appointment_date) }} - Số
          {{ selectedPatient?.queue_number }}
        </el-descriptions-item>
        <el-descriptions-item label="SĐT">{{ selectedPatient?.phone }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ selectedPatient?.email }}</el-descriptions-item>
        <el-descriptions-item label="Lý do khám">{{
          selectedPatient?.reason
        }}</el-descriptions-item>
        <el-descriptions-item label="Địa chỉ">
          {{
            [
              selectedPatient?.to_thon,
              selectedPatient?.xa,
              selectedPatient?.quan,
              selectedPatient?.tinh
            ]
              .filter(Boolean)
              .join(', ')
          }}
        </el-descriptions-item>
        <el-descriptions-item label="Bác sĩ">{{ selectedPatient?.dr_name }}</el-descriptions-item>
        <el-descriptions-item label="Chuyên khoa">{{
          selectedPatient?.specialty
        }}</el-descriptions-item>
        <el-descriptions-item label="Bệnh viện">{{
          selectedPatient?.dr_h_name
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">Đóng</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rescheduleDialogVisible" title="📅 Đề xuất đổi lịch khám" width="480px">
      <div class="reschedule-form">
        <div>
          <label class="form-label">Ngày đề xuất</label>
          <el-date-picker
            v-model="rescheduleForm.proposed_date"
            type="date"
            placeholder="Chọn ngày đề xuất"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="onRescheduleDateChange"
            :disabled-date="disabledDate"
          />
        </div>

        <!-- Time slots -->
        <div v-if="availableTimeSlots.length > 0">
          <label class="form-label">Chọn khung giờ khám</label>
          <div class="time-slots-container">
            <div
              v-for="slot in availableTimeSlots"
              :key="slot"
              :class="['time-slot', { selected: rescheduleForm.selected_time_slot === slot }]"
              @click="selectTimeSlot(slot)"
            >
              {{ slot }}
            </div>
          </div>
        </div>

        <!-- No slots available -->
        <div v-if="rescheduleForm.proposed_date && availableTimeSlots.length === 0">
          <el-alert
            title="Không có lịch trống"
            type="warning"
            description="Bác sĩ không có lịch trống trong ngày này. Vui lòng chọn ngày khác."
            show-icon
            :closable="false"
          />
        </div>

        <div>
          <label class="form-label">Lý do đổi lịch</label>
          <el-input
            v-model="rescheduleForm.reason"
            type="textarea"
            :rows="3"
            placeholder="Nhập lý do bạn muốn đổi lịch khám..."
            maxlength="200"
            show-word-limit
          />
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="rescheduleDialogVisible = false">Hủy bỏ</el-button>
          <el-button
            type="primary"
            @click="submitReschedule"
            :disabled="!rescheduleForm.selected_time_slot"
            >Gửi đề xuất</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from '@/axios';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

const selectedPatient = ref(null);
const dialogVisible = ref(false);
const rescheduleDialogVisible = ref(false);
const rescheduleForm = ref({
  id_appointment: null,
  proposed_date: '',
  selected_time_slot: '',
  doctor_id: null,
  reason: ''
});

const availableTimeSlots = ref([]);
const appointments = ref([]);
const loading = ref(false);
const searchName = ref('');
const filterDate = ref('');

const formatDate = (isoDateStr) => {
  return dayjs(isoDateStr).add(7, 'hour').format('DD/MM/YYYY');
};

const disabledDate = (time) => {
  return time.getTime() <= Date.now() - 24 * 60 * 60 * 1000;
};

const isAppointmentInPast = (appointmentDate) => {
  const apptDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  apptDate.setHours(0, 0, 0, 0);
  return apptDate <= today;
};

const viewDetail = (patient) => {
  selectedPatient.value = patient;
  dialogVisible.value = true;
};

const fetchAppointments = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('userToken');
    const res = await axios.get('http://localhost:3000/api/patients/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    appointments.value = res.data;
  } catch (err) {
    console.error('Lỗi lấy lịch:', err);
    ElMessage.error('Không thể tải lịch khám');
  } finally {
    loading.value = false;
  }
};

const cancelAppointment = async (id_appointment) => {
  try {
    const token = localStorage.getItem('userToken');
    await axios.delete(`http://localhost:3000/api/patients/${id_appointment}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ElMessage.success('Đã hủy và xóa lịch khám');
    fetchAppointments();
  } catch (err) {
    console.error('Lỗi hủy lịch:', err);
    ElMessage.error('Không thể hủy lịch khám');
  }
};

onMounted(fetchAppointments);

const filteredAppointments = computed(() => {
  const name = (searchName.value || '').trim().toLowerCase();
  const date = (filterDate.value || '').trim();
  return appointments.value.filter((item) => {
    const doctorName = String(item.dr_name || '').toLowerCase();
    const appointmentDate = String(item.appointment_date || '');
    const nameOk = name ? doctorName.includes(name) : true;
    const dateOk = date ? appointmentDate.startsWith(date) : true;
    return nameOk && dateOk;
  });
});

const clearFilters = () => {
  searchName.value = '';
  filterDate.value = '';
};

const acceptReschedule = async (id) => {
  try {
    const token = localStorage.getItem('userToken');
    await axios.post(
      `http://localhost:3000/api/patients/${id}/reschedule/accept`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    ElMessage.success('Đã chấp nhận đổi lịch');
    fetchAppointments();
  } catch (err) {
    console.error('Lỗi chấp nhận đổi lịch:', err);
    ElMessage.error('Không thể chấp nhận đổi lịch');
  }
};

const declineReschedule = async (id) => {
  try {
    const token = localStorage.getItem('userToken');
    await axios.post(
      `http://localhost:3000/api/patients/${id}/reschedule/decline`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    ElMessage.success('Đã từ chối đổi lịch');
    fetchAppointments();
  } catch (err) {
    console.error('Lỗi từ chối đổi lịch:', err);
    ElMessage.error('Không thể từ chối đổi lịch');
  }
};

const openReschedule = (row) => {
  if (isAppointmentInPast(row.appointment_date)) {
    ElMessage.warning('Không thể đổi lịch cho cuộc hẹn đã qua hoặc trong ngày hôm nay');
    return;
  }
  rescheduleForm.value = {
    id_appointment: row.id_appointment,
    proposed_date: '',
    selected_time_slot: '',
    doctor_id: row.dr_id,
    reason: ''
  };
  availableTimeSlots.value = [];
  rescheduleDialogVisible.value = true;
};

const onRescheduleDateChange = async () => {
  rescheduleForm.value.selected_time_slot = '';
  await fetchDoctorSchedules();
};

const fetchDoctorSchedules = async () => {
  if (!rescheduleForm.value.proposed_date || !rescheduleForm.value.doctor_id) {
    availableTimeSlots.value = [];
    return;
  }
  try {
    const token = localStorage.getItem('userToken');
    const response = await axios.get(
      `http://localhost:3000/api/doctors/${rescheduleForm.value.doctor_id}/available-slots`,
      {
        params: { date: rescheduleForm.value.proposed_date },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const slots = response.data?.availableSlots || [];
    const unique = Array.from(new Set(slots));
    unique.sort((a, b) =>
      (a?.split('-')[0] || '').trim().localeCompare((b?.split('-')[0] || '').trim())
    );
    availableTimeSlots.value = unique;
  } catch (err) {
    console.error('Lỗi lấy lịch bác sĩ:', err);
    availableTimeSlots.value = [];
    ElMessage.error('Không thể tải lịch trống của bác sĩ');
  }
};

const selectTimeSlot = (slot) => {
  rescheduleForm.value.selected_time_slot = slot;
};

const submitReschedule = async () => {
  if (!rescheduleForm.value.proposed_date || !rescheduleForm.value.selected_time_slot) {
    ElMessage.error('Vui lòng chọn ngày và khung giờ đề xuất');
    return;
  }

  const selectedDate = new Date(rescheduleForm.value.proposed_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate <= today) {
    ElMessage.error('Không thể đề xuất lịch khám trong quá khứ hoặc hôm nay');
    return;
  }

  if (!availableTimeSlots.value.includes(rescheduleForm.value.selected_time_slot)) {
    ElMessage.error('Khung giờ đã thay đổi hoặc không còn trống, vui lòng chọn lại');
    return;
  }

  try {
    const token = localStorage.getItem('userToken');
    await axios.post(
      `http://localhost:3000/api/patients/${rescheduleForm.value.id_appointment}/reschedule`,
      {
        proposed_date: rescheduleForm.value.proposed_date,
        proposed_time_slot: rescheduleForm.value.selected_time_slot,
        reason: rescheduleForm.value.reason
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    ElMessage.success('Đã gửi đề xuất đổi lịch tới bác sĩ');
    rescheduleDialogVisible.value = false;
    fetchAppointments();
  } catch (err) {
    console.error('Lỗi gửi đề xuất:', err);
    ElMessage.error('Không thể gửi đề xuất');
  }
};
</script>

<style scoped>
/* Container chính */
.appointments-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.appointments-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  margin-bottom: 24px;
}

.filters {
  display: flex;
  gap: 16px;
  align-items: center;
  margin: 0 0 24px;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-input {
  width: 280px;
}

.filter-date {
  width: 220px;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c5aa0;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 8px 0;
}

::v-deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

::v-deep(.el-table th) {
  background-color: #f8fafc;
  font-size: 16px !important;
  font-weight: 600;
  color: #374151;
  padding: 16px 12px !important;
  border-bottom: 2px solid #e5e7eb;
}

::v-deep(.el-table td) {
  font-size: 15px !important;
  padding: 20px 12px !important;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

::v-deep(.el-table tbody tr:hover) {
  background-color: #f9fafb;
}

::v-deep(.el-button--small) {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  font-weight: 500;
}

::v-deep(.el-button + .el-button) {
  margin-left: 8px;
}

::v-deep(.el-button.is-disabled) {
  background-color: #f5f5f5 !important;
  color: #c0c4cc !important;
  border-color: #e4e7ed !important;
  cursor: not-allowed !important;
}

::v-deep(.el-button.is-disabled:hover) {
  background-color: #f5f5f5 !important;
  color: #c0c4cc !important;
  border-color: #e4e7ed !important;
}

::v-deep(.el-tag) {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
}

::v-deep(.el-tag--success) {
  background-color: #dcfce7;
  color: #16a34a;
}

::v-deep(.el-tag--warning) {
  background-color: #fef3c7;
  color: #d97706;
}

::v-deep(.el-tag--danger) {
  background-color: #fecaca;
  color: #dc2626;
}

::v-deep(.el-tag--info) {
  background-color: #e0e7ff;
  color: #4338ca;
}

.reschedule-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.reschedule-info {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.reschedule-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

::v-deep(.el-dialog) {
  border-radius: 12px;
}

::v-deep(.el-dialog__header) {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}

::v-deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

::v-deep(.el-dialog__body) {
  padding: 24px;
}

::v-deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid #f3f4f6;
}

::v-deep(.el-descriptions__label) {
  font-size: 15px !important;
  font-weight: 600;
  color: #374151;
  width: 30%;
}

::v-deep(.el-descriptions__content) {
  font-size: 15px !important;
  color: #6b7280;
}

::v-deep(.el-descriptions__body .el-descriptions__table) {
  border-radius: 8px;
}

.reschedule-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.time-slots-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.time-slot {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background-color: #ffffff;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.time-slot:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.time-slot.selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
}

::v-deep(.el-date-picker),
::v-deep(.el-time-picker) {
  width: 100%;
}

::v-deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #d1d5db;
}

::v-deep(.el-input__wrapper:focus-within) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

::v-deep(.el-textarea .el-textarea__inner) {
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

::v-deep(.el-textarea .el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

::v-deep(.el-input__count) {
  color: #9ca3af;
  font-size: 12px;
}

@media (max-width: 768px) {
  .appointments-container {
    padding: 16px 12px;
  }

  .header-title {
    font-size: 24px;
  }

  ::v-deep(.el-table th),
  ::v-deep(.el-table td) {
    padding: 12px 8px !important;
    font-size: 14px !important;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-input,
  .filter-date {
    width: 100%;
  }

  .reschedule-buttons {
    flex-direction: column;
  }

  ::v-deep(.el-button--small) {
    width: 100%;
    margin-left: 0 !important;
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  ::v-deep(.el-table) {
    font-size: 12px;
  }

  .reschedule-content {
    min-width: auto;
  }
}
</style>