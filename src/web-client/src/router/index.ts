import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue')
  },
  {
    path: '/video',
    children: [
      {
        path: '',
        name: 'VideoList',
        component: () => import('@/views/Video/VideoList.vue')
      },
      {
        path: ':id',
        name: 'VideoDetail',
        component: () => import('@/views/Video/VideoDetail.vue')
      },
      {
        path: ':id/play',
        name: 'VideoPlayer',
        component: () => import('@/views/Video/VideoPlayer.vue')
      }
    ]
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/Auth/Login.vue')
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/Auth/Register.vue')
      }
    ]
  },
  {
    path: '/user',
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue')
      },
      {
        path: 'subscription',
        name: 'Subscription',
        component: () => import('@/views/User/Subscription.vue')
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/User/History.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard.vue')
      },
      {
        path: 'dashboard',
        name: 'AdminDashboardRedirect',
        redirect: '/admin'
      },
      {
        path: 'videos',
        name: 'VideoManage',
        component: () => import('@/views/Admin/VideoManage.vue')
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/Admin/UserManage.vue')
      },
      {
        path: 'orders',
        name: 'OrderManage',
        component: () => import('@/views/Admin/OrderManage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
