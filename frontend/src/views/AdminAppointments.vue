<template>
  <div class="admin-appointments">
    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý lịch khám</h1>
        <p>Xem, lọc và phê duyệt các lịch khám của bệnh nhân.</p>
      </div>
    </div>

    <div class="toolbar" style="display:flex; gap:10px; align-items:center; margin-bottom:16px;">
      <el-button type="success" @click="openCreateDialog">Tạo lịch</el-button>
    </div>

    <div
      class="tab-navigation"
      style="margin-bottom: 20px"
    >
      <el-button
        :type="activeTab === 'pending' ? 'primary' : 'default'"
        @click="goToTab('pending')"
      >
        Chờ phê duyệt
      </el-button>
      <el-button
        :type="activeTab === 'approved' ? 'primary' : 'default'"
        @click="goToTab('approved')"
      >
        Đã phê duyệt
      </el-button>
      <el-button
        :type="activeTab === 'rejected' ? 'primary' : 'default'"
        @click="goToTab('rejected')"
      >
        Đã từ chối
      </el-button>
    </div>

    <div style="margin-bottom: 20px">
      <el-date-picker
        v-model="filterDate"
        type="date"
        placeholder="Chọn ngày khám"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        @change="handleDateChange"
      />
      <el-button
        @click="clearDateFilter"
        style="margin-left: 10px"
        >Xóa lọc ngày</el-button
      >
    </div>

    <el-pagination
      layout="prev, pager, next"
      :total="totalItems"
      :page-size="limit"
      :current-page="page"
      @current-change="handlePageChange"
      class="my-3"
    />

    <el-table
      :data="appointments"
      stripe
      style="width: 100%"
    >
      <el-table-column
        label="Họ tên"
        prop="p_name"
      />
      <el-table-column
        label="Giới tính"
        prop="gender"
        width="90"
      />
      <el-table-column
        label="Ngày khám"
        prop="appointment_date"
      >
        <template #default="scope">
          {{ formatDate(scope.row.appointment_date) }}
        </template>
      </el-table-column>
      <el-table-column
        label="Số thứ tự"
        prop="queue_number"
        width="100"
      />
      <el-table-column
        label="SĐT"
        prop="phone"
      />
      <el-table-column
        label="Email"
        prop="email"
      />
      <el-table-column
        label="Trạng thái"
        prop="status"
      >
        <template #default="scope">
          <el-tag
            :type="statusType(scope.row.status)"
            disable-transitions
          >
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Đổi lịch"
        min-width="200"
      >
        <template #default="scope">
          <div class="reschedule-content">
            <div
              v-if="
                scope.row.reschedule_status === 'requested' &&
                scope.row.reschedule_requested_by === 'patient'
              "
            >
              <div style="margin-bottom: 8px">
                <el-tag type="warning">Bệnh nhân đề xuất đổi lịch</el-tag>
              </div>
              <div
                class="reschedule-info"
                style="margin-bottom: 8px"
              >
                <strong>Đề xuất:</strong>
                {{ formatDate(scope.row.proposed_appointment_date) }} (số thứ tự sẽ được cấp khi
                bác sĩ chấp nhận)
              </div>
              <div
                v-if="scope.row.reschedule_reason"
                class="reschedule-info"
                style="margin-bottom: 12px"
              >
                <strong>Lý do:</strong> {{ scope.row.reschedule_reason }}
              </div>
            </div>
            <div
              v-else-if="
                scope.row.reschedule_status === 'requested' &&
                scope.row.reschedule_requested_by === 'doctor'
              "
            >
              <el-tag type="warning">Bác sĩ đề xuất - chờ bệnh nhân</el-tag>
            </div>
            <div v-else-if="scope.row.reschedule_status === 'accepted'">
              <el-tag type="success">Đã chấp nhận đổi lịch</el-tag>
            </div>
            <div v-else-if="scope.row.reschedule_status === 'declined'">
              <el-tag type="info">Đã từ chối đổi lịch</el-tag>
            </div>
            <div v-else>
              <span class="no-reschedule">Không có đề xuất</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="Hành động"
        width="280"
      >
        <template #default="scope">
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <el-button
              size="small"
              @click="viewDetail(scope.row)"
              >Xem</el-button
            >
            <el-button
              size="small"
              type="primary"
              @click="openReschedule(scope.row)"
              >Đề xuất đổi lịch</el-button
            >
            <el-button
              v-if="activeTab === 'pending'"
              size="small"
              type="success"
              @click="approve(scope.row.id_appointment)"
              >Phê duyệt</el-button
            >
            <el-button
              v-if="activeTab === 'pending'"
              size="small"
              type="danger"
              @click="reject(scope.row.id_appointment)"
              >Từ chối</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="rescheduleDialogVisible"
      title="Đề xuất đổi lịch"
      width="420px"
    >
      <div style="display:flex; flex-direction:column; gap:12px;">
        <el-date-picker
          v-model="rescheduleForm.proposed_date"
          type="date"
          placeholder="Chọn ngày đề xuất"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          style="width:100%"
        />
        <el-alert
          title="Lưu ý"
          type="info"
          description="Khi bệnh nhân chấp nhận đề xuất, họ sẽ được cấp số thứ tự mới cho ngày đã chọn."
          show-icon
          :closable="false"
        />
        <el-input
          v-model="rescheduleForm.reason"
          type="textarea"
          :rows="3"
          placeholder="Lý do đổi lịch"
        />
      </div>
      <template #footer>
        <el-button @click="rescheduleDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitReschedule">Gửi đề xuất</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      title="Chi tiết lịch khám"
    >
      <el-descriptions
        :column="1"
        border
      >
        <el-descriptions-item label="Họ tên">{{ selectedPatient?.p_name }}</el-descriptions-item>
        <el-descriptions-item label="Giới tính">{{ selectedPatient?.gender }}</el-descriptions-item>
        <el-descriptions-item label="Ngày sinh">{{
          formatDate(selectedPatient?.dob)
        }}</el-descriptions-item>
        <el-descriptions-item label="Ngày/giờ khám">
          {{ formatDate(selectedPatient?.appointment_date) }} {{ selectedPatient?.time_slot }}
        </el-descriptions-item>
        <el-descriptions-item label="SĐT">{{ selectedPatient?.phone }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ selectedPatient?.email }}</el-descriptions-item>
        <el-descriptions-item label="Lý do khám">{{
          selectedPatient?.reason
        }}</el-descriptions-item>
        <el-descriptions-item label="Địa chỉ">
          {{ selectedPatient?.to_thon }}, {{ selectedPatient?.xa }}, {{ selectedPatient?.quan }},
          {{ selectedPatient?.tinh }}
        </el-descriptions-item>
        <el-descriptions-item label="Bác sĩ">{{
          selectedPatient?.dr_name
        }}</el-descriptions-item>
        <el-descriptions-item label="Chuyên khoa">{{
          selectedPatient?.specialty
        }}</el-descriptions-item>
        <el-descriptions-item label="Bệnh viện">{{ selectedPatient?.dr_h_name }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">Đóng</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="Tạo lịch khám" width="640px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="140px">
        <el-form-item label="Bệnh viện">
          <el-select v-model="selectedHospital" placeholder="Chọn bệnh viện" filterable clearable style="width:100%" @change="onDoctorFiltersChange">
            <el-option v-for="h in hospitalOptions" :key="h.value" :label="h.label" :value="h.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="Chuyên khoa">
          <el-select v-model="selectedSpecialty" placeholder="Chọn chuyên khoa" filterable clearable style="width:100%" @change="onDoctorFiltersChange">
            <el-option v-for="s in specialtyOptions" :key="s.value" :label="s.label" :value="s.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="Bác sĩ" required>
          <el-select
            v-model="createForm.dr_id"
            placeholder="Tìm và chọn bác sĩ"
            filterable
            remote
            reserve-keyword
            clearable
            :remote-method="searchDoctors"
            :loading="doctorsLoading"
            style="width:100%"
            @change="onCreateDoctorOrDateChange"
          >
            <el-option
              v-for="d in doctors"
              :key="d.dr_id"
              :label="formatDoctorOption(d)"
              :value="d.dr_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngày khám" required>
          <el-date-picker v-model="createForm.appointment_date" type="date" placeholder="Chọn ngày" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width:100%" :disabled-date="disablePastDate"/>
        </el-form-item>
        <el-alert
          title="Lưu ý"
          type="info"
          description="Hệ thống sẽ tự động cấp số thứ tự cho bệnh nhân khi tạo lịch."
          show-icon
          :closable="false"
        />

        <el-divider>Thông tin bệnh nhân</el-divider>
        <el-form-item label="Họ tên" required>
          <el-input v-model="createForm.p_name" placeholder="Nhập họ tên"/>
        </el-form-item>
        <el-form-item label="Giới tính">
          <el-select v-model="createForm.gender" placeholder="Chọn giới tính" style="width:100%">
            <el-option label="Nam" value="Nam"/>
            <el-option label="Nữ" value="Nữ"/>
            <el-option label="Khác" value="Khác"/>
          </el-select>
        </el-form-item>
        <el-form-item label="SĐT">
          <el-input v-model="createForm.phone" placeholder="Số điện thoại"/>
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="createForm.email" placeholder="Email"/>
        </el-form-item>
        <el-form-item label="Ngày sinh">
          <el-date-picker v-model="createForm.dob" type="date" placeholder="Chọn ngày sinh" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width:100%"/>
        </el-form-item>
        <el-form-item label="Lý do khám">
          <el-input v-model="createForm.reason" type="textarea" :rows="2" placeholder="Lý do khám"/>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="submitCreate">Tạo lịch</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useDoctorSearch } from '../utils/useDoctorSearch';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

