<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateUserProfile } from '@/api/auth'

const authStore = useAuthStore()
const user = authStore.userInfo

// 默认头像 - 使用内联 SVG
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNCIvPjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+PC9zdmc+'

const editing = ref(false)
const saving = ref(false)
const form = ref({
  username: user?.username || '',
  email: user?.email || '',
  avatar: user?.avatar || ''
})

const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 检查文件大小（限制为 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB')
      return
    }

    // 压缩图片
    const compressImage = (file: File, maxWidth: number = 300, maxHeight: number = 300, quality: number = 0.7) => {
      return new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          // 计算压缩后的尺寸
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // 绘制压缩后的图片
          ctx?.drawImage(img, 0, 0, width, height)

          // 转换为 base64
          const base64 = canvas.toDataURL('image/jpeg', quality)
          console.log('[Debug] 压缩后头像 base64 长度:', base64.length)
          resolve(base64)
        }

        img.src = URL.createObjectURL(file)
      })
    }

    // 压缩并处理图片
    compressImage(file).then((compressedBase64) => {
      form.value.avatar = compressedBase64
      // 立即更新后端
      updateAvatar(compressedBase64)
    })

    // 立即更新头像到后端
    const updateAvatar = async (avatar: string) => {
      try {
        console.log('[Debug] 立即更新头像到后端...')
        const updatedUser = await updateUserProfile({ avatar })
        // 更新 store 中的用户信息
        authStore.userInfo = updatedUser
        console.log('[Debug] 头像更新成功:', updatedUser)
        alert('头像更新成功')
      } catch (error: any) {
        console.error('[Debug] 头像更新失败:', error)
        alert('头像更新失败: ' + (error.message || '请重试'))
      }
    }
  }
}

const saveProfile = async () => {
  saving.value = true
  console.log('[Debug] 开始保存用户资料...')
  console.log('[Debug] 表单数据:', {
    username: form.value.username,
    email: form.value.email
  })

  try {
    console.log('[Debug] 调用 updateUserProfile API...')
    const updatedUser = await updateUserProfile({
      username: form.value.username,
      email: form.value.email
    })
    console.log('[Debug] API 响应:', updatedUser)

    // 更新 store 中的用户信息
    console.log('[Debug] 更新 store 中的用户信息...')
    authStore.userInfo = updatedUser
    console.log('[Debug] Store 更新完成:', authStore.userInfo)

    alert('保存成功')
    editing.value = false
  } catch (error: any) {
    console.error('[Debug] 保存失败:', error)
    console.error('[Debug] 错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    alert('保存失败: ' + (error.response?.data?.message || error.message || '请重试'))
  } finally {
    saving.value = false
    console.log('[Debug] 保存流程结束')
  }
}
</script>

<template>
  <div class="profile-page container">
    <h1>个人资料</h1>
    
    <div class="profile-card">
      <div class="avatar-section">
        <img :src="form.avatar || defaultAvatar" 
             alt="avatar" 
             class="avatar" 
             @error="$event.target.src = defaultAvatar" />
        <input 
          ref="fileInput"
          type="file" 
          accept="image/*" 
          style="display: none"
          @change="handleFileChange"
        />
        <button class="btn-change-avatar" @click="triggerFileInput">更换头像</button>
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
            <button @click="saveProfile" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button @click="editing = false" class="btn-default" :disabled="saving">取消</button>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }

  .btn-change-avatar {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-base);
    background: #fff;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;

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