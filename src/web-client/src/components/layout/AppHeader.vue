<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)

// 默认头像 - 使用内联 SVG
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+PC9zdmc+'

const isLoggedIn = computed(() => authStore.isLoggedIn)
const userInfo = computed(() => authStore.userInfo)

const handleLogout = () => {
  authStore.logout()
  router.push('/')
  showDropdown.value = false
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <router-link to="/" class="logo">
        <span class="logo-text">VideoSite</span>
      </router-link>
      
      <nav class="nav">
        <router-link to="/video" class="nav-link">视频</router-link>
      </nav>
      
      <div class="header-right">
        <template v-if="isLoggedIn">
          <router-link to="/user/subscription" class="vip-badge" v-if="authStore.isVip">
            VIP
          </router-link>
          <div class="user-menu" @click="toggleDropdown">
            <img :src="userInfo?.avatar || defaultAvatar" alt="avatar" class="avatar" @error="$event.target.src = defaultAvatar" />
            <span class="username">{{ userInfo?.username }}</span>
            <div class="dropdown" v-if="showDropdown" @click.stop>
              <div class="dropdown-item" @click="router.push('/user/profile'); closeDropdown()">个人资料</div>
              <div class="dropdown-item" @click="router.push('/user/history'); closeDropdown()">观看历史</div>
              <div class="dropdown-item" @click="router.push('/user/subscription'); closeDropdown()">会员订阅</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" @click="handleLogout">退出登录</div>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/auth/login" class="btn btn-ghost">登录</router-link>
          <router-link to="/auth/register" class="btn btn-primary">注册</router-link>
        </template>
      </div>
    </div>
  </header>
  <div class="dropdown-overlay" v-if="showDropdown" @click="closeDropdown"></div>
</template>

<style scoped lang="scss">
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--color-border-light);
  z-index: 1000;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
}

.logo {
  text-decoration: none;
  
  .logo-text {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-primary);
  }
}

.nav {
  flex: 1;
  margin-left: var(--spacing-xl);
  display: flex;
  gap: var(--spacing-lg);
  
  .nav-link {
    color: var(--color-text);
    text-decoration: none;
    font-size: 14px;
    
    &:hover, &.router-link-active {
      color: var(--color-primary);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .username {
    font-size: 14px;
  }
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-base);
  
  &:hover {
    background: var(--color-bg-page);
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .username {
    font-size: 14px;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-base);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    z-index: 1001;
    
    .dropdown-item {
      padding: 10px 16px;
      font-size: 14px;
      cursor: pointer;
      
      &:hover {
        background: var(--color-bg-page);
      }
    }
    
    .dropdown-divider {
      height: 1px;
      background: var(--color-border-light);
      margin: 4px 0;
    }
  }
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--border-radius-base);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  
  &-primary {
    background: var(--color-primary);
    color: #fff;
    
    &:hover {
      background: #66b1ff;
    }
  }
  
  &-ghost {
    color: var(--color-text);
    
    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>
