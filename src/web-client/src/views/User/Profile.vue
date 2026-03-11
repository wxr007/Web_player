<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = authStore.userInfo

const editing = ref(false)
const form = ref({
  username: user?.username || '',
  email: user?.email || '',
  avatar: user?.avatar || ''
})

const saveProfile = async () => {
  editing.value = false
}
</script>

<template>
  <div class="profile-page container">
    <h1>个人资料</h1>
    
    <div class="profile-card">
      <div class="avatar-section">
        <img :src="form.avatar || '/default-avatar.png'" alt="avatar" class="avatar" />
        <button class="btn-change-avatar">更换头像</button>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <label>用户名</label>
          <input v-model="form.username" :disabled="!editing" />
        </div>
        
        <div class="info-item">
          <label>邮箱</label>
          <input v-model="form.email" :disabled="!editing" />
        </div>
        
        <div class="info-item">
          <label>会员状态</label>
          <span class="vip-status" :class="{ active: authStore.isVip }">
            {{ authStore.isVip ? 'VIP会员' : '普通用户' }}
          </span>
        </div>
        
        <div class="actions">
          <button v-if="!editing" @click="editing = true" class="btn-primary">编辑资料</button>
          <template v-else>
            <button @click="saveProfile" class="btn-primary">保存</button>
            <button @click="editing = false" class="btn-default">取消</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  padding: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    margin-bottom: var(--spacing-lg);
  }
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  display: flex;
  gap: 40px;
  max-width: 600px;
}

.avatar-section {
  text-align: center;
  
  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 16px;
  }
  
  .btn-change-avatar {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-base);
    background: #fff;
    font-size: 14px;
    cursor: pointer;
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}

.info-section {
  flex: 1;
  
  .info-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }
    
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-base);
      font-size: 14px;
      
      &:disabled {
        background: var(--color-bg-page);
        color: var(--color-text);
      }
    }
    
    .vip-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      background: var(--color-bg-page);
      color: var(--color-text-secondary);
      
      &.active {
        background: linear-gradient(135deg, #ffd700, #ff8c00);
        color: #fff;
      }
    }
  }
  
  .actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    
    button {
      padding: 10px 24px;
      border-radius: var(--border-radius-base);
      font-size: 14px;
      cursor: pointer;
    }
    
    .btn-primary {
      background: var(--color-primary);
      color: #fff;
      border: none;
      
      &:hover {
        background: #66b1ff;
      }
    }
    
    .btn-default {
      background: #fff;
      border: 1px solid var(--color-border);
      
      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    }
  }
}
</style>
