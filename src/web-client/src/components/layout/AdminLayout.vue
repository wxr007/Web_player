<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sidebarCollapsed = ref(false)

// 侧边栏菜单配置
const menuItems = [
  {
    title: '控制台',
    path: '/admin/dashboard',
    icon: '📊'
  },
  {
    title: '用户管理',
    path: '/admin/users',
    icon: '👥'
  },
  {
    title: '视频管理',
    path: '/admin/videos',
    icon: '🎬'
  },
  {
    title: '订单管理',
    path: '/admin/orders',
    icon: '📋'
  }
]

// 计算当前激活的菜单项
const activePath = computed(() => {
  return route.path
})

// 计算面包屑数据
const breadcrumbs = computed(() => {
  const path = route.path
  const parts = path.split('/').filter(Boolean)
  const crumbs = []
  
  if (parts.length > 0) {
    crumbs.push({ name: '后台管理', path: '/admin' })
    
    if (parts.length > 1) {
      switch (parts[1]) {
        case 'dashboard':
          crumbs.push({ name: '控制台', path: '/admin/dashboard' })
          break
        case 'users':
          crumbs.push({ name: '用户管理', path: '/admin/users' })
          break
        case 'videos':
          crumbs.push({ name: '视频管理', path: '/admin/videos' })
          break
        case 'orders':
          crumbs.push({ name: '订单管理', path: '/admin/orders' })
          break
      }
    }
  }
  
  return crumbs
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 退出登录
const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

onMounted(async () => {
  // 确保用户信息已加载
  if (authStore.isLoggedIn && !authStore.userInfo) {
    await authStore.fetchUserInfo()
  }
  
  // 确保用户已登录且是管理员
  if (!authStore.isLoggedIn || authStore.userInfo?.role !== 'admin') {
    router.push('/')
  }
})
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo">管理后台</h1>
        <button class="collapse-btn" @click="toggleSidebar">
          {{ sidebarCollapsed ? '▶' : '◀' }}
        </button>
      </div>
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'active': activePath.includes(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-title">{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          退出登录
        </button>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部面包屑 -->
      <div class="breadcrumb-header">
        <div class="breadcrumb">
          <router-link to="/admin" class="breadcrumb-item">
            后台管理
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <router-link 
            v-for="(crumb, index) in breadcrumbs.slice(1)" 
            :key="index"
            :to="crumb.path"
            class="breadcrumb-item"
          >
            {{ crumb.name }}
          </router-link>
        </div>
        <div class="header-actions">
          <span class="user-info">
            {{ authStore.userInfo?.username }}
          </span>
        </div>
      </div>
      
      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-page);
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid var(--color-border-light);
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
  
  &.collapsed {
    width: 80px;
    
    .logo, .nav-title, .logout-btn {
      display: none;
    }
  }
  
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--color-border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .logo {
      font-size: 18px;
      font-weight: bold;
      color: var(--color-primary);
      margin: 0;
    }
    
    .collapse-btn {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: var(--color-text);
      padding: 4px;
      border-radius: 4px;
      
      &:hover {
        background: var(--color-bg-page);
      }
    }
  }
  
  .sidebar-nav {
    padding: 20px 0;
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: var(--color-text);
      text-decoration: none;
      transition: all 0.2s;
      
      &:hover {
        background: var(--color-bg-page);
        color: var(--color-primary);
      }
      
      &.active {
        background: rgba(102, 177, 255, 0.1);
        color: var(--color-primary);
        border-right: 3px solid var(--color-primary);
      }
      
      .nav-icon {
        font-size: 18px;
        margin-right: 12px;
        width: 20px;
        text-align: center;
      }
      
      .nav-title {
        font-size: 14px;
      }
    }
  }
  
  .sidebar-footer {
    padding: 20px;
    border-top: 1px solid var(--color-border-light);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    
    .logout-btn {
      width: 100%;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid var(--color-border-light);
      border-radius: var(--border-radius-base);
      cursor: pointer;
      font-size: 14px;
      color: var(--color-text);
      transition: all 0.2s;
      
      &:hover {
        background: #e0e0e0;
        color: #333;
      }
    }
  }
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  
  .sidebar.collapsed + & {
    margin-left: 80px;
  }
  
  /* 面包屑头部 */
  .breadcrumb-header {
    background: #fff;
    border-bottom: 1px solid var(--color-border-light);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .breadcrumb {
      display: flex;
      align-items: center;
      font-size: 14px;
      
      .breadcrumb-item {
        color: var(--color-text);
        text-decoration: none;
        margin-right: 8px;
        
        &:hover {
          color: var(--color-primary);
        }
      }
      
      .breadcrumb-separator {
        color: var(--color-text-light);
        margin-right: 8px;
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      
      .user-info {
        font-size: 14px;
        color: var(--color-text);
      }
    }
  }
  
  /* 页面内容 */
  .page-content {
    padding: 24px;
    min-height: calc(100vh - 60px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &.open {
      transform: translateX(0);
    }
  }
  
  .main-content {
    margin-left: 0;
  }
}
</style>
