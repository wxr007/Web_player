<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { User } from '@/types/user'

// 定义类型
interface UserListResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
}

// 状态管理
const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const searchKeyword = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 编辑用户对话框
const editDialogVisible = ref(false)
const currentUser = ref<User | null>(null)

// 计算属性
const currentPage = computed(() => page.value)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 显示消息
const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// API 调用
const getUsers = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/admin/users?page=${page.value}&pageSize=${pageSize.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    
    const data: UserListResponse = await response.json()
    users.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('Error fetching users:', error)
    showMessage('获取用户列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const updateUser = async (user: User) => {
  loading.value = true
  try {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update user')
    }
    
    showMessage('用户信息更新成功', 'success')
    await getUsers()
    editDialogVisible.value = false
  } catch (error) {
    console.error('Error updating user:', error)
    showMessage('更新用户信息失败', 'error')
  } finally {
    loading.value = false
  }
}

const deleteUser = async (userId: string) => {
  if (!confirm('确定要删除该用户吗？此操作不可恢复！')) {
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
    
    showMessage('用户删除成功', 'success')
    await getUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    showMessage('删除用户失败', 'error')
  } finally {
    loading.value = false
  }
}

const setVipStatus = async (userId: string, isVip: boolean) => {
  loading.value = true
  try {
    const response = await fetch(`/api/admin/users/${userId}/vip`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isVip,
        expireAt: isVip ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update VIP status')
    }
    
    showMessage(isVip ? '设置VIP成功' : '取消VIP成功', 'success')
    await getUsers()
  } catch (error) {
    console.error('Error updating VIP status:', error)
    showMessage('更新VIP状态失败', 'error')
  } finally {
    loading.value = false
  }
}

// 事件处理
const handleEdit = (user: User) => {
  currentUser.value = { ...user }
  editDialogVisible.value = true
}

const handleDelete = (userId: string) => {
  deleteUser(userId)
}

const handleVipToggle = (userId: string, currentVip: boolean) => {
  setVipStatus(userId, !currentVip)
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  getUsers()
}

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  pageSize.value = parseInt(target.value)
  page.value = 1
  getUsers()
}

const handleSearch = () => {
  page.value = 1
  getUsers()
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  currentUser.value = null
}

// 初始化
onMounted(() => {
  getUsers()
})
</script>

<template>
  <div class="user-manage-page container">
    <h1>用户管理</h1>
    
    <!-- 消息提示 -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
    
    <!-- 搜索和操作栏 -->
    <div class="user-manage-header">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索用户名或邮箱"
          class="search-input"
        />
        <button class="btn-primary" @click="handleSearch">搜索</button>
      </div>
    </div>
    
    <!-- 用户列表 -->
    <div class="user-list">
      <div v-if="loading" class="loading">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>用户ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>VIP到期时间</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="{ 'vip-tag': user.role === 'vip' }">
                {{ user.role === 'vip' ? 'VIP' : '普通用户' }}
              </span>
            </td>
            <td>{{ user.vipExpireAt ? new Date(user.vipExpireAt).toLocaleString() : '无' }}</td>
            <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
            <td>
              <button class="btn-secondary" @click="handleEdit(user)">编辑</button>
              <button class="btn-danger" @click="handleDelete(user.id)">删除</button>
              <button 
                :class="user.role === 'vip' ? 'btn-warning' : 'btn-success'"
                @click="handleVipToggle(user.id, user.role === 'vip')"
              >
                {{ user.role === 'vip' ? '取消VIP' : '设置VIP' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination-info">
        共 {{ total }} 条记录，每页 
        <select :value="pageSize" @change="handlePageSizeChange">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        条
      </div>
      <div class="pagination-controls">
        <button 
          class="btn-page" 
          :disabled="page === 1"
          @click="handlePageChange(page - 1)"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button 
          class="btn-page" 
          :disabled="page >= totalPages"
          @click="handlePageChange(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
    
    <!-- 编辑用户对话框 -->
    <div v-if="editDialogVisible" class="modal-overlay" @click="closeEditDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户信息</h3>
          <button class="btn-close" @click="closeEditDialog">&times;</button>
        </div>
        <div v-if="currentUser" class="edit-form">
          <div class="form-item">
            <label>用户名</label>
            <input v-model="currentUser.username" type="text" class="form-input" />
          </div>
          <div class="form-item">
            <label>邮箱</label>
            <input v-model="currentUser.email" type="email" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditDialog">取消</button>
          <button class="btn-primary" @click="currentUser && updateUser(currentUser)">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-manage-page {
  padding: 20px 0;
  
  h1 {
    margin-bottom: 24px;
    color: var(--color-text-primary);
  }
  
  .message {
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 4px;
    font-size: 14px;
    
    &.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    &.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  }
  
  .user-manage-header {
    margin-bottom: 20px;
    
    .search-box {
      display: flex;
      gap: 10px;
      
      .search-input {
        flex: 1;
        max-width: 300px;
        padding: 8px 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        
        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }
    }
  }
  
  .user-list {
    margin-bottom: 20px;
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid #ebeef5;
      }
      
      th {
        background-color: #f5f7fa;
        font-weight: 600;
        color: #606266;
      }
      
      tbody tr:hover {
        background-color: #f5f7fa;
      }
      
      .vip-tag {
        display: inline-block;
        padding: 2px 8px;
        background-color: #f0ad4e;
        color: white;
        border-radius: 10px;
        font-size: 12px;
      }
    }
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    
    .pagination-info {
      color: #606266;
      font-size: 14px;
      
      select {
        padding: 4px 8px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        margin: 0 4px;
      }
    }
    
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .page-info {
        color: #606266;
        font-size: 14px;
      }
    }
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ebeef5;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
      
      .btn-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #909399;
        
        &:hover {
          color: #606266;
        }
      }
    }
    
    .edit-form {
      padding: 20px;
      
      .form-item {
        margin-bottom: 16px;
        
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #606266;
        }
        
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          
          &:focus {
            outline: none;
            border-color: var(--color-primary);
          }
        }
      }
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #ebeef5;
    }
  }
  
  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-success,
  .btn-warning,
  .btn-page {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin-right: 8px;
    
    &:last-child {
      margin-right: 0;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .btn-primary {
    background-color: var(--color-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #5a6268;
    }
  }
  
  .btn-danger {
    background-color: #dc3545;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #c82333;
    }
  }
  
  .btn-success {
    background-color: #28a745;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #218838;
    }
  }
  
  .btn-warning {
    background-color: #ffc107;
    color: #212529;
    
    &:hover:not(:disabled) {
      background-color: #e0a800;
    }
  }
  
  .btn-page {
    background-color: #f5f7fa;
    color: #606266;
    border: 1px solid #dcdfe6;
    
    &:hover:not(:disabled) {
      background-color: #e4e7ed;
    }
  }
}
</style>