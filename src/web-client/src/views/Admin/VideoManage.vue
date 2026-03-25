<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createRepository, getRepositories, deleteRepository, scanRepository } from '@/api/repository'
import type { VideoRepository } from '@/types/repository'
import { RepositoryStatus } from '@/types/repository'

const repositories = ref<VideoRepository[]>([])
const loading = ref(false)
const scanningRepositories = ref<Set<string>>(new Set())
const showAddModal = ref(false)
const newRepository = ref({ name: '', path: '' })
const error = ref('')
const success = ref('')

const fetchRepositories = async () => {
  loading.value = true
  try {
    const res = await getRepositories()
    repositories.value = res
  } catch (err: any) {
    error.value = err.message || '获取仓库列表失败'
  } finally {
    loading.value = false
  }
}

const handleAddRepository = async () => {
  if (!newRepository.value.name || !newRepository.value.path) {
    error.value = '请填写仓库名称和路径'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await createRepository(newRepository.value)
    success.value = '仓库创建成功'
    showAddModal.value = false
    newRepository.value = { name: '', path: '' }
    await fetchRepositories()
  } catch (err: any) {
    error.value = err.message || '创建仓库失败'
  } finally {
    loading.value = false
  }
}

const handleDeleteRepository = async (id: string) => {
  if (!confirm('确定要删除这个仓库吗？删除后仓库内的所有视频也会被删除。')) {
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await deleteRepository(id)
    success.value = '仓库删除成功'
    await fetchRepositories()
  } catch (err: any) {
    error.value = err.message || '删除仓库失败'
  } finally {
    loading.value = false
  }
}

const handleScanRepository = async (id: string) => {
  scanningRepositories.value.add(id)
  error.value = ''
  success.value = ''

  try {
    const res = await scanRepository(id)
    success.value = `扫描完成：新增 ${res.added} 个视频，更新 ${res.updated} 个视频，总计 ${res.total} 个视频`
    await fetchRepositories()
  } catch (err: any) {
    error.value = err.message || '扫描仓库失败'
  } finally {
    scanningRepositories.value.delete(id)
  }
}

const getStatusText = (status: RepositoryStatus) => {
  const statusMap = {
    [RepositoryStatus.IDLE]: '空闲',
    [RepositoryStatus.SCANNING]: '扫描中',
    [RepositoryStatus.ERROR]: '错误',
    [RepositoryStatus.COMPLETED]: '已完成'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: RepositoryStatus) => {
  const classMap = {
    [RepositoryStatus.IDLE]: 'status-idle',
    [RepositoryStatus.SCANNING]: 'status-scanning',
    [RepositoryStatus.ERROR]: 'status-error',
    [RepositoryStatus.COMPLETED]: 'status-completed'
  }
  return classMap[status] || ''
}

onMounted(() => {
  fetchRepositories()
})
</script>

<template>
  <div class="admin-videos">
    <div class="page-header">
      <h2>视频仓库管理</h2>
      <button class="btn-primary" @click="showAddModal = true">
        添加视频仓库
      </button>
    </div>

    <!-- 消息提示 -->
    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="success" class="message success">{{ success }}</div>

    <!-- 添加仓库模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <h3>添加视频仓库</h3>
        <form @submit.prevent="handleAddRepository">
          <div class="form-item">
            <label>仓库名称</label>
            <input 
              v-model="newRepository.name" 
              type="text" 
              placeholder="请输入仓库名称"
              required
            />
          </div>
          <div class="form-item">
            <label>服务器路径</label>
            <input 
              v-model="newRepository.path" 
              type="text" 
              placeholder="请输入服务器上的视频目录路径"
              required
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showAddModal = false">
              取消
            </button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 仓库列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="repository-list">
      <div v-if="repositories.length === 0" class="empty-state">
        <p>暂无视频仓库，点击上方按钮添加</p>
      </div>
      <div v-else class="repository-grid">
        <div v-for="repo in repositories" :key="repo.id" class="repository-card">
          <div class="repository-header">
            <h3>{{ repo.name }}</h3>
            <div class="repository-actions">
              <button 
                class="btn-secondary" 
                @click="handleScanRepository(repo.id)"
                :disabled="scanningRepositories.has(repo.id) || repo.status === RepositoryStatus.SCANNING"
              >
                {{ scanningRepositories.has(repo.id) || repo.status === RepositoryStatus.SCANNING ? '扫描中...' : '扫描' }}
              </button>
              <button class="btn-danger" @click="handleDeleteRepository(repo.id)">
                删除
              </button>
            </div>
          </div>
          <div class="repository-info">
            <div class="info-item">
              <span class="label">路径：</span>
              <span class="value">{{ repo.path }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态：</span>
              <span :class="['status', getStatusClass(repo.status)]">
                {{ getStatusText(repo.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">视频数量：</span>
              <span class="value">{{ repo.videoCount }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后扫描：</span>
              <span class="value">
                {{ repo.lastScanAt ? new Date(repo.lastScanAt).toLocaleString() : '从未扫描' }}
              </span>
            </div>
            <div v-if="repo.errorMessage" class="info-item error">
              <span class="label">错误信息：</span>
              <span class="value">{{ repo.errorMessage }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-videos {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      color: var(--color-text);
    }
  }

  .message {
    padding: 12px;
    border-radius: var(--border-radius-base);
    margin-bottom: 16px;
    font-size: 14px;
    
    &.error {
      background: rgba(255, 76, 76, 0.1);
      color: var(--color-danger);
      border: 1px solid rgba(255, 76, 76, 0.3);
    }
    
    &.success {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #fff;
    padding: 24px;
    border-radius: var(--border-radius-base);
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: var(--color-text);
    }
    
    .form-item {
      margin-bottom: 16px;
      
      label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--color-text);
      }
      
      input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-base);
        font-size: 14px;
        transition: border-color 0.2s;
        
        &:focus {
          border-color: var(--color-primary);
          outline: none;
        }
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-text-secondary);
    background: #f9f9f9;
    border-radius: var(--border-radius-base);
  }

  .repository-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }

  .repository-card {
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-base);
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    
    .repository-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        font-size: 16px;
        color: var(--color-text);
      }
      
      .repository-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .repository-info {
      .info-item {
        margin-bottom: 8px;
        font-size: 14px;
        
        .label {
          display: inline-block;
          width: 80px;
          color: var(--color-text-secondary);
        }
        
        .value {
          color: var(--color-text);
        }
        
        &.error {
          .value {
            color: var(--color-danger);
          }
        }
      }
      
      .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        
        &.status-idle {
          background: rgba(102, 177, 255, 0.1);
          color: var(--color-primary);
        }
        
        &.status-scanning {
          background: rgba(255, 193, 7, 0.1);
          color: #ff9800;
        }
        
        &.status-error {
          background: rgba(255, 76, 76, 0.1);
          color: var(--color-danger);
        }
        
        &.status-completed {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }
      }
    }
  }
}
</style>
