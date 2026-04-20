<template>
    <div class="doctor-appointments">
      <div class="header">
        <h2>📅 Lịch khám của tôi (Bác sĩ)</h2>
      </div>
      <div class="filters">
        <el-input
          v-model="searchName"
          placeholder="Tìm theo tên bệnh nhân"
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
      <el-table :data="filteredAppointments" style="width: 100%" v-loading="loading" empty-text="Không có lịch khám">
        <el-table-column label="Bệnh nhân" prop="p_name" />
        <el-table-column label="Ngày khám" prop="appointment_date">
          <template #default="scope">
            {{ formatDate(scope.row.appointment_date) }}
          </template>
        </el-table-column>
        <el-table-column label="Giờ khám" prop="time_slot" width="120" />
        <el-table-column label="Trạng thái" prop="status" width="140">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Phê duyệt" min-width="200">
          <template #default="scope">
            <div class="approval-column">
              <el-button
                v-if="scope.row.status === 'pending'"
                size="small"
                type="success"
                @click="approve(scope.row.id_appointment)"
              >Phê duyệt</el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                size="small"
                type="danger"
                @click="reject(scope.row.id_appointment)"
              >Từ chối</el-button>
              <span v-else style="color: #9ca3af; font-style: italic;">Đã xử lý</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Đổi lịch" min-width="280">
          <template #default="scope">
            <div class="reschedule-content">
              <div class="action-row">
                <template v-if="!hasAnyReschedule(scope.row)">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="openReschedule(scope.row)"
                    :disabled="isAppointmentInPast(scope.row.appointment_date)"
                  >
                    {{ isAppointmentInPast(scope.row.appointment_date) ? 'Không thể đổi' : 'Đề xuất đổi lịch' }}
                  </el-button>
                </template>
  
                <template v-if="scope.row.reschedule_status === 'requested' && scope.row.reschedule_requested_by === 'patient'">
                  <el-tag type="warning">Đề xuất đang chờ</el-tag>
                </template>
  
                <el-tag v-else-if="scope.row.reschedule_status === 'requested' && scope.row.reschedule_requested_by === 'doctor'" type="warning">
                  Bạn đã gửi đề xuất - chờ bệnh nhân
                </el-tag>
                <el-tag v-else-if="scope.row.reschedule_status === 'accepted'" type="success">
                  BN đã chấp nhận
                </el-tag>
                <el-tag v-else-if="scope.row.reschedule_status === 'declined'" type="info">
                  BN đã từ chối
                </el-tag>
              </div>
  
              <!-- Thông tin đề xuất từ bệnh nhân -->
              <template v-if="scope.row.reschedule_status === 'requested' && scope.row.reschedule_requested_by === 'patient'">
                <div class="proposal-info">
                  <strong>Đề xuất:</strong> {{ formatDate(scope.row.proposed_appointment_date) }} (số thứ tự sẽ được cấp khi chấp nhận)
                </div>
                <div class="proposal-info" v-if="scope.row.reschedule_reason">
                  <strong>Lý do:</strong> {{ scope.row.reschedule_reason }}
                </div>
  
                <div class="proposal-actions">
                  <el-button 
                    size="small" 
                    type="success"
                    @click="acceptReschedule(scope.row.id_appointment)"
                  >
                    Đồng ý đổi
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger"
                    @click="declineReschedule(scope.row.id_appointment)"
                  >
                    Từ chối đổi
                  </el-button>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
  
      </el-table>
  
      <el-dialog v-model="dialogVisible" title="👩‍⚕️ Đề xuất đổi lịch khám (Bác sĩ)" width="480px">
        <div class="dialog-form">
          <div>
            <label class="form-label">Ngày đề xuất</label>
            <el-date-picker
              v-model="form.proposed_date"
              type="date"
              placeholder="Chọn ngày đề xuất cho bệnh nhân"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              style="width: 100%"
            />
          </div>
          
          <div v-if="form.proposed_date">
            <el-alert
              title="Lưu ý"
              type="info"
              description="Khi bệnh nhân chấp nhận đề xuất, họ sẽ được cấp số thứ tự mới cho ngày đã chọn."
              show-icon
              :closable="false"
            />
          </div>
          
          <div>
            <label class="form-label">Lý do đổi lịch</label>
            <el-input 
              v-model="form.reason" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập lý do bạn muốn đổi lịch khám cho bệnh nhân..."
              maxlength="200"
              show-word-limit
            />
          </div>
        </div>
        
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <el-button @click="dialogVisible = false">Hủy bỏ</el-button>
            <el-button type="primary" @click="submitReschedule" :disabled="!form.proposed_date">Gửi đề xuất</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import axios from '@/axios';
  import dayjs from 'dayjs';
  import { ElMessage } from 'element-plus';
  
  const appointments = ref([]);
  const searchName = ref('');
  const filterDate = ref('');
  const loading = ref(false);
  const dialogVisible = ref(false);
  const currentAppointmentId = ref(null);
  const currentDoctorId = ref(null);
  const form = ref({
    proposed_date: '',
    reason: ''
  });
  
  const formatDate = (iso) => dayjs(iso).add(7, 'hour').format('DD/MM/YYYY');
  const statusLabel = (s) => s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Đã từ chối';
  const statusType = (s) => (s === 'pending' ? 'warning' : s === 'approved' ? 'success' : 'danger');

  // Disable past dates and today
  const disabledDate = (time) => time.getTime() <= Date.now() - 24 * 60 * 60 * 1000;
  const isAppointmentInPast = (appointmentDate) => {
    const d = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d <= today;
  };
  const hasPendingOrFinalReschedule = (row) => {
    const s = row?.reschedule_status;
    return s === 'requested' || s === 'accepted' || s === 'declined';
  };
  // Hide propose button only if status is not 'none'
  const hasAnyReschedule = (row) => {
    const s = row?.reschedule_status;
    return s === 'requested' || s === 'accepted' || s === 'declined';
  };
  
  const fetchAppointments = async () => {
    loading.value = true;
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get('http://localhost:3000/api/patients/doctor/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      appointments.value = res.data;
    } catch (e) {
      ElMessage.error('Không thể tải lịch khám');
    } finally {
      loading.value = false;
    }
  };
  
  const openReschedule = (row) => {
    currentAppointmentId.value = row.id_appointment;
    currentDoctorId.value = row.dr_id || row.doctor_id || row.id_doctor || null;
    form.value = { proposed_date: '', reason: '' };
    dialogVisible.value = true;
  };

  const submitReschedule = async () => {
    if (!form.value.proposed_date) {
      ElMessage.error('Vui lòng chọn ngày đề xuất');
      return;
    }
    // Validate date not in past/today
    const selectedDate = new Date(form.value.proposed_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate <= today) {
      ElMessage.error('Không thể đề xuất ngày trong quá khứ hoặc hôm nay');
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:3000/api/patients/${currentAppointmentId.value}/reschedule`, {
        proposed_date: form.value.proposed_date,
        reason: form.value.reason
      }, { headers: { Authorization: `Bearer ${token}` } });
      ElMessage.success('Đã gửi đề xuất đổi lịch tới bệnh nhân');
      dialogVisible.value = false;
      fetchAppointments();
    } catch (e) {
      ElMessage.error('Gửi đề xuất thất bại');
    }
  };
  
  let pollTimer = null;
  onMounted(() => {
    fetchAppointments();
    // Polling for near real-time updates
    pollTimer = setInterval(fetchAppointments, 15000);
  });
  onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer);
  });
  
  const filteredAppointments = computed(() => {
    const name = (searchName.value || '').trim().toLowerCase();
    const date = (filterDate.value || '').trim();
    return appointments.value.filter(a => {
      const nameOk = name ? String(a.p_name || '').toLowerCase().includes(name) : true;
      const dateOk = date ? String(a.appointment_date).startsWith(date) : true;
      return nameOk && dateOk;
    });
  });
  
  const clearFilters = () => {
    searchName.value = '';
    filterDate.value = '';
  };
  
  // Approve/Reject like admin
  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:3000/api/patients/status/${id}`, { status });
      ElMessage.success('Cập nhật trạng thái thành công');
      fetchAppointments();
    } catch (e) {
      ElMessage.error('Không thể cập nhật trạng thái');
    }
  };
  const approve = (id) => updateStatus(id, 'approved');
  const reject = (id) => updateStatus(id, 'rejected');
  
  // Accept/Decline reschedule requests (from patient)
  const acceptReschedule = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:3000/api/patients/${id}/reschedule/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      ElMessage.success('Đã chấp nhận đổi lịch');
      fetchAppointments();
    } catch (e) {
      ElMessage.error('Không thể chấp nhận đổi lịch');
    }
  };
  const declineReschedule = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:3000/api/patients/${id}/reschedule/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      ElMessage.success('Đã từ chối đổi lịch');
      fetchAppointments();
    } catch (e) {
      ElMessage.error('Không thể từ chối đổi lịch');
    }
  };
  </script>
  
  <style scoped>
  /* Container chính */
  .doctor-appointments { 
    padding: 24px;
    max-width: 1400px; 
    margin: 0 auto;
    background-color: #f5f7fa;
    min-height: 100vh;
  }
  
  /* Header */
  .header { 
    margin: 0 0 24px;
    padding: 8px 0;
  }
  
  .header h2 { 
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #2c5aa0;
  }
  
  /* Filters section */
  .filters { 
    display: flex; 
    gap: 16px; 
    align-items: center; 
    margin: 0 0 24px; 
    flex-wrap: wrap;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .filter-input { 
    width: 280px;
  }
  
  .filter-date { 
    width: 220px;
  }
  
  /* Table styling */
  ::v-deep(.el-table) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: none;
  }
  
  ::v-deep(.el-table th) { 
    background-color: #f8fafc;
    padding: 16px 12px !important;
    font-size: 16px !important;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  
  ::v-deep(.el-table td) { 
    padding: 20px 12px !important;
    line-height: 1.6;
    font-size: 15px !important;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
  
  ::v-deep(.el-table tbody tr:hover) {
    background-color: #f9fafb;
  }
  
  /* Buttons styling */
  ::v-deep(.el-button--small) {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 6px;
    font-weight: 500;
  }
  
  ::v-deep(.el-button + .el-button) {
    margin-left: 8px;
  }
  
  /* Tags styling */
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
    background-color: #fecaca;
    color: #dc2626;
  }
  
  /* Cột phê duyệt */
  .approval-column {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  /* Cột đổi lịch - styling đặc biệt */
  .reschedule-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 240px;
  }
  
  .action-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  
  .proposal-info {
    font-size: 13px;
    color: #6b7280;
    margin: 6px 0;
    line-height: 1.4;
  }
  
  .proposal-info strong {
    color: #374151;
  }
  
  .proposal-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  /* Time slots grid */
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

  /* Dialog styling */
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
  
  /* Form elements trong dialog */
  .dialog-form { 
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
  
  .time-row { 
    display: flex; 
    gap: 12px;
    align-items: center;
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
  
  /* Responsive design */
  @media (max-width: 768px) {
    .doctor-appointments {
      padding: 16px 12px;
    }
    
    .header h2 {
      font-size: 24px;
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
    
    ::v-deep(.el-table th),
    ::v-deep(.el-table td) {
      padding: 12px 8px !important;
      font-size: 14px !important;
    }
    
    .action-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .proposal-actions {
      flex-direction: column;
    }
    
    ::v-deep(.el-button--small) {
      width: 100%;
      margin-left: 0 !important;
      margin-top: 4px;
    }
  }
  
  @media (max-width: 480px) {
    .time-row {
      flex-direction: column;
      gap: 8px;
    }
  }
  </style>
  
  
  