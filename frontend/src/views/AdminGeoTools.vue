<template>
  <div class="geo-tools">
    <header class="header">
      <h2>Geocoding tools (Hospitals)</h2>
      <div class="actions">
        <button class="btn" @click="loadStatus" :disabled="loading">🔄 Refresh status</button>
      </div>
    </header>

    <section class="card">
      <h3>Status</h3>
      <div v-if="loading" class="muted">Loading...</div>
      <div v-else>
        <div class="stats">
          <div class="stat"><label>Total</label><strong>{{ status.total ?? '-' }}</strong></div>
          <div class="stat ok"><label>With lat/lng</label><strong>{{ status.withLatLng ?? '-' }}</strong></div>
          <div class="stat warn"><label>Missing lat/lng</label><strong>{{ status.withoutLatLng ?? '-' }}</strong></div>
        </div>
        <div v-if="status.sample?.length">
          <h4>Sample missing (up to 10)</h4>
          <ul class="sample-list">
            <li v-for="s in status.sample" :key="s.h_id">
              <strong>#{{ s.h_id }}</strong> — {{ s.h_name }} <span class="muted">({{ s.h_address }})</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Backfill missing coordinates</h3>
      <div class="row">
        <label>Batch size</label>
        <input type="number" v-model.number="limit" min="1" max="100" />
        <button class="btn primary" @click="runBackfill" :disabled="loadingBackfill">▶ Run</button>
      </div>
      <div v-if="result" class="result">
        <div>Processed: <strong>{{ result.processed }}</strong></div>
        <div>Updated: <strong class="ok">{{ result.updated }}</strong></div>
        <div>Failed: <strong class="warn">{{ result.failed }}</strong></div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/axios';

const loading = ref(false);
const loadingBackfill = ref(false);
const status = ref({ total: null, withLatLng: null, withoutLatLng: null, sample: [] });
const limit = ref(50);
const result = ref(null);

async function loadStatus() {
  try {
    loading.value = true;
    const { data } = await axios.get('/admin/geo/hospitals/status');
    if (data?.success) {
      status.value = data.data || {};
    } else {
      status.value = { total: null, withLatLng: null, withoutLatLng: null, sample: [] };
    }
  } catch (e) {
    console.error('loadStatus error', e);
  } finally {
    loading.value = false;
  }
}

async function runBackfill() {
  try {
    loadingBackfill.value = true;
    result.value = null;
    const { data } = await axios.post(`/admin/geo/hospitals/backfill?limit=${limit.value}`);
    result.value = data;
    await loadStatus();
  } catch (e) {
    console.error('runBackfill error', e);
  } finally {
    loadingBackfill.value = false;
  }
}

onMounted(loadStatus);
</script>

<style scoped>
.geo-tools { padding: 24px; display: grid; gap: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; }
.actions { display: flex; gap: 8px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.row { display: flex; gap: 8px; align-items: center; }
.btn { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
.btn.primary { background: #2563eb; color: #fff; border-color: #1d4ed8; }
.stats { display: flex; gap: 16px; }
.stat { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; min-width: 160px; }
.stat label { display: block; color: #64748b; font-size: 12px; }
.stat strong { font-size: 18px; }
.ok { color: #16a34a; }
.warn { color: #d97706; }
.muted { color: #6b7280; }
.sample-list { margin: 8px 0 0; padding-left: 16px; }
.result { display: flex; gap: 16px; margin-top: 8px; }
</style>
