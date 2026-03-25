import { ref } from 'vue';
import axios from '../axios';

export function useDoctorSearch() {
  const doctors = ref([]);
  const doctorsLoading = ref(false);
  const hospitalOptions = ref([]);
  const specialtyOptions = ref([]);
  const selectedHospital = ref(null);
  const selectedSpecialty = ref(null);

  const formatDoctorOption = (d) => `${d.dr_name} - ${d.dr_h_name || ''}`;

  const loadHospitals = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/hospitals');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      hospitalOptions.value = data.map(h => ({ value: h.h_name, label: h.h_name }));
    } catch {
      hospitalOptions.value = [];
    }
  };

  const loadSpecialties = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/specialties');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      specialtyOptions.value = data.map(s => ({ value: s.sp_id, label: s.sp_name }));
    } catch {
      specialtyOptions.value = [];
    }
  };

  const specialtiesFromDoctors = (list) => {
    const map = new Map();
    list.forEach(d => {
      if (d.sp_id && d.specialty) {
        map.set(d.sp_id, d.specialty);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  };

  let doctorSearchDebounce;
  const searchDoctors = async (query, limit = 20) => {
    if (doctorSearchDebounce) clearTimeout(doctorSearchDebounce);
    doctorSearchDebounce = setTimeout(async () => {
      await fetchDoctorsNow(query, limit);
    }, 300);
  };

  const fetchDoctorsNow = async (query, limit = 20) => {
    try {
      doctorsLoading.value = true;
      const params = { limit, page: 1 };
      if (query && query.trim()) params.search = query.trim();
      const res = await axios.get('http://localhost:3000/api/doctors', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const filtered = data.filter(d => {
        const bySp = !selectedSpecialty.value || d.sp_id === selectedSpecialty.value;
        const byHospital = !selectedHospital.value || (d.dr_h_name || '').toLowerCase() === String(selectedHospital.value).toLowerCase();
        return bySp && byHospital;
      });
      doctors.value = filtered;
    } catch {
      doctors.value = [];
    } finally {
      doctorsLoading.value = false;
    }
  };

  const onDoctorFiltersChange = async () => {
    const BIG_LIMIT = 200;
    await fetchDoctorsNow('', BIG_LIMIT);
    if (selectedHospital.value) {
      specialtyOptions.value = specialtiesFromDoctors(doctors.value);
      if (selectedSpecialty.value && !specialtyOptions.value.some(x => x.value === selectedSpecialty.value)) {
        selectedSpecialty.value = null;
        await fetchDoctorsNow('', BIG_LIMIT);
      }
    }
  };

  const ensureDoctorsLoaded = async () => {
    await Promise.all([loadHospitals(), loadSpecialties()]);
    await fetchDoctorsNow('');
  };

  return {
    // state
    doctors, doctorsLoading,
    hospitalOptions, specialtyOptions,
    selectedHospital, selectedSpecialty,
    // methods
    formatDoctorOption,
    loadHospitals, loadSpecialties,
    searchDoctors, onDoctorFiltersChange,
    ensureDoctorsLoaded,
    fetchDoctorsNow,
  };
}
