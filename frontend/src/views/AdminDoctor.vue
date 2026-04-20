<template>
  <div class="admin-page">
    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý bác sĩ</h1>
        <p>Tạo, chỉnh sửa và quản lý danh sách bác sĩ.</p>
      </div>
    </div>

    <div class="header-row">
      <div
        class="actions"
        style="margin-left: 4px; width: 100%; justify-content: space-between"
      >
        <div class="filters">
          <input
            v-model="searchQuery"
            class="search"
            type="text"
            placeholder="Tìm bác sĩ theo tên/chuyên khoa..."
          />
          <select
            v-model="selectedHospital"
            class="select"
          >
            <option value="">Tất cả bệnh viện</option>
            <option
              v-for="h in hospitals"
              :key="h.h_id"
              :value="String(h.h_id)"
            >
              {{ h.h_name }}
            </option>
          </select>
        </div>
        <button
          class="add-btn"
          @click="goToEditForm('new')"
        >
          <span class="icon">＋</span> Thêm mới
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="list-header">
        <span>Danh sách bác sĩ</span>
        <span class="muted">Tổng: {{ totalCount }}</span>
      </div>

      <table class="doctor-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên bác sĩ</th>
            <th>Chuyên khoa</th>
            <th>Bệnh viện công tác</th>
            <th>Giá khám</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="d in filteredDoctors"
            :key="d.dr_id"
          >
            <td>{{ d.dr_id }}</td>
            <td>{{ d.dr_name }}</td>
            <td>{{ d.specialty }}</td>
            <td>{{ d.dr_h_name || hospitalName(d.h_id) || '—' }}</td>
            <td>{{ formatVND(priceToNumber(d.dr_price)) }}</td>
            <td>
              <img
                :src="d.image"
                alt="doctor"
              />
            </td>
            <td class="act-group">
              <button
                class="i-btn"
                title="Edit"
                @click="goToEditForm(d.dr_id)"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                >
                  <rect
                    x="3"
                    y="10"
                    width="8"
                    height="2"
                    fill="#437ef7"
                  />
                  <rect
                    x="6"
                    y="7"
                    width="2"
                    height="5"
                    fill="#437ef7"
                  />
                  <rect
                    transform="rotate(45,8,8)"
                    x="7"
                    y="3"
                    width="2"
                    height="8"
                    fill="#437ef7"
                  />
                </svg>
              </button>
              <button
                class="i-btn"
                title="Delete"
                @click="deleteDoctor(d.dr_id)"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                >
                  <rect
                    x="5"
                    y="5"
                    width="6"
                    height="8"
                    fill="none"
                    stroke="#dc2626"
                    stroke-width="2"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="10"
                    height="2"
                    fill="#dc2626"
                  />
                  <rect
                    x="7"
                    y="7"
                    width="2"
                    height="4"
                    fill="#dc2626"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="pg-btn" :disabled="currentPage === 1" @click="fetchDoctors(currentPage - 1)">Trước</button>
          <span class="pg-info">Trang {{ currentPage }} / {{ totalPages }}</span>
          <button class="pg-btn" :disabled="currentPage === totalPages" @click="fetchDoctors(currentPage + 1)">Sau</button>
        </div>
      </div>
    </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from '../axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const doctors = ref([]);
const hospitals = ref([]);
const searchQuery = ref('');
const selectedHospital = ref('');

// Pagination state
const totalPages = ref(1);
const currentPage = ref(1);
const totalCount = ref(0);
const loading = ref(false);

