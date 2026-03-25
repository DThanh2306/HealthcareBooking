<template>
  <div class="form-bg">
    <h1 class="title">
      {{ isEdit ? 'Cập nhật thông tin bệnh viện' : 'Thêm bệnh viện mới' }}
    </h1>
    <form
      class="form-card"
      @submit.prevent="onSubmit"
    >
      <div class="row">
        <div class="field">
          <label>Tên bệnh viện</label>
          <input
            type="text"
            placeholder="Clinic name"
            v-model="form.h_name"
          />
        </div>
        <div class="field">
          <label>Số điện thoại</label>
          <input
            type="text"
            placeholder="Phone number"
            v-model="form.h_phone"
          />
        </div>
      </div>

      <div class="field">
        <label>Địa chỉ</label>
        <input
          type="text"
          placeholder="Address"
          v-model="form.h_address"
        />
      </div>

      <div class="row">
        <div class="field">
          <label>Vĩ độ (h_lat)</label>
          <input
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            placeholder="Latitude (-90..90)"
            v-model.number="form.h_lat"
          />
        </div>
        <div class="field">
          <label>Kinh độ (h_lng)</label>
          <input
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            placeholder="Longitude (-180..180)"
            v-model.number="form.h_lng"
          />
        </div>
      </div>

      <div class="field">
        <label>Mô tả bệnh viện</label>
        <textarea
          rows="7"
          v-model="form.h_description"
          placeholder="Introductory content..."
        ></textarea>
      </div>

      <div
        class="field"
        v-if="isEdit && form.logo && typeof form.logo === 'string'"
      >
        <label>Logo hiện tại:</label>
        <img
          :src="form.logo.startsWith('http') ? form.logo : `http://localhost:3000${form.logo}`"
          alt="logo"
          width="120"
        />
      </div>

      <div class="field file-field">
        <label>Tải lên logo mới</label>
        <input
          type="file"
          @change="onFileChange"
        />
        <span class="file-info">{{ fileName }}</span>
      </div>

      <button
        class="submit-btn"
        type="submit"
      >
        {{ isEdit ? 'Update' : 'Create' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const isEdit = ref(false);
const id = route.params.id;

const form = ref({
  h_name: '',
  logo: '',
  h_description: '',
  h_address: '',
  h_phone: '',
  h_lat: null,
  h_lng: null,
});
const logoFile = ref(null);
const fileName = ref('No file selected');

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    logoFile.value = file;
    fileName.value = file.name;
  }
};

const onSubmit = async () => {
  try {
    const data = new FormData();
    data.append('h_name', form.value.h_name);
    data.append('h_address', form.value.h_address);
    data.append('h_description', form.value.h_description);
    data.append('h_phone', form.value.h_phone);

    // Optional coordinates (normalize comma to dot before sending)
    const latVal = (form.value.h_lat === null || form.value.h_lat === undefined)
      ? ''
      : String(form.value.h_lat).replace(',', '.');
    const lngVal = (form.value.h_lng === null || form.value.h_lng === undefined)
      ? ''
      : String(form.value.h_lng).replace(',', '.');
    if (latVal !== '') {
      data.append('h_lat', latVal);
    }
    if (lngVal !== '') {
      data.append('h_lng', lngVal);
    }

    if (logoFile.value) {
      // Nếu có ảnh mới thì upload
      data.append('avatarFile', logoFile.value);
    } else {
      // Nếu không có ảnh mới, tách phần logo từ form.value.logo
      const relativeLogoPath = form.value.logo.replace(/^http:\/\/localhost:3000/, '');
      data.append('logo', relativeLogoPath);
    }

    if (isEdit.value) {
      await axios.put(`http://localhost:3000/api/hospitals/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Cập nhật thành công');
    } else {
      await axios.post('http://localhost:3000/api/hospitals', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Thêm thành công');
    }

    router.push('/admin/clinics');
  } catch (err) {
    alert('Lỗi khi gửi dữ liệu');
    console.error(err);
  }
};

const baseURL = 'http://localhost:3000';

onMounted(async () => {
  if (id && id !== 'new') {
    isEdit.value = true;
    try {
      const res = await axios.get(`http://localhost:3000/api/hospitals/${id}`);
      form.value = res.data;

      // ✅ Gắn lại đường dẫn đầy đủ cho logo để hiển thị được
      if (form.value.logo && !form.value.logo.startsWith('http')) {
        form.value.logo = baseURL + form.value.logo;
      }
    } catch (err) {
      alert('Không tải được dữ liệu');
    }
  }
});
</script>

<style scoped>
.form-bg {
  background: #f7f8fb;
  min-height: 100vh;
  padding: 0;
}
.title {
  font-size: 2rem;
  margin: 24px 0 12px 18px;
  color: #25262b;
  font-weight: 500;
}
.form-card {
  max-width: 100%;
  margin: 0 18px 32px 18px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 7px #eee;
  padding: 30px 18px 20px 18px;
}
.row {
  display: flex;
  gap: 24px;
  margin-bottom: 0;
}
.field {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 20px;
}
.field label {
  color: #5a6271;
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 5px;
}
.field input[type='text'],
.field input[type='number'],
.field textarea {
  border: 1px solid #e3e6ef;
  border-radius: 6px;
  background: #f7f8fb;
  font-size: 1rem;
  padding: 8px 14px;
  margin-bottom: 0;
  transition: border 0.18s;
  color: #111827;
}
.field input[type='text']:focus,
.field textarea:focus {
  outline: none;
  border-color: #6e87d8;
  background: #fff;
}
.wysiwyg {
  border: 1px solid #e3e6ef;
  border-radius: 6px 6px 0 0;
  background: #f7f8fb;
}
.wysiwyg-bar {
  border-bottom: 1px solid #e3e6ef;
  background: #f7f8fb;
  padding: 4px 8px;
}
.wysiwyg-bar button {
  border: none;
  background: none;
  font-size: 1rem;
  margin-right: 12px;
  opacity: 0.95;
  cursor: pointer;
  color: #626f81;
}
.wysiwyg textarea {
  border: none;
  background: #f7f8fb;
  min-height: 185px;
  width: 100%;
  padding: 14px 11px;
  font-size: 1rem;
  resize: vertical;
}
.wysiwyg textarea:focus {
  background: #fff;
}
.wysiwyg-count {
  font-size: 0.98rem;
  color: #b8bccc;
  float: right;
  margin-bottom: 6px;
  margin-right: 2px;
}
.file-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.field input[type='file'] {
  margin-right: 16px;
}
.file-info {
  font-size: 0.99rem;
  color: #7981a1;
}
.submit-btn {
  margin-top: 12px;
  padding: 7px 26px;
  font-size: 1.07rem;
  font-weight: 500;
  background: #648bfd;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: background 0.16s;
}
.submit-btn:hover {
  background: #4866c8;
}
@media (max-width: 950px) {
  .row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