const formatDate = (isoDateStr) => {
  return dayjs(isoDateStr).add(7, 'hour').format('DD/MM/YYYY');
};

const route = useRoute();
const router = useRouter();
const appointments = ref([]);

// Create appointment dialog state
const createDialogVisible = ref(false);
const createSubmitting = ref(false);
const {
  doctors, doctorsLoading,
  hospitalOptions, specialtyOptions,
  selectedHospital, selectedSpecialty,
  formatDoctorOption,
  loadHospitals, loadSpecialties,
  searchDoctors, onDoctorFiltersChange,
  ensureDoctorsLoaded,
} = useDoctorSearch();
const availableSlots = ref([]);
const createSlotsLoading = ref(false);
// Cache trạng thái ngày có slot hay không cho bác sĩ đã chọn
const availableDateStatus = ref(new Map());
const createFormRef = ref();
const createForm = ref({
  dr_id: null,
  appointment_date: '',
  p_name: '',
  gender: '',
  phone: '',
  email: '',
  dob: '',
  reason: ''
});
const selectedPatient = ref(null);
const dialogVisible = ref(false);
const page = ref(1);
const limit = 10;
const totalItems = ref(0);
const filterDate = ref(null);

// Reschedule dialog state
const rescheduleDialogVisible = ref(false);
const rescheduleForm = ref({
  proposed_date: '',
  reason: ''
});
let currentRescheduleId = null;

