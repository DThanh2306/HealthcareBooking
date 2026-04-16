<template>
  <div class="admin-page">
    <div class="hero">
      <div class="hero-content">
        <h1>Quản lý bệnh viện</h1>
        <p>Tạo, chỉnh sửa và quản lý danh sách bệnh viện/clinics.</p>
      </div>
    </div>

    <div class="header-row">
      <div class="actions" style="margin-left: 4px; width: 100%; justify-content: space-between;">
        <input v-model="searchQuery" class="search" type="text" placeholder="Tìm bệnh viện theo tên..." />
        <button class="add-btn" @click="goToEditForm">
          <span class="icon">＋</span> Thêm mới
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="list-header">
        <span>Danh sách bệnh viện</span>
        <span class="muted">Tổng: {{ filteredHospitals.length }}</span>
      </div>

      <table class="hospital-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên bệnh viện</th>
            <th>Số điện thoại</th>
            <th>Logo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in pagedHospitals" :key="h.h_id">
            <td>{{ h.h_id }}</td>
            <td>{{ h.h_name }}</td>
            <td>{{ h.h_phone || '—' }}</td>
            <td>
              <img
                :src="h.logo"
                alt="logo"
                height="32"
                style="background: #eee; border-radius: 5px"
              />
            </td>
            <td class="act-group">
              <button
                class="i-btn"
                title="Info"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    fill="none"
                    stroke="#437ef7"
                    stroke-width="2"
                  />
                  <text
                    x="8"
                    y="12"
                    fill="#437ef7"
                    text-anchor="middle"
                    font-size="10"
                    font-family="Arial"
                    font-weight="bold"
                  >
                    i
                  </text>
                </svg>
              </button>
              <button
                class="i-btn"
                title="Edit"
                @click="goToEditHospital(h.h_id)"
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
                class="i-btn "
                title="Delete"
                @click="deleteHospital(h.h_id)"
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

      <div class="pagination">
        <button class="p-btn" :disabled="page === 1" @click="page = page - 1">Trước</button>
        <span>Trang {{ page }} / {{ totalPages }}</span>
        <button class="p-btn" :disabled="page === totalPages" @click="page = page + 1">Sau</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from '../axios';

const hospitals = ref([]);
const form = ref({ h_name: '', logo: '' });
const searchQuery = ref('');

import { useRouter } from 'vue-router';

const router = useRouter();

const fetchHospitals = async () => {
  const res = await axios.get('/hospitals');
  hospitals.value = res.data;
};

const deleteHospital = async (id) => {
  if (confirm('Delete this clinic?')) {
    await axios.delete(`/hospitals/${id}`);
    fetchHospitals();
  }
};

function goToEditForm() {
  router.push({ name: 'editform', params: { id: 'new' } }); // ➜ Thêm mới
}

function goToEditHospital(id) {
  router.push({ name: 'editform', params: { id } }); // ➜ Sửa
}

onMounted(fetchHospitals);

const filteredHospitals = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return hospitals.value.filter(h => !q || (h.h_name || '').toLowerCase().includes(q));
});

const page = ref(1);
const pageSize = 10;
const totalPages = computed(() => Math.max(1, Math.ceil(filteredHospitals.value.length / pageSize)));
const pagedHospitals = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredHospitals.value.slice(start, start + pageSize);
});

watch([searchQuery, hospitals], () => { page.value = 1; });
</script>

<style scoped>
body {
  background: #f5f6fa;
}
.admin-page {
  padding: 32px;
  background: #f5f6fa;
  min-height: 100vh;
}
.hero { background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);; border-radius: 16px; color: #fff; padding: 28px 24px; margin: 12px 0 20px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); }
.hero-content h1 { margin: 0 0 6px 0; font-size: 1.8rem; font-weight: 700; }
.hero-content p { margin: 0; opacity: 0.95; }
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
h2 { margin: 0; font-size: 2rem; font-weight: 700; color: #000000; }
.title-wrap .sub { color: #6b7280; margin-top: 4px; font-size: .95rem; }
.actions { display: flex; align-items: center; gap: 12px; }
.search { height: 36px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 12px; min-width: 260px; background: #f3f6fb; color: #111827;}
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
.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0px 2px 16px 0px #e4eaee;
  padding: 0 0 30px 0;
  margin: 0 auto;
  max-width: 1250px;
}
.list-header { display:flex; justify-content:space-between; align-items:center; color:#111827; font-weight:600; font-size:1.1rem; padding:18px 24px 14px 24px; border-radius:12px 12px 0 0; background:#f9fafb; border-bottom:1px solid #eef2ff; }
.list-header .muted { color:#6b7280; font-weight:500; }
.form {
  display: flex;
  gap: 10px;
  margin: 20px 24px 8px 24px;
}
.form input {
  flex: 1 1 150px;
  padding: 8px 12px;
  border-radius: 5px;
  border: 1px solid #d7def0;
  font-size: 1rem;
}
.form button {
  padding: 7px 16px;
  border: none;
  border-radius: 5px;
  background: #437ef7;
  color: #fff;
  font-weight: 600;
  margin-right: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.form button[type='button'] {
  background: #eee;
  color: #666;
}
.hospital-table {
  margin: 0 24px;
  width: calc(100% - 48px);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px #f8fafb;
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}
.hospital-table thead th {
  background: #f5f7fa;
  color: #4b5563;
  font-weight: 600;
  font-size: 15px;
  border: 0;
  padding: 12px 11px;
  text-align: left;
}
.hospital-table tbody td {
  border-top: 1px solid #edf1f9;
  font-size: 15px;
  color: #374151;
  padding: 13px 10px;
  vertical-align: middle;
  background: #fff;
}
.hospital-table tr:last-child td {
  border-bottom: none;
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
.hospital-table img {
  height: 32px;
  width: auto;
  border-radius: 4px;
  background: #eee;
}
.pagination { display:flex; align-items:center; gap:12px; justify-content:flex-end; padding: 14px 24px 0 24px; }
.p-btn { background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; border-radius:6px; padding:6px 10px; cursor:pointer; }
.p-btn:disabled { opacity:.6; cursor:not-allowed; }
</style>
