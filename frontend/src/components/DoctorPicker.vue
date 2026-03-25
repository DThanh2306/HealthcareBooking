<template>
  <div class="doctor-picker" :class="{ inline }">
    <el-form-item :label="labels.hospital">
      <el-select
        v-model="localHospital"
        placeholder="Chọn bệnh viện"
        filterable
        clearable
        style="width:100%"
        @change="handleHospitalChange"
      >
        <el-option v-for="h in hospitalOptions" :key="h.value" :label="h.label" :value="h.value" />
      </el-select>
    </el-form-item>

    <el-form-item :label="labels.specialty">
      <el-select
        v-model="localSpecialty"
        placeholder="Chọn chuyên khoa"
        :disabled="!localHospital"
        filterable
        clearable
        style="width:100%"
        @change="handleSpecialtyChange"
      >
        <el-option v-for="s in displayedSpecialties" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
    </el-form-item>

    <el-form-item :label="labels.doctor" :required="required">
      <el-select
        v-model="localDoctorId"
        :placeholder="placeholders.doctor"
        filterable
        remote
        reserve-keyword
        clearable
        :remote-method="(q) => searchDoctors(q, limit)"
        :loading="doctorsLoading"
        style="width:100%"
        @change="emitDoctorChanged"
      >
        <el-option v-for="d in displayedDoctors" :key="d.dr_id" :label="formatDoctorOption(d)" :value="d.dr_id" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useDoctorSearch } from '../utils/useDoctorSearch';
import axios from '../axios';

const props = defineProps({
  modelValue: { type: [Number, String, null], default: null }, // doctor id
  hospital: { type: [String, null], default: null },
  specialty: { type: [Number, String, null], default: null },
  currentUserId: { type: [Number, String, null], default: null },
  limit: { type: Number, default: 20 },
  inline: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  labels: {
    type: Object,
    default: () => ({ hospital: 'Bệnh viện', specialty: 'Chuyên khoa', doctor: 'Bác sĩ' })
  },
  placeholders: {
    type: Object,
    default: () => ({ doctor: 'Tìm và chọn bác sĩ' })
  }
});

const emit = defineEmits(['update:modelValue', 'update:hospital', 'update:specialty', 'change']);

const {
  doctors, doctorsLoading,
  hospitalOptions, specialtyOptions,
  selectedHospital, selectedSpecialty,
  formatDoctorOption,
  searchDoctors, onDoctorFiltersChange,
  ensureDoctorsLoaded,
  fetchDoctorsNow,
} = useDoctorSearch();

const displayedSpecialties = computed(() => {
  if (!localHospital.value) return [];
  // specialtyOptions được tạo lại khi chọn bệnh viện trong onDoctorFiltersChange
  return specialtyOptions.value;
});

const displayedDoctors = computed(() => {
  // Ẩn các bác sĩ đã liên kết với user khác (d.id_u khác currentUserId)
  return doctors.value.filter(d => !d.id_u || String(d.id_u) === String(props.currentUserId || ''));
});

const localDoctorId = ref(props.modelValue);
const localHospital = ref(props.hospital);
const localSpecialty = ref(props.specialty);

watch(() => props.modelValue, async (v) => { 
  localDoctorId.value = v; 
  if (v) await ensureSelectedDoctorLoaded();
});
watch(() => props.hospital, (v) => { localHospital.value = v; syncToComposable(); });
watch(() => props.specialty, (v) => { localSpecialty.value = v; syncToComposable(); });

const syncToComposable = () => {
  selectedHospital.value = localHospital.value || null;
  selectedSpecialty.value = localSpecialty.value || null;
};

const handleHospitalChange = async () => {
  emit('update:hospital', localHospital.value || null);
  // reset specialty when hospital changes
  localSpecialty.value = null;
  emit('update:specialty', null);
  selectedHospital.value = localHospital.value || null;
  selectedSpecialty.value = null;
  await onDoctorFiltersChange();
};

const handleSpecialtyChange = async () => {
  emit('update:specialty', localSpecialty.value || null);
  selectedSpecialty.value = localSpecialty.value || null;
  await onDoctorFiltersChange();
};

const emitDoctorChanged = () => {
  emit('update:modelValue', localDoctorId.value || null);
  emit('change', localDoctorId.value || null);
};

const ensureSelectedDoctorLoaded = async () => {
  if (!localDoctorId.value) return;
  // nếu danh sách hiện tại chưa có bác sĩ được chọn, cố gắng nạp theo id
  const exists = doctors.value.some(d => d.dr_id == localDoctorId.value);
  if (!exists) {
    try {
      const res = await axios.get(`/doctors/${encodeURIComponent(localDoctorId.value)}`);
      const d = Array.isArray(res.data) ? res.data[0] : res.data;
      if (d) {
        // nếu thiếu filter thì đồng bộ từ bác sĩ
        if (!localHospital.value && d.dr_h_name) {
          localHospital.value = d.dr_h_name;
          selectedHospital.value = d.dr_h_name;
        }
        if (!localSpecialty.value && d.sp_id) {
          localSpecialty.value = d.sp_id;
          selectedSpecialty.value = d.sp_id;
        }
        // cập nhật specialties theo bệnh viện
        await onDoctorFiltersChange();
        // thêm bác sĩ đó vào danh sách nếu chưa có
        doctors.value = [d, ...doctors.value];
      }
    } catch (e) {
      // Nếu API /doctors/:id không khả dụng, fallback bằng fetch rộng
      const initialLimit = Math.max(props.limit, 1000);
      await fetchDoctorsNow('', initialLimit);
    }
  }
};

onMounted(async () => {
  // init data
  await ensureDoctorsLoaded();
  // seed initial filters from props
  syncToComposable();
  // build specialties from hospital filter
  await onDoctorFiltersChange();
  // ensure current doctor (if any) is included by expanding limit
  const initialLimit = localDoctorId.value ? Math.max(props.limit, 500) : props.limit;
  await fetchDoctorsNow('', initialLimit);
  // ensure selected doctor present and filters synced
  await ensureSelectedDoctorLoaded();
});

// expose methods for parent to trigger manual loading
defineExpose({ searchDoctors, ensureSelectedDoctorLoaded });
</script>

<style scoped>
.doctor-picker.inline { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
</style>