const activeTab = ref(route.params.status || 'pending');
const fetchAppointments = async () => {
  appointments.value = [];
  try {
    const params = {
      page: page.value,
      limit,
      status: activeTab.value
    };

    if (filterDate.value) {
      params.appointment_date = filterDate.value;
    }

    const res = await axios.get('http://localhost:3000/api/patients', { params });
    appointments.value = res.data;
    totalItems.value = res.data.length;
  } catch (err) {
    ElMessage.error('Lỗi khi tải dữ liệu');
  }
};

// 🟩 Đặt watch SAU khi đã khai báo fetchAppointments
watch(
  () => [route.params.status, route.query.date],
  async ([newStatus, newDate]) => {
    activeTab.value = newStatus;
    page.value = 1;
    filterDate.value = newDate || null;
    await fetchAppointments();
  },
  { immediate: true }
);

watch(
  () => [route.params.status, route.query.date],
  async ([newStatus, newDate]) => {
    activeTab.value = newStatus;
    page.value = 1;
    filterDate.value = newDate || null;
    await fetchAppointments();
  },
  { immediate: true }
);

const goToTab = (status) => {
  if (status !== activeTab.value) {
    router.push({
      path: `/admin/appointments/${status}`,
      query: {
        date: filterDate.value || undefined
      }
    });
  }
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  fetchAppointments();
};

const handleDateChange = () => {
  page.value = 1;
  router.push({
    path: `/admin/appointments/${activeTab.value}`,
    query: {
      date: filterDate.value
    }
  });
};

const clearDateFilter = () => {
  filterDate.value = null;
  fetchAppointments();
};

const viewDetail = (patient) => {
  selectedPatient.value = patient;
  dialogVisible.value = true;
};

const openReschedule = (row) => {
  currentRescheduleId = row.id_appointment;
  rescheduleForm.value = {
    proposed_date: '',
    start_time: '',
    end_time: '',
    reason: ''
  };
  rescheduleDialogVisible.value = true;
};

const submitReschedule = async () => {
  if (!currentRescheduleId || !rescheduleForm.value.proposed_date) {
    ElMessage.error('Vui lòng chọn ngày đề xuất');
    return;
  }
  try {
    await axios.post(`http://localhost:3000/api/patients/${currentRescheduleId}/reschedule`, {
      proposed_date: rescheduleForm.value.proposed_date,
      reason: rescheduleForm.value.reason
    });
    ElMessage.success('Đã gửi đề xuất đổi lịch tới bệnh nhân');
    rescheduleDialogVisible.value = false;
    fetchAppointments();
  } catch (err) {
    ElMessage.error('Không thể gửi đề xuất');
  }
};