const fetchDoctors = async (page = 1) => {
  try {
    loading.value = true;
    // Build URL with server-side pagination (10 per page)
    let url = `/doctors?page=${page}&limit=10`;

    // Search
    const q = searchQuery.value.trim();
    if (q) url += `&search=${encodeURIComponent(q)}`;

    // Hospital filter: backend expects hospital name; convert from selected id
    if (selectedHospital.value) {
      const h = hospitals.value.find(h => String(h.h_id) === String(selectedHospital.value));
      if (h?.h_name) url += `&hospital=${encodeURIComponent(h.h_name)}`;
    }

    const res = await axios.get(url);
    doctors.value = res.data?.data || [];
    totalPages.value = res.data?.totalPages || 1;
    currentPage.value = res.data?.currentPage || page;
    totalCount.value = res.data?.total || doctors.value.length;
  } catch (e) {
    console.error('Fetch doctors failed', e);
    doctors.value = [];
    totalPages.value = 1;
    currentPage.value = 1;
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchHospitals = async () => {
  const res = await axios.get('/hospitals');
  hospitals.value = res.data || [];
};

const deleteDoctor = async (dr_id) => {
  if (confirm('Delete this doctor?')) {
    await axios.delete(`/doctors/${dr_id}`);
    fetchDoctors();
  }
};

const goToEditForm = (dr_id) => {
  router.push({ name: 'editdoctor', params: { dr_id } });
};

// Server provides filtered + paginated list; expose directly for template
const filteredDoctors = computed(() => doctors.value);

const hospitalName = (h_id) => {
  const h = hospitals.value.find((x) => String(x.h_id) === String(h_id));
  return h?.h_name;
};

const formatVND = (n) =>
  Number(n || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  });

const priceToNumber = (s) => {
  if (!s) return 0;
  const str = String(s).trim();
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
};

onMounted(async () => {
  await fetchHospitals();
  await fetchDoctors(1);
});
</script>

<style scoped>
.admin-page {
  padding: 32px;
  background: #f5f6fa;
  min-height: 100vh;
}
.hero {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 16px;
  color: #fff;
  padding: 28px 24px;
  margin: 12px 0 20px;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
}
.hero-content h1 {
  margin: 0 0 6px 0;
  font-size: 1.8rem;
  font-weight: 700;
}
.hero-content p {
  margin: 0;
  opacity: 0.95;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
}
.title-wrap .sub {
  color: #6b7280;
  margin-top: 4px;
  font-size: 0.95rem;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filters {
  display: flex;
  gap: 10px;
}
.search {
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 12px;
  min-width: 220px;
  background: #fff;
  color: #111827;
}
.select {
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #111827;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  outline: none;
  border-radius: 6px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px 0 #437ef732;
  transition: background 0.2s;
  cursor: pointer;
}
.add-btn:hover {
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
}
.add-btn .icon {
  font-size: 18px;
}
.pagination { display: flex; gap: 12px; align-items: center; justify-content: flex-end; padding: 14px 24px; }
.pg-btn { color: #4b5563; padding: 8px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; cursor: pointer; }
.pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pg-info { color: #000000; }

.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0px 2px 16px 0px #e4eaee;
  padding: 0 0 30px 0;
  margin: 0 auto;
  max-width: 1250px;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #111827;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 18px 24px 14px 24px;
  border-radius: 12px 12px 0 0;
  background: #f9fafb;
  border-bottom: 1px solid #eef2ff;
}
.list-header .muted {
  color: #6b7280;
  font-weight: 500;
}
.doctor-table {
  margin: 0 24px;
  width: calc(100% - 48px);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px #f8fafb;
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}
.doctor-table thead th {
  background: #f5f7fa;
  color: #4b5563;
  font-weight: 600;
  font-size: 15px;
  border: 0;
  padding: 12px 11px;
  text-align: left;
}
.doctor-table tbody td {
  border-top: 1px solid #edf1f9;
  font-size: 15px;
  color: #374151;
  padding: 13px 10px;
  vertical-align: middle;
  background: #fff;
}
.doctor-table tr:last-child td {
  border-bottom: none;
}
.doctor-table img {
  height: 32px;
  width: auto;
  border-radius: 4px;
  background: #eee;
}
.act-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.i-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  display: inline-block;
}
.i-btn svg,
.i-btn img {
  vertical-align: middle;
}
</style>
