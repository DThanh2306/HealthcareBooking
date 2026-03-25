import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import HospitalDetail from '../views/HospitalDetail.vue';
import AdminPage from '../views/AdminPage.vue';
import AdminLayout from '@/components/AdminLayout.vue';
import EditForm from '@/views/EditForm.vue';
import DoctorDetail from '@/views/DoctorDetail.vue';
import BookingForm from '@/views/BookingForm.vue';
import MainLayout from '@/components/MainLayout.vue';
import AuthView from '@/views/AuthView.vue';
import MyAppointments from '@/views/MyAppointments.vue';
import DoctorAppointments from '@/views/DoctorAppointments.vue';

const isLoggedIn = () => {
  return !!localStorage.getItem('userToken');
};

const routes = [
  { path: '/auth', name: 'auth', component: AuthView },

  {
    path: '/',
    name: 'homepage',
    component: HomePage
  },

  {
    path: '/mainlayout',
    component: MainLayout,
    children: [
      {
        path: '/doctor/:dr_id',
        name: 'doctordetail',
        component: DoctorDetail
      },
      {
        path: '/hospital/:h_id',
        component: HospitalDetail
      },
    

      {
        path: '/doctor/:dr_id/booking',
        name: 'bookingform',
        component: BookingForm
      },
      {
        path: '/myappointment',
        name: 'myappointment',
        component: MyAppointments
      },
      {
        path: '/doctor/appointments',
        name: 'doctor-appointments',
        component: DoctorAppointments
      },

      {
        path: '/listdoctor',
        name: 'listdoctor',
        component: () => import('@/views/ListDoctor.vue')
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('@/views/SearchPage.vue')
      },
      {
        path: '/my',
        name: 'my',
        component: () => import('@/views/ProfileUser.vue')
      },
      {
        path: '/ai-doctor',
        name: 'ai-doctor',
        component: () => import('@/views/AIDoctorChat.vue')
      },
      {
        path: '/specialties',
        name: 'specialties',
        component: () => import('@/views/SpecialtyPage.vue')
      },
      {
        path: '/hospitals',
        name: 'hospitals',
        component: () => import('@/views/HospitalPage.vue')
      }
    ]
  },

  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'adminpage',
        component: AdminPage
      },

      {
        path: 'create/:id',
        name: 'editform',
        component: EditForm
      },
      {
        path: 'overview',
        name: 'adminoverview',
        component: () => import('@/views/AdminOverview.vue')
      },

      {
        path: 'doctors',
        name: 'admindoctor',
        component: () => import('@/views/AdminDoctor.vue')
      },
      {
        path: 'users',
        name: 'adminusers',
        component: () => import('@/views/AdminUsers.vue')
      },

      {
        path: 'doctors/:dr_id',
        name: 'editdoctor',
        component: () => import('@/views/EditDoctorForm.vue')
      },
      {
        path: 'clinics',
        name: 'adminclinics',
        component: () => import('@/views/AdminClinics.vue')
      },
      {
        path: 'feedbacks',
        name: 'adminfeedbacks',
        component: () => import('@/views/AdminFeedbacks.vue')
      },
      {
        path: 'geo-tools',
        name: 'admingeotools',
        component: () => import('@/views/AdminGeoTools.vue')
      },
      {
        path: 'specialties',
        name: 'adminspecialties',
        component: () => import('@/views/AdminSpecialties.vue')
      },

      // 🔥 Tách riêng các tab appointments theo status
      {
        path: 'appointments/:status',
        name: 'AdminAppointmentsStatus',
        component: () => import('@/views/AdminAppointments.vue'),
        props: true
      },

      // Redirect mặc định khi truy cập /admin/appointments
      {
        path: 'appointments',
        redirect: '/admin/appointments/pending'
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Nếu có savedPosition (khi dùng nút back/forward), sử dụng vị trí đó
    if (savedPosition) {
      return savedPosition;
    }
    // Nếu có hash anchor (#section), scroll tới vị trí đó
    if (to.hash) {
      return { el: to.hash };
    }
    // Mặc định scroll về đầu trang ngay lập tức
    return { top: 0 };
  }
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('userToken');
  const role = token ? JSON.parse(atob(token.split('.')[1])).role : null;

  if (to.path.startsWith('/admin') && role !== 'admin') {
    next('/auth');
  } else if (to.path.startsWith('/doctor/appointments') && role !== 'doctor') {
    next('/auth');
  } else if (to.path === '/myappointment' && role === 'doctor') {
    next('/doctor/appointments');
  } else {
    next();
  }
});

export default router;
