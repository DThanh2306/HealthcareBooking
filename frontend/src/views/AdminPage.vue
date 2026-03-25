<template>
  <div class="admin-page">
    <div class="header-row">
      <h2>Manage Clinics</h2>
      <button class="add-btn" @click="goToEditForm">
        <span class="icon">＋</span> Add new
      </button>
    </div>

    <div class="content-card">
      <div class="list-header">List of clinics</div>

      <table class="hospital-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Logo</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in hospitals" :key="h.h_id">
            <td>{{ h.h_id }}</td>
            <td>{{ h.h_name }}</td>
            <td>
              <img
                :src="h.logo"
                alt="logo"
                height="32"
                style="background: #eee; border-radius: 5px"
              />
            </td>
            <td class="act-group">
              <button class="i-btn" title="Info">
                <svg viewBox="0 0 16 16" width="18">
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
                <svg viewBox="0 0 16 16" width="18">
                  <rect x="3" y="10" width="8" height="2" fill="#437ef7" />
                  <rect x="6" y="7" width="2" height="5" fill="#437ef7" />
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
                @click="deleteHospital(h.h_id)"
              >
                <svg viewBox="0 0 16 16" width="18">
                  <rect
                    x="5"
                    y="5"
                    width="6"
                    height="8"
                    fill="none"
                    stroke="#437ef7"
                    stroke-width="2"
                  />
                  <rect x="3" y="3" width="10" height="2" fill="#437ef7" />
                  <rect x="7" y="7" width="2" height="4" fill="#437ef7" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const hospitals = ref([]);
const form = ref({ h_name: "", logo: "" });

import { useRouter } from "vue-router";

const router = useRouter();

const fetchHospitals = async () => {
  const res = await axios.get("http://localhost:3000/api/hospitals");
  hospitals.value = res.data;
};
const onSubmit = async () => {
  if (isEdit.value) {
    await axios.put(
      `http://localhost:3000/api/hospitals/${editId.value}`,
      form.value,
    );
  } else {
    await axios.post("http://localhost:3000/api/hospitals", form.value);
  }
  closeForm();
  fetchHospitals();
};

const deleteHospital = async (id) => {
  if (confirm("Delete this clinic?")) {
    await axios.delete(`http://localhost:3000/api/hospitals/${id}`);
    fetchHospitals();
  }
};

function goToEditForm() {
  router.push({ name: "editform", params: { id: "new" } }); // ➜ Thêm mới
}

function goToEditHospital(id) {
  router.push({ name: "editform", params: { id } }); // ➜ Sửa
}

onMounted(fetchHospitals);
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
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
}
h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 400;
  color: #55596c;
}
.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #437ef7;
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
  background: #295dc1;
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
.list-header {
  color: #437ef7;
  font-weight: 500;
  font-size: 1.16rem;
  padding: 18px 24px 14px 24px;
  border-radius: 12px 12px 0 0;
  background: transparent;
}
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
.form button[type="button"] {
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
  color: #767681;
  font-weight: bold;
  font-size: 17px;
  border: 0;
  padding: 12px 11px;
  text-align: left;
}
.hospital-table tbody td {
  border-top: 1px solid #edf1f9;
  font-size: 16px;
  color: #545972;
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
</style>
