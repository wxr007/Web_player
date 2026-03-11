<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    error.value = '请填写用户名和密码'
    return
  }
  
  error.value = ''
  loading.value = true
  
  try {
    await authStore.login(form.value.username, form.value.password)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>登录</h1>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-item">
          <label>用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        
        <div class="form-item">
          <label>密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>
        
        <div class="error-msg" v-if="error">{{ error }}</div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="auth-footer">
        还没有账号？<router-link to="/auth/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
  padding: 20px;
}

.auth-card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
  
  h1 {
    font-size: 24px;
    text-align: center;
    margin-bottom: 32px;
  }
}

.auth-form {
  .form-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--color-text);
    }
    
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-base);
      font-size: 14px;
      transition: border-color 0.2s;
      
      &:focus {
        border-color: var(--color-primary);
      }
    }
  }
  
  .error-msg {
    color: var(--color-danger);
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
  }
  
  .btn-primary {
    width: 100%;
    padding: 12px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--border-radius-base);
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover:not(:disabled) {
      background: #66b1ff;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