const updateStatus = async (id, status) => {
  try {
    await axios.patch(`http://localhost:3000/api/patients/status/${id}`, {
      status: status
    });
    ElMessage.success(`Cập nhật trạng thái thành công`);
    await fetchAppointments();
  } catch (err) {
    ElMessage.error('Lỗi khi cập nhật trạng thái');
  }
};

// Gọi updateStatus để xử lý
const approve = (id) => updateStatus(id, 'approved');

const reject = async (id) => {
  try {
    await ElMessageBox.confirm('Bạn có chắc chắn muốn từ chối?', 'Xác nhận', {
      type: 'warning'
    });
    await updateStatus(id, 'rejected');
  } catch (err) {
    ElMessage.error('Đã hủy thao tác');
  }
};

const statusLabel = (s) =>
  s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Đã từ chối';

const statusType = (s) => (s === 'pending' ? 'warning' : s === 'approved' ? 'success' : 'danger');

const openCreateDialog = async () => {
  await ensureDoctorsLoaded();
  resetCreateForm();
  createDialogVisible.value = true;
};

const resetCreateForm = () => {
  createForm.value = {
    dr_id: null,
    appointment_date: '',
    p_name: '',
    gender: '',
    phone: '',
    email: '',
    dob: '',
    reason: ''
  };
};

const onCreateDoctorOrDateChange = async () => {
  availableSlots.value = [];
  if (!createForm.value.dr_id || !createForm.value.appointment_date) return;
  try {
    createSlotsLoading.value = true;
    const drId = createForm.value.dr_id;
    const date = createForm.value.appointment_date;
    const [schedRes, bookedRes] = await Promise.all([
      axios.get(`http://localhost:3000/api/doctors/${drId}/schedules/date/${date}`),
      axios.get(`http://localhost:3000/api/patients/booked/${drId}/${date}`)
    ]);
    const allSlots = (schedRes.data?.schedules || schedRes.data || []).map(s => typeof s === 'string' ? s : s.time_slot);
    const booked = (bookedRes.data || []).map(r => r.time_slot || r);
    availableSlots.value = allSlots.filter(s => !booked.includes(s));

    // Đánh dấu ngày có slot hay không
    const key = `${drId}|${date}`;
    availableDateStatus.value.set(key, availableSlots.value.length > 0);
  } catch (err) {
    ElMessage.error('Không thể tải khung giờ');
  } finally {
    createSlotsLoading.value = false;
  }
};

const createRules = {
  dr_id: [{ required: true, message: 'Vui lòng chọn bác sĩ', trigger: 'change' }],
  appointment_date: [{ required: true, message: 'Vui lòng chọn ngày khám', trigger: 'change' }],
  p_name: [
    { required: true, message: 'Vui lòng nhập họ tên bệnh nhân', trigger: 'blur' },
    { min: 2, message: 'Họ tên quá ngắn', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^\d{9,11}$/, message: 'SĐT không hợp lệ', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
  ]
};

const submitCreate = async () => {
  if (!createForm.value.dr_id || !createForm.value.appointment_date || !createForm.value.p_name) {
    ElMessage.error('Vui lòng nhập đủ: Bác sĩ, Ngày, Họ tên');
    return;
  }
  try {
    await createFormRef.value?.validate();
    createSubmitting.value = true;
    const payload = {
      dr_id: createForm.value.dr_id,
      p_name: createForm.value.p_name,
      gender: createForm.value.gender || null,
      phone: createForm.value.phone || null,
      email: createForm.value.email || null,
      dob: createForm.value.dob || null,
      tinh: null, quan: null, xa: null, to: null,
      reason: createForm.value.reason || null,
      appointment_date: createForm.value.appointment_date
    };
    await axios.post('http://localhost:3000/api/patients', payload);
    ElMessage.success('Tạo lịch thành công');
    createDialogVisible.value = false;
    await fetchAppointments();
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Không thể tạo lịch');
  } finally {
    createSubmitting.value = false;
  }
};

onMounted(fetchAppointments);

// Disable past dates for creating appointment
const disablePastDate = (date) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(date);
  d.setHours(0,0,0,0);
  // Disable if before today
  if (d < today) return true;
  // Nếu đã chọn bác sĩ, disable ngày không có slot (sau khi fetch)
  const drId = createForm.value.dr_id;
  if (drId) {
    const key = `${drId}|${d.toISOString().slice(0,10)}`;
    const hasSlots = availableDateStatus.value.get(key);
    if (hasSlots === false) return true; // đã biết không có slot => disable
  }
  return false;
};
</script>

<style scoped>
.admin-appointments {
  padding: 24px;
  max-width: 1100px;
  margin: auto;
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

/* Reschedule column styling */
.reschedule-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.reschedule-info {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.no-reschedule {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}
</style>
