<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span style="font-size: 30px"></span>
        <h2>DOCTORS<br />CARE</h2>
      </div>
      <nav class="menu">
        <div class="menu-group">
          
          <ul>
            <li><router-link to="/">🏠 Trang chủ</router-link></li>
            <li>
              <router-link to="/admin/overview">📊 Tổng quan</router-link>
            </li>
          </ul>
        </div>

        <div class="menu-group">
          <small>Chức năng quản lý</small>
          <ul>
            <li><router-link to="/admin/doctors">👨‍⚕️ Quản lý bác sĩ</router-link></li>
            <li><router-link to="/admin/clinics">🏥 Quản lý bệnh viện</router-link></li>
            <li><router-link to="/admin/specialties">🩺 Quản lý chuyên khoa</router-link></li>

            <li>
              <router-link to="/admin/appointments">📅 Quản lý lịch khám</router-link>
            </li>
            <li>
              <router-link to="/admin/feedbacks">🌟 Quản lý đánh giá</router-link>
            </li>
            
            <li>
              <router-link to="/admin/users">👨🏻‍💻 Quản lý người dùng</router-link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <main class="main">
      <header class="admin-header">
        <div class="header-left">
          <h2 class="page-title">{{ getPageTitle() }}</h2>
        </div>
        <div class="header-right">
          <div class="admin-profile">
            <div class="admin-avatar">
              <span>A</span>
            </div>
            <span class="admin-name">Admin</span>
          </div>
        </div>
      </header>
      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script>
import { useRoute } from 'vue-router'

export default {
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    
    const getPageTitle = () => {
      const titles = {
        '/admin/overview': 'Tổng quan hệ thống',
        '/admin/doctors': 'Quản lý bác sĩ',
        '/admin/clinics': 'Quản lý bệnh viện',
        '/admin/specialties': 'Quản lý chuyên khoa',
        '/admin/appointments/pending': 'Quản lý lịch khám',
        '/admin/feedbacks': 'Quản lý đánh giá',
        '/admin/users': 'Quản lý người dùng'
      }
      return titles[route.path] || 'Admin Dashboard'
    }
    
    return {
      getPageTitle
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 240px;
  background: linear-gradient(135deg, #FF599E 0%, #2F64A1 100%);
  color: rgb(240, 239, 239);
  padding: 20px;
}
.logo {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 100px;
  background: none;
  border: none;
}
.menu-group {
  margin-bottom: 24px;
}
.menu-group small {
  font-size: 0.75rem;
  font-weight: 600;
  color: #c0d3ff;
  margin-bottom: 8px;
  display: block;
}
.menu-group ul {
  list-style: none;
  padding: 0;
}
.menu-group li {
  margin: 8px 0;
}
.menu-group a {
  color: white;
  text-decoration: none;
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  transition: 0.2s;
}
.menu-group a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}
.menu-group a:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.main {
  flex: 1;
  background: #f5f7fb;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left .page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.admin-avatar {
  width: 36px;
  height: 36px;
    background: linear-gradient(135deg, #EEAECA 0%, #94BBE9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.admin-name {
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 0;
}
</style>
