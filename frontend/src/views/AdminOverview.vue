<template>
  <div class="admin-overview">
    <div class="hero">
      <div class="hero-content">
        <h1>Tổng quan hệ thống</h1>
        <p>Thống kê nhanh về lịch khám, bác sĩ và bệnh viện.</p>
      </div>
    </div>

    <div class="cards">
      <div class="card approved">
        <div class="card-inner">
          <div class="card-icon">🗓️</div>
          <div class="card-info">
            <div class="value">{{ stats.totalAppointments }}</div>
            <div class="label">Tổng số lịch đặt khám</div>
            <div class="subbreak">
              <span class="ok">Đã duyệt: {{ stats.approvedAppointments }}</span>
              <span class="reject">Từ chối: {{ stats.rejectedAppointments }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card doctors">
        <div class="card-inner">
          <div class="card-icon">👨‍⚕️</div>
          <div class="card-info">
            <div class="value">{{ stats.doctors }}</div>
            <div class="label">Số lượng bác sĩ</div>
          </div>
        </div>
      </div>

      <div class="card hospitals">
        <div class="card-inner">
          <div class="card-icon">🏥</div>
          <div class="card-info">
            <div class="value">{{ stats.hospitals }}</div>
            <div class="label">Số lượng bệnh viện</div>
          </div>
        </div>
      </div>

      <div class="card revenue" @click="openRevenueDialog">
        <div class="card-inner">
          <div class="card-icon">💰</div>
          <div class="card-info">
            <div class="value">{{ formatVND(stats.totalRevenue) }}</div>
            <div class="label">Doanh thu tháng này</div>
            <div class="subbreak">
              <span class="revenue-growth" :class="revenueGrowthClass">
                {{ revenueGrowthText }}
              </span>
              <span class="revenue-target">
                Mục tiêu: {{ formatVND(stats.monthlyTarget || 0) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="overview-charts" style="display: grid; grid-template-columns: 1fr; gap: 32px;">
      <div style="height: 380px;">
        <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #374151;">Xu hướng lịch khám theo tháng</h3>
        <canvas id="overviewChartAppointments" style="width: 100%; height: 100%; display: block;"></canvas>
      </div>
      <div style="height: 240px;">
        <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #374151;">Xu hướng doanh thu theo tháng</h3>
        <canvas id="overviewChartRevenue" style="width: 100%; height: 100%; display: block;"></canvas>
      </div>
    </div>

    <el-dialog v-model="revenueDialog" title="📊 Báo cáo doanh thu chi tiết" width="1100px" class="revenue-dialog">
      <!-- Revenue Summary Cards -->
      

      <!-- Advanced Controls -->
      <div class="revenue-controls">
        <el-select v-model="revenueMode" placeholder="Chọn chế độ" @change="loadRevenue" style="width: 160px">
          <el-option label="Theo bác sĩ" value="doctor" />
          <el-option label="Theo bệnh viện" value="hospital" />
          <el-option label="Theo chuyên khoa" value="specialty" />
        </el-select>
        
        <el-select v-model="timePeriod" placeholder="Kỳ báo cáo" @change="loadRevenue" style="width: 140px">
          <el-option label="7 ngày" value="7d" />
          <el-option label="30 ngày" value="30d" />
          <el-option label="3 tháng" value="3m" />
          <el-option label="6 tháng" value="6m" />
          <el-option label="1 năm" value="1y" />
          <el-option label="Tùy chọn" value="custom" />
        </el-select>
        
        <el-date-picker 
          v-if="timePeriod === 'custom'"
          v-model="dateRange" 
          type="daterange" 
          range-separator="→" 
          start-placeholder="Từ ngày" 
          end-placeholder="Đến ngày" 
          @change="loadRevenue" 
          style="width: 280px"
        />
      </div>

      <!-- Chart and Table Layout -->
      <div class="revenue-content">
        <div class="chart-section">
          <div class="chart-header">
            <h3>Biểu đồ doanh thu</h3>
            <el-radio-group v-model="chartType" @change="updateChart" size="small">
              <el-radio-button value="bar">Cột</el-radio-button>
              <el-radio-button value="line">Đường</el-radio-button>
              <el-radio-button value="pie">Tròn</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-box" style="height: 320px;">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
        
        <div class="table-section">
          <div class="table-header">
            <h3>
              {{ revenueMode === 'doctor' ? 'Bác sĩ' : revenueMode === 'hospital' ? 'Bệnh viện' : 'Chuyên khoa' }}
              <span class="item-count">({{ topItems.length }} tổng cộng)</span>
            </h3>
            <div class="table-controls">
              <el-select 
                v-model="tablePageSize" 
                size="small" 
                style="width: 120px; margin-right: 8px"
                @change="handlePageSizeChange"
              >
                <el-option label="10/trang" :value="10" />
                <el-option label="20/trang" :value="20" />
                <el-option label="50/trang" :value="50" />
                <el-option label="Tất cả" :value="0" />
              </el-select>
              <el-input 
                v-model="searchText" 
                placeholder="Tìm kiếm..." 
                style="width: 200px"
                size="small"
                clearable
                @input="filterItems"
              />
            </div>
          </div>
          
          <el-table 
            :data="paginatedItems" 
            size="small" 
            height="280" 
            @row-click="openDetails"
            :highlight-current-row="true"
            v-loading="tableLoading"
          >
            <el-table-column type="index" label="STT" width="50" :index="getTableIndex" />
            <el-table-column 
              prop="name" 
              :label="revenueMode === 'doctor' ? 'Bác sĩ' : revenueMode === 'hospital' ? 'Bệnh viện' : 'Chuyên khoa'" 
              min-width="160"
              show-overflow-tooltip
              sortable
            />
            <el-table-column 
              prop="approvedCount" 
              label="Số lịch" 
              width="80" 
              align="center" 
              sortable
            />
            <el-table-column 
              prop="revenue" 
              label="Doanh thu" 
              width="140" 
              align="right"
              sortable
              :sort-method="(a, b) => a.revenue - b.revenue"
            >
              <template #default="{ row }">
                <span class="revenue-amount">{{ formatVND(row.revenue) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Mục tiêu" width="120" align="center">
              <template #default="{ row }">
                <div class="target-cell">
                  <el-progress 
                    :percentage="row.targetProgress || 0" 
                    :stroke-width="8"
                    :show-text="false"
                    :color="getTargetProgressColor(row.targetProgress || 0)"
                    class="target-progress"
                  />
                  <div class="target-info">
                    <span class="progress-text">{{ (row.targetProgress || 0).toFixed(0) }}%</span>
                    <el-button 
                      size="small" 
                      type="text" 
                      @click.stop="openTargetDialog(row)"
                      class="set-target-btn"
                    >
                      {{ row.monthlyTarget ? 'Sửa' : 'Đặt' }}
                    </el-button>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="Top %" width="80" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.percentage" 
                  :stroke-width="6"
                  :show-text="false"
                  :color="getProgressColor(row.percentage)"
                />
                <span style="font-size: 11px; color: #666; margin-top: 2px; display: block;">{{ row.percentage }}%</span>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- Pagination -->
          <div v-if="tablePageSize > 0 && filteredItems.length > tablePageSize" class="table-pagination">
            <el-pagination
              v-model:current-page="currentTablePage"
              :page-size="tablePageSize"
              :total="filteredItems.length"
              layout="prev, pager, next, jumper"
              small
              @current-change="handlePageChange"
            />
            <div class="pagination-info">
              Hiển thị {{ getDisplayRange() }} trong tổng số {{ filteredItems.length }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Target Setting Dialog -->
    <el-dialog 
      v-model="targetDialog" 
      title="🎯 Đặt mục tiêu doanh thu" 
      width="500px"
      class="target-dialog"
    >
      <div class="target-form">
        <div class="current-info">
          <h4>{{ selectedTargetItem?.name }}</h4>
          <p class="current-revenue">
            Doanh thu hiện tại: <strong>{{ formatVND(selectedTargetItem?.revenue || 0) }}</strong>
          </p>
          <p class="current-appointments">
            Số lịch khám: <strong>{{ selectedTargetItem?.approvedCount || 0 }}</strong>
          </p>
        </div>

        <el-form :model="targetForm" label-width="120px">
          <el-form-item label="Mục tiêu tháng">
            <el-input-number
              v-model="targetForm.monthlyTarget"
              :min="0"
              :max="1000000000"
              :step="1000000"
              size="large"
              style="width: 100%"
              :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="value => value.replace(/\$\s?|(,*)/g, '')"
            />
            <small>Đơn vị: VNĐ</small>
          </el-form-item>

          <el-form-item label="Thời hạn">
            <el-date-picker
              v-model="targetForm.targetMonth"
              type="month"
              placeholder="Chọn tháng"
              format="MM/YYYY"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="Ghi chú">
            <el-input
              v-model="targetForm.note"
              type="textarea"
              :rows="3"
              placeholder="Ghi chú về mục tiêu này..."
            />
          </el-form-item>
        </el-form>

        <!-- Target Preview -->
        <div v-if="targetForm.monthlyTarget" class="target-preview">
          <h5>📊 Dự báo tiến độ</h5>
          <div class="preview-cards">
            <div class="preview-card">
              <span class="preview-label">Mục tiêu</span>
              <span class="preview-value">{{ formatVND(targetForm.monthlyTarget) }}</span>
            </div>
            <div class="preview-card">
              <span class="preview-label">Hiện tại</span>
              <span class="preview-value">{{ formatVND(selectedTargetItem?.revenue || 0) }}</span>
            </div>
            <div class="preview-card">
              <span class="preview-label">Còn thiếu</span>
              <span class="preview-value" :class="getTargetStatusClass()">
                {{ formatVND(Math.max(0, targetForm.monthlyTarget - (selectedTargetItem?.revenue || 0))) }}
              </span>
            </div>
          </div>
          
          <el-progress 
            :percentage="getPreviewProgress()" 
            :stroke-width="12"
            :color="getTargetProgressColor(getPreviewProgress())"
            class="preview-progress"
          >
            <template #default="{ percentage }">
              <span class="progress-label">{{ percentage.toFixed(1) }}% hoàn thành</span>
            </template>
          </el-progress>
        </div>
      </div>

      <template #footer>
        <el-button @click="targetDialog = false">Hủy</el-button>
        <el-button 
          type="primary" 
          @click="saveTarget"
          :disabled="!targetForm.monthlyTarget || !targetForm.targetMonth"
        >
          {{ selectedTargetItem?.monthlyTarget ? 'Cập nhật' : 'Đặt mục tiêu' }}
        </el-button>
        <el-button 
          v-if="selectedTargetItem?.monthlyTarget" 
          type="danger" 
          @click="deleteTarget"
        >
          Xóa mục tiêu
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailsOpen" :title="detailsTitle" size="60%">
      <div class="revenue-controls">
        <el-date-picker v-model="dateRangeDetails" type="daterange" range-separator="đến" start-placeholder="Từ ngày" end-placeholder="Đến ngày" @change="loadDetails" />
      </div>
      <el-table :data="detailItems" size="small" style="margin-top: 12px" height="420">
        <el-table-column prop="id_appointment" label="#" width="90" />
        <el-table-column prop="p_name" label="Bệnh nhân" min-width="160" />
        <el-table-column prop="dr_name" label="Bác sĩ" min-width="160" />
        <el-table-column prop="h_name" label="Bệnh viện" min-width="180" />
        <el-table-column prop="appointment_date" label="Ngày" width="120">
          <template #default="{ row }">{{ formatDateDisplay(row.appointment_date) }}</template>
        </el-table-column>
        <el-table-column prop="time_slot" label="Giờ" width="100" />
        <el-table-column prop="dr_price" label="Giá" width="140">
          <template #default="{ row }">{{ formatVND(priceToNumber(row)) }}</template>
        </el-table-column>
      </el-table>
      <div style="display:flex; justify-content:flex-end; margin-top: 8px">
        <el-pagination
          v-model:current-page="detailsPage"
          v-model:page-size="detailsLimit"
          layout="prev, pager, next"
          :total="detailsTotal"
          @current-change="loadDetails"
          @size-change="loadDetails"
        />
      </div>
      <div style="margin-top: 8px; text-align: right; font-weight: 600">
        Tổng: {{ formatVND(detailsRevenue) }}
      </div>
    </el-drawer>
  </div>
</template>

<script>
import axios from '../axios';
export default {
  name: 'AdminOverview',
  data() {
    return {
      loading: false,
      stats: { 
        totalAppointments: 0, 
        approvedAppointments: 0, 
        rejectedAppointments: 0, 
        doctors: 0, 
        hospitals: 0, 
        totalRevenue: 0,
        monthlyTarget: 50000000,
        revenueGrowth: 0
      },
      chartAppointments: null,
      chartRevenue: null,
      revenueDialog: false,
      revenueMode: 'doctor',
      timePeriod: '30d',
      chartType: 'line',
      searchText: '',
      revenueChart: null,
      dateRange: null,
      topItems: [],
      filteredItems: [],
      // Table pagination
      tablePageSize: 20,
      currentTablePage: 1,
      tableLoading: false,
      // Target management
      targetDialog: false,
      selectedTargetItem: null,
      targetForm: {
        monthlyTarget: null,
        targetMonth: null,
        note: ''
      },
      // Revenue summary data
      revenueSummary: {
        total: 0,
        appointmentCount: 0,
        avgRevenue: 0,
        growthRate: 0
      },
      // details
      detailsOpen: false,
      detailsTitle: '',
      selectedItem: null,
      dateRangeDetails: null,
      detailItems: [],
      detailsPage: 1,
      detailsLimit: 10,
      detailsTotal: 0,
      detailsRevenue: 0
    };
  },
  computed: {
    revenueGrowthClass() {
      return this.stats.revenueGrowth >= 0 ? 'positive' : 'negative';
    },
    revenueGrowthText() {
      const growth = this.stats.revenueGrowth || 0;
      const sign = growth >= 0 ? '+' : '';
      return `${sign}${growth.toFixed(1)}% so với tháng trước`;
    },
    paginatedItems() {
      if (this.tablePageSize === 0) {
        return this.filteredItems; // Show all items
      }
      
      const start = (this.currentTablePage - 1) * this.tablePageSize;
      const end = start + this.tablePageSize;
      return this.filteredItems.slice(start, end);
    }
  },
  methods: {
    formatVND(value) {
      const num = Number(value || 0);
      return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    },
    priceToNumber(row) {
      if (row && typeof row.numeric_dr_price === 'number') return row.numeric_dr_price;
      const s = String(row?.dr_price ?? '0');
      // Bỏ dấu . hoặc , ngăn cách hàng nghìn ("200.000" -> 200000)
      const cleaned = s.replace(/[.,\s]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    },
    formatDateDisplay(value) {
      if (!value) return '';
      const s = String(value);
      // Lấy phần yyyy-mm-dd đầu để tránh lệch múi giờ, rồi chuyển sang dd/mm/yyyy
      const base = s.length >= 10 ? s.slice(0, 10) : s;
      const parts = base.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
      }
      // fallback
      try {
        const dt = new Date(value);
        return dt.toLocaleDateString('vi-VN');
      } catch {
        return s;
      }
    },
    async renderChart() {
      // Nạp Chart.js qua CDN nếu chưa có
      if (!window.Chart) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // Lấy dữ liệu xu hướng theo tháng (12 tháng gần nhất)
      let trends;
      try {
        const res = await axios.get('/admin/monthly-trends');
        trends = res.data || {};
      } catch (e) {
        console.error('Lỗi tải xu hướng theo tháng:', e);
        // fallback: vẽ rỗng nếu lỗi
        trends = { months: [], items: [] };
      }

      const labels = (trends.months || []).map(m => {
        const [y, mm] = m.split('-');
        return `${mm}/${y}`;
      });
      const items = trends.items || [];
      const approvedPerMonth = items.map(i => i.approved || 0);
      const revenuePerMonth = items.map(i => i.revenue || 0);

      // Appointments Line chart
      const ctxApp = document.getElementById('overviewChartAppointments');
      if (ctxApp) {
        if (this.chartAppointments) this.chartAppointments.destroy();
        this.chartAppointments = new window.Chart(ctxApp, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Lịch khám đã duyệt',
                data: approvedPerMonth,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.15)',
                tension: 0.45,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y || 0).toLocaleString('vi-VN')}`
                }
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                beginAtZero: true,
                ticks: { callback: (v) => Number(v).toLocaleString('vi-VN') },
                title: { display: true, text: 'Số lịch' }
              }
            }
          }
        });
      }

      // Revenue Line chart
      const ctxRev = document.getElementById('overviewChartRevenue');
      if (ctxRev) {
        if (this.chartRevenue) this.chartRevenue.destroy();
        this.chartRevenue = new window.Chart(ctxRev, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Doanh thu (VND)',
                data: revenuePerMonth,
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22,163,74,0.10)',
                tension: 0.45,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${this.formatVND(ctx.parsed.y || 0)}`
                }
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) => {
                    const n = Number(v);
                    if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(1)+'B';
                    if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
                    if (n >= 1_000) return (n/1_000).toFixed(1)+'K';
                    return n;
                  }
                },
                title: { display: true, text: 'Doanh thu' }
              }
            }
          }
        });
      }
    },
    async ensureChartJs() {
      if (!window.Chart) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
    },
    openRevenueDialog() {
      this.revenueDialog = true;
      this.$nextTick(() => this.loadRevenue());
    },
    async loadRevenue() {
      try {
        await this.ensureChartJs();
        const params = { mode: this.revenueMode };
        
        // Handle time period
        if (this.timePeriod === 'custom' && this.dateRange && this.dateRange.length === 2) {
          params.date_from = this.formatDate(this.dateRange[0]);
          params.date_to = this.formatDate(this.dateRange[1]);
        } else {
          params.period = this.timePeriod;
        }
        
        const res = await axios.get(`/admin/revenue`, { params });
        const data = res.data || {};
        const items = data.items || [];

        // Determine target month to fetch (default: current month)
        const targetMonth = new Date().toISOString().slice(0, 7);

        // Fetch revenue targets for this item type and month, then merge
        let targets = [];
        try {
          const tRes = await axios.get('/admin/revenue-targets', {
            params: { itemType: this.revenueMode, targetMonth }
          });
          targets = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.targets || []);
        } catch (e) {
          // If the endpoint is missing or fails, continue gracefully
          console.info('Không thể tải mục tiêu doanh thu, sẽ hiển thị dữ liệu doanh thu cơ bản.');
        }
        const targetMap = new Map(targets.map(t => [String(t.item_id), t]));

        // Merge target info into items
        const merged = items.map(item => {
          const t = targetMap.get(String(item.id));
          return {
            ...item,
            monthlyTarget: t ? Number(t.monthly_target || 0) : item.monthlyTarget || null,
            targetMonth: t ? t.target_month : item.targetMonth || null,
            targetNote: t ? (t.note || null) : item.targetNote || null
          };
        });
        
        // Calculate percentages and target progress
        const maxRevenue = Math.max(...merged.map(item => item.revenue || 0));
        this.topItems = merged.map(item => {
          const percentage = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;
          const targetProgress = item.monthlyTarget > 0 ? Math.min(100, (item.revenue / item.monthlyTarget) * 100) : 0;
          return { ...item, percentage, targetProgress };
        });
        
        this.filteredItems = [...this.topItems];
        
        // Update revenue summary
        this.revenueSummary = {
          total: data.summary?.total || 0,
          appointmentCount: data.summary?.appointmentCount || 0,
          avgRevenue: data.summary?.avgRevenue || 0,
          growthRate: data.summary?.growthRate || 0
        };
        
        this.updateRevenueChart();
      } catch (e) {
        console.error('Lỗi tải doanh thu:', e);
        this.$message.error('Không thể tải dữ liệu doanh thu');
      }
    },

    updateRevenueChart() {
      // Smart chart data handling based on number of items
      const totalItems = this.topItems.length;
      let chartData = [];
      let labels = [];
      let values = [];
      
      if (totalItems === 0) {
        labels = ['Không có dữ liệu'];
        values = [0];
      } else if (this.chartType === 'pie') {
        // For pie chart, show top 8 + others
        const top8 = this.topItems.slice(0, 8);
        const others = this.topItems.slice(8);
        
        chartData = [...top8];
        if (others.length > 0) {
          const othersRevenue = others.reduce((sum, item) => sum + (item.revenue || 0), 0);
          chartData.push({
            name: `Khác (${others.length})`,
            revenue: othersRevenue
          });
        }
        
        labels = chartData.map(i => this.truncateName(i.name, 20));
        values = chartData.map(i => i.revenue);
      } else {
        // For bar/line charts, show top 12 for better readability
        const topItems = this.topItems.slice(0, 12);
        labels = topItems.map(i => this.truncateName(i.name, this.chartType === 'bar' ? 15 : 25));
        values = topItems.map(i => i.revenue);
      }
      
      const ctx = document.getElementById('revenueChart');
      if (!ctx) return;
      
      if (this.revenueChart) this.revenueChart.destroy();
      
      const chartConfig = {
        type: this.chartType === 'pie' ? 'pie' : this.chartType,
        data: {
          labels,
          datasets: [{
            label: 'Doanh thu (VND)',
            data: values,
            backgroundColor: this.chartType === 'pie' ? [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#8A2BE2', '#00CED1', '#FF7F50', '#6495ED'
            ] : this.generateColors(values.length),
            borderColor: this.chartType === 'pie' ? '#fff' : this.generateBorderColors(values.length),
            borderWidth: this.chartType === 'pie' ? 2 : 1,
            borderRadius: this.chartType === 'bar' ? 6 : 0,
            maxBarThickness: this.chartType === 'bar' ? (values.length > 8 ? 30 : 48) : undefined
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              display: this.chartType === 'pie' && values.length <= 10,
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 8,
                usePointStyle: true
              }
            },
            tooltip: { 
              callbacks: { 
                label: (c) => {
                  const value = this.formatVND(c.parsed.y || c.parsed);
                  const originalName = this.getOriginalName(c.label);
                  return `${originalName}: ${value}`;
                }
              }
            },
            title: {
              display: true,
              text: totalItems > (this.chartType === 'pie' ? 8 : 12) ? 
                `Top ${this.chartType === 'pie' ? 8 : 12} (${totalItems} tổng cộng)` : 
                `${totalItems} ${this.revenueMode === 'doctor' ? 'bác sĩ' : this.revenueMode === 'hospital' ? 'bệnh viện' : 'chuyên khoa'}`,
              font: {
                size: 14,
                weight: '600'
              },
              color: '#374151'
            }
          }
        }
      };
      
      if (this.chartType !== 'pie') {
        chartConfig.options.scales = {
          x: { 
            grid: { display: false },
            ticks: {
              maxRotation: values.length > 8 ? 45 : 0,
              minRotation: values.length > 8 ? 45 : 0,
              font: {
                size: values.length > 10 ? 10 : 12
              }
            }
          },
          y: { 
            beginAtZero: true, 
            ticks: { 
              callback: (v) => Number(v).toLocaleString('vi-VN'),
              maxTicksLimit: 6
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        };
      }
      
      this.revenueChart = new window.Chart(ctx, chartConfig);
    },

    // Helper methods for better chart handling
    truncateName(name, maxLength) {
      if (!name) return 'N/A';
      return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    },
    
    getOriginalName(truncatedLabel) {
      // Find original name from topItems
      const found = this.topItems.find(item => 
        item.name === truncatedLabel || 
        item.name.startsWith(truncatedLabel.replace('...', ''))
      );
      return found ? found.name : truncatedLabel;
    },
    
    generateColors(count) {
      const baseColors = ['#16a34a', '#0891b2', '#7c3aed', '#dc2626', '#ea580c', '#0284c7'];
      if (count <= baseColors.length) {
        return baseColors.slice(0, count);
      }
      
      // Generate gradient colors for many items
      const colors = [];
      for (let i = 0; i < count; i++) {
        const hue = (i * 137.508) % 360; // Golden angle approximation
        colors.push(`hsl(${hue}, 65%, 50%)`);
      }
      return colors;
    },
    
    generateBorderColors(count) {
      const colors = this.generateColors(count);
      return colors.map(color => color.replace('50%)', '40%)')); // Darker borders
    },

    updateChart() {
      this.updateRevenueChart();
    },

    filterItems() {
      if (!this.searchText) {
        this.filteredItems = [...this.topItems];
      } else {
        this.filteredItems = this.topItems.filter(item =>
          item.name.toLowerCase().includes(this.searchText.toLowerCase())
        );
      }
      // Reset to first page when filtering
      this.currentTablePage = 1;
    },

    // Table pagination methods
    handlePageChange(page) {
      this.currentTablePage = page;
    },

    handlePageSizeChange(size) {
      this.tablePageSize = size;
      this.currentTablePage = 1;
    },

    getTableIndex(index) {
      if (this.tablePageSize === 0) {
        return index + 1;
      }
      return (this.currentTablePage - 1) * this.tablePageSize + index + 1;
    },

    getDisplayRange() {
      if (this.tablePageSize === 0) {
        return `1-${this.filteredItems.length}`;
      }
      
      const start = (this.currentTablePage - 1) * this.tablePageSize + 1;
      const end = Math.min(this.currentTablePage * this.tablePageSize, this.filteredItems.length);
      return `${start}-${end}`;
    },

    getProgressColor(percentage) {
      if (percentage >= 80) return '#22c55e';
      if (percentage >= 60) return '#3b82f6';
      if (percentage >= 40) return '#f59e0b';
      return '#ef4444';
    },

    getTargetProgressColor(progress) {
      if (progress >= 100) return '#22c55e'; // Green - Target achieved
      if (progress >= 80) return '#3b82f6';  // Blue - Near target
      if (progress >= 60) return '#f59e0b';  // Orange - Moderate progress
      if (progress >= 30) return '#f97316';  // Dark orange - Low progress
      return '#ef4444'; // Red - Poor progress
    },

    // Target management methods
    openTargetDialog(item) {
      this.selectedTargetItem = { ...item };
      this.targetForm = {
        monthlyTarget: item.monthlyTarget || null,
        targetMonth: item.targetMonth || new Date().toISOString().slice(0, 7),
        note: item.targetNote || ''
      };
      this.targetDialog = true;
    },

    async saveTarget() {
      // Optimistic UI: cập nhật local trước để không phụ thuộc API
      const itemIndex = this.topItems.findIndex(item => item.id === this.selectedTargetItem.id);
      if (itemIndex !== -1) {
        const revenue = Number(this.topItems[itemIndex].revenue || 0);
        const target = Number(this.targetForm.monthlyTarget || 0);
        this.topItems[itemIndex] = {
          ...this.topItems[itemIndex],
          monthlyTarget: target,
          targetMonth: this.targetForm.targetMonth,
          targetNote: this.targetForm.note,
          targetProgress: target > 0 ? Math.min(100, (revenue / target) * 100) : 0
        };
      }
      this.targetDialog = false;
      // Thử gọi API nếu có (không làm gián đoạn nếu 404)
      try {
        await axios.post('/admin/revenue-targets', {
          itemId: this.selectedTargetItem.id,
          itemType: this.revenueMode,
          monthlyTarget: this.targetForm.monthlyTarget,
          targetMonth: this.targetForm.targetMonth,
          note: this.targetForm.note
        });
        this.$message?.success && this.$message.success('Đã lưu mục tiêu');
      } catch (error) {
        if (error?.response?.status === 404) {
          console.info('Endpoint đặt mục tiêu chưa sẵn sàng (404) - đã lưu local state.');
        } else {
          console.warn('Error saving target:', error?.response?.data || error.message);
        }
      } finally {
        this.filterItems();
      }
    },

    async deleteTarget() {
      try {
        await this.$confirm('Bạn có chắc muốn xóa mục tiêu này?', 'Xác nhận', {
          confirmButtonText: 'Xóa',
          cancelButtonText: 'Hủy',
          type: 'warning'
        });

        // Debug log
        console.log('Deleting target for:', {
          id: this.selectedTargetItem.id,
          type: this.revenueMode,
          targetMonth: this.targetForm.targetMonth
        });

        // Call API to delete target
        await axios.delete(`/admin/revenue-targets/${this.selectedTargetItem.id}`, {
          params: { 
            type: this.revenueMode,
            targetMonth: this.targetForm.targetMonth
          }
        });

        // Update local data
        const itemIndex = this.topItems.findIndex(item => item.id === this.selectedTargetItem.id);
        if (itemIndex !== -1) {
          this.topItems[itemIndex] = {
            ...this.topItems[itemIndex],
            monthlyTarget: null,
            targetMonth: null,
            targetNote: null,
            targetProgress: 0
          };
        }

        this.targetDialog = false;
        this.$message.success('Đã xóa mục tiêu');
        this.filterItems(); // Refresh filtered items
      } catch (error) {
        if (error !== 'cancel') {
          // Treat 404 (not found on server) as non-fatal: clear local state anyway
          if (error?.response?.status === 404) {
            const itemIndex = this.topItems.findIndex(item => item.id === this.selectedTargetItem.id);
            if (itemIndex !== -1) {
              this.topItems[itemIndex] = {
                ...this.topItems[itemIndex],
                monthlyTarget: null,
                targetMonth: null,
                targetNote: null,
                targetProgress: 0
              };
            }
            this.targetDialog = false;
            this.$message?.info && this.$message.info('Không tìm thấy mục tiêu trên server, đã cập nhật trạng thái cục bộ');
            this.filterItems();
          } else {
            console.error('Error deleting target:', error);
            this.$message.error('Lỗi khi xóa mục tiêu');
          }
        }
      }
    },

    getPreviewProgress() {
      if (!this.targetForm.monthlyTarget || !this.selectedTargetItem) return 0;
      return Math.min(100, (this.selectedTargetItem.revenue / this.targetForm.monthlyTarget) * 100);
    },

    getTargetStatusClass() {
      const remaining = this.targetForm.monthlyTarget - (this.selectedTargetItem?.revenue || 0);
      return remaining <= 0 ? 'target-achieved' : 'target-remaining';
    },

    exportRevenue() {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "STT,Tên,Số lịch khám,Doanh thu\n" +
        this.filteredItems.map((item, index) => 
          `${index + 1},"${item.name}",${item.approvedCount},${item.revenue}`
        ).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `doanh_thu_${this.revenueMode}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.$message.success('Đã xuất file báo cáo');
    },
    formatDate(d) {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    },
    openDetails(row) {
      this.selectedItem = row;
      this.detailsTitle = `${this.revenueMode === 'doctor' ? 'Bác sĩ' : 'Bệnh viện'}: ${row.name}`;
      this.detailsOpen = true;
      this.detailsPage = 1;
      this.loadDetails();
    },
    async loadDetails() {
      if (!this.selectedItem) return;
      const params = {
        mode: this.revenueMode,
        id: this.selectedItem.id,
        page: this.detailsPage,
        limit: this.detailsLimit
      };
      if (this.dateRangeDetails && this.dateRangeDetails.length === 2) {
        params.date_from = this.formatDate(this.dateRangeDetails[0]);
        params.date_to = this.formatDate(this.dateRangeDetails[1]);
      } else if (this.dateRange && this.dateRange.length === 2) {
        params.date_from = this.formatDate(this.dateRange[0]);
        params.date_to = this.formatDate(this.dateRange[1]);
      }
      try {
        const res = await axios.get('/admin/revenue/details', { params });
        this.detailItems = res.data?.items || [];
        this.detailsTotal = res.data?.pagination?.total || 0;
        this.detailsRevenue = res.data?.revenue || 0;
      } catch (e) {
        console.error('Lỗi tải chi tiết doanh thu:', e);
      }
    }
  },
  async mounted() {
    this.loading = true;
    try {
      const res = await axios.get('/admin/overview');
      this.stats = res.data || this.stats;
      await this.renderChart();
    } catch (e) {
      console.error('Lỗi tải tổng quan:', e);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.admin-overview {
  padding: 0 24px 24px;
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

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 0;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  transition: transform .15s ease, box-shadow .15s ease;
  border: 1px solid #eef2ff;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.card-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.card-info .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.card-info .label {
  color: #6b7280;
  margin-top: 6px;
  font-size: 0.9rem;
}

.subbreak { 
  margin-top: 6px; 
  display: flex; 
  flex-direction: column;
  gap: 4px; 
  font-size: .85rem; 
}
.subbreak .ok { color: #0ea5e9; }
.subbreak .reject { color: #ef4444; }
.subbreak .revenue-growth { 
  font-weight: 600; 
}
.subbreak .revenue-growth.positive { color: #16a34a; }
.subbreak .revenue-growth.negative { color: #ef4444; }
.subbreak .revenue-target { 
  color: #6b7280;
  font-size: .8rem;
}

/* Themed cards */
.card.approved .card-icon { 
  background: #ecfeff; 
  color: #0891b2; 
  border: 1px solid #cffafe; 
}
.card.doctors .card-icon { 
  background: #eef2ff; 
  color: #4f46e5; 
  border: 1px solid #e0e7ff; 
}
.card.hospitals .card-icon { 
  background: #f0fdf4; 
  color: #16a34a; 
  border: 1px solid #dcfce7; 
}
.card.revenue .card-icon { 
  background: #fff7ed; 
  color: #f97316; 
  border: 1px solid #ffedd5; 
}

.revenue-controls { 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* Revenue Dialog Styles */
.revenue-dialog .el-dialog__body {
  padding: 20px !important;
}

.revenue-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.summary-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.revenue-content {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  margin-top: 20px;
}

.chart-section, .table-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.chart-header, .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.chart-header h3, .table-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.table-header {
  flex-wrap: wrap;
  gap: 12px;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6b7280;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Target Management Styles */
.target-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.target-progress {
  width: 60px;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  min-width: 30px;
}

.set-target-btn {
  padding: 2px 6px !important;
  height: auto !important;
  font-size: 10px !important;
  border-radius: 4px !important;
}

.set-target-btn:hover {
  background-color: #f3f4f6 !important;
}

/* Target Dialog Styles */
.target-dialog .el-dialog__body {
  padding: 20px !important;
}

.current-info {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.current-info h4 {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.current-revenue, .current-appointments {
  margin: 8px 0;
  font-size: 0.95rem;
}

.current-revenue strong, .current-appointments strong {
  color: #fbbf24;
}

.target-preview {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.target-preview h5 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #374151;
}

.preview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.preview-card {
  background: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.preview-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-value {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.preview-value.target-achieved {
  color: #22c55e;
}

.preview-value.target-remaining {
  color: #f59e0b;
}

.preview-progress {
  margin-top: 16px;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

/* Form Enhancements */
.target-form .el-form-item__label {
  font-weight: 600;
  color: #374151;
}

.target-form .el-input-number {
  width: 100%;
}

.target-form small {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

/* Target Progress Colors */
::v-deep(.target-progress .el-progress-bar__outer) {
  background-color: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
}

::v-deep(.target-progress .el-progress-bar__inner) {
  transition: all 0.3s ease;
}

/* Target Achievement Indicators */
.target-achieved {
  color: #22c55e !important;
  font-weight: 700;
}

.target-remaining {
  color: #f59e0b !important;
}

/* Enhanced Button Styling */
.target-dialog .el-dialog__footer .el-button--primary {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border: none;
}

.target-dialog .el-dialog__footer .el-button--danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
}

.revenue-amount {
  font-weight: 600;
  color: #16a34a;
}

.chart-box { 
  margin-top: 18px; 
  background: #fff; 
  border: 1px solid #eef2ff; 
  border-radius: 14px; 
  padding: 16px; 
  height: 280px; 
  box-shadow: 0 6px 14px rgba(0,0,0,.06); 
}

/* Table Styling */
::v-deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

::v-deep(.el-table__header) {
  background-color: #f8fafc;
}

::v-deep(.el-table tr:hover > td) {
  background-color: #f1f5f9 !important;
}

/* Progress Bar Styling */
::v-deep(.el-progress-bar__outer) {
  background-color: #e2e8f0;
  border-radius: 4px;
}

::v-deep(.el-progress-bar__inner) {
  background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 4px;
}

/* Chart Loading State */
.chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #6b7280;
}

/* Enhanced Table Styling */
::v-deep(.el-table--small) {
  font-size: 13px;
}

::v-deep(.el-table__row:hover .revenue-amount) {
  color: #16a34a;
  font-weight: 700;
}

::v-deep(.el-pagination--small) {
  font-size: 12px;
}

::v-deep(.el-pagination__jump) {
  margin-left: 8px;
}

/* Empty State */
.table-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.table-empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Performance Indicators */
.performance-high { color: #22c55e; }
.performance-medium { color: #3b82f6; }
.performance-low { color: #f59e0b; }
.performance-poor { color: #ef4444; }

/* Responsive Design */
@media (max-width: 1200px) {
  .revenue-content {
    grid-template-columns: 1fr;
  }
  
  .revenue-summary {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .revenue-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .revenue-controls > * {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .table-pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .chart-section {
    padding: 12px;
  }
  
  .table-section {
    padding: 12px;
  }
}

@media (max-width: 640px) {
  .hero-content h1 { font-size: 1.4rem; }
  .card-info .value { font-size: 1.6rem; }
}
.overview-charts > div { position: relative; }
.overview-charts canvas { width: 100% !important; height: 100% !important; display: block; }

</style>
