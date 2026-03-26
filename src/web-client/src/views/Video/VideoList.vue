<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getVideoList, getRepositories } from '@/api/video'
import type { Video } from '@/types/video'
import type { Repository } from '@/api/video'

// 用户设置存储键
const USER_SETTINGS_KEY = 'videoListSettings'

// 默认设置
const defaultSettings = {
  gridSize: 6 as 4 | 5 | 6,
  sortField: 'createdAt' as 'createdAt' | 'viewCount' | 'title',
  sortOrder: 'asc' as 'asc' | 'desc',
  pageSize: 12,
  selectedRepository: ''
}

// 加载用户设置
const loadUserSettings = () => {
  try {
    const saved = localStorage.getItem(USER_SETTINGS_KEY)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('加载用户设置失败:', e)
  }
  return defaultSettings
}

// 保存用户设置
const saveUserSettings = () => {
  try {
    const settings = {
      gridSize: gridSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      pageSize: pageSize.value,
      selectedRepository: selectedRepository.value
    }
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('保存用户设置失败:', e)
  }
}

const videos = ref<Video[]>([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)

// 从本地存储加载设置
const userSettings = loadUserSettings()

// 排序相关
const sortField = ref<'createdAt' | 'viewCount' | 'title'>(userSettings.sortField)
const sortOrder = ref<'asc' | 'desc'>(userSettings.sortOrder)

// 分页相关
const pageSize = ref(userSettings.pageSize)

// 仓库筛选相关
const repositories = ref<Repository[]>([])
const selectedRepository = ref<string>(userSettings.selectedRepository)

// 缩略图大小
const gridSize = ref<4 | 5 | 6>(userSettings.gridSize)

const handleGridSizeChange = (size: 4 | 5 | 6) => {
  gridSize.value = size
  saveUserSettings()
}

const fetchVideos = async () => {
  loading.value = true
  try {
    const res = await getVideoList({ 
      page: page.value, 
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      repositoryId: selectedRepository.value || undefined
    }) as any
    videos.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchRepositories = async () => {
  try {
    const res = await getRepositories() as any
    repositories.value = res || []
  } catch (error) {
    console.error('获取仓库列表失败:', error)
  }
}

const handleRepositoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedRepository.value = target.value
  page.value = 1
  saveUserSettings()
  fetchVideos()
}

const handleSortFieldChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  sortField.value = target.value as 'createdAt' | 'viewCount' | 'title'
  page.value = 1
  saveUserSettings()
  fetchVideos()
}

const handleSortOrderChange = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  page.value = 1
  saveUserSettings()
  fetchVideos()
}

onMounted(() => {
  fetchRepositories()
  fetchVideos()
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 计算要显示的页码数组
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = page.value
  
  if (total <= 10) {
    // 总页数少于10，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数大于10，显示部分页码
    if (current <= 5) {
      // 当前页在前5页，显示1-10
      for (let i = 1; i <= 10; i++) {
        pages.push(i)
      }
    } else if (current >= total - 4) {
      // 当前页在后5页，显示最后10页
      for (let i = total - 9; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间，显示当前页前后5页
      for (let i = current - 4; i <= current + 5; i++) {
        pages.push(i)
      }
    }
  }
  
  return pages
})

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchVideos()
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  pageSize.value = parseInt(target.value)
  page.value = 1
  saveUserSettings()
  fetchVideos()
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="video-list-page container">
    <!-- 筛选和排序控件 -->
    <div class="controls-bar">
      <!-- 仓库筛选 -->
      <div class="filter-group">
        <label>视频仓库</label>
        <select :value="selectedRepository" @change="handleRepositoryChange" class="filter-select">
          <option value="">全部仓库</option>
          <option v-for="repo in repositories" :key="repo.id" :value="repo.id">{{ repo.name }}</option>
        </select>
      </div>
      
      <!-- 缩略图大小选择 -->
      <div class="view-controls">
        <div class="grid-size-selector">
          <button 
            class="size-btn" 
            :class="{ active: gridSize === 4 }"
            @click="handleGridSizeChange(4)"
            title="大图标"
          >
            <span class="grid-icon large">□</span>
          </button>
          <button 
            class="size-btn" 
            :class="{ active: gridSize === 5 }"
            @click="handleGridSizeChange(5)"
            title="中图标"
          >
            <span class="grid-icon medium">□□</span>
          </button>
          <button 
            class="size-btn" 
            :class="{ active: gridSize === 6 }"
            @click="handleGridSizeChange(6)"
            title="小图标"
          >
            <span class="grid-icon small">□□□</span>
          </button>
        </div>
        
        <!-- 排序控件 -->
        <div class="sort-controls">
          <div class="sort-group">
            <label>排序方式</label>
            <select :value="sortField" @change="handleSortFieldChange" class="sort-select">
              <option value="createdAt">上传时间</option>
              <option value="viewCount">播放量</option>
              <option value="title">标题</option>
            </select>
          </div>
          <button class="sort-order-btn" @click="handleSortOrderChange" :title="sortOrder === 'asc' ? '升序' : '降序'">
            <span v-if="sortOrder === 'asc'">↑ 升序</span>
            <span v-else>↓ 降序</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="video-grid" :class="`grid-${gridSize}`" v-if="!loading && videos.length">
      <router-link 
        v-for="video in videos" 
        :key="video.id" 
        :to="`/video/${video.id}/play`"
        class="video-card"
      >
        <div class="video-cover">
          <img :src="video.coverUrl ? `/api/videos/${video.id}/cover` : '/placeholder.png'" :alt="video.title" />
          <span class="duration">{{ formatDuration(video.duration) }}</span>
          <span class="vip-tag" v-if="video.isVipOnly">VIP</span>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <div class="video-meta">
            <span class="views">{{ video.viewCount }} 次播放</span>
          </div>
        </div>
      </router-link>
    </div>
    
    <div class="empty" v-else-if="!loading">
      <p>暂无视频</p>
    </div>
    
    <div class="loading" v-if="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination" v-if="total > 0">
      <div class="pagination-info">
        共 {{ total }} 条记录，每页 
        <select :value="pageSize" @change="handlePageSizeChange">
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="36">36</option>
          <option :value="48">48</option>
        </select>
        条
      </div>
      <div class="pagination-controls">
        <button 
          class="btn-page btn-prev" 
          :disabled="page === 1"
          @click="handlePageChange(page - 1)"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            class="page-number"
            :class="{ active: pageNum === page }"
            @click="handlePageChange(pageNum as number)"
          >
            {{ pageNum }}
          </button>
        </div>
        
        <button 
          class="btn-page btn-next" 
          :disabled="page >= totalPages"
          @click="handlePageChange(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.video-list-page {
  padding: var(--spacing-lg);
  max-width: 100%;
  margin: 0;
  width: 100%;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px 0;
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
    
    .filter-select {
      padding: 8px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
      min-width: 150px;
      
      &:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      
      &:hover {
        border-color: #c0c4cc;
      }
    }
  }
  
  .view-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .grid-size-selector {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background-color: #f5f7fa;
      border-radius: 4px;
      
      .size-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        background-color: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        
        .grid-icon {
          display: flex;
          gap: 2px;
          font-size: 12px;
          color: #606266;
          
          &.large {
            font-size: 14px;
          }
          
          &.medium {
            font-size: 10px;
            letter-spacing: -2px;
          }
          
          &.small {
            font-size: 8px;
            letter-spacing: -3px;
          }
        }
        
        &:hover {
          background-color: #e4e7ed;
        }
        
        &.active {
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          
          .grid-icon {
            color: var(--color-primary);
            font-weight: bold;
          }
        }
      }
    }
    
    .sort-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .sort-group {
        display: flex;
        align-items: center;
        gap: 8px;
        
        label {
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
        
        .sort-select {
          padding: 8px 12px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
          min-width: 120px;
          
          &:focus {
            outline: none;
            border-color: var(--color-primary);
          }
          
          &:hover {
            border-color: #c0c4cc;
          }
        }
      }
      
      .sort-order-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background-color: white;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background-color: #f5f7fa;
          border-color: #c0c4cc;
        }
        
        &:active {
          background-color: #e4e7ed;
        }
      }
    }
  }
}

.page-header {
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    font-weight: bold;
  }
}

.video-grid {
  display: grid;
  gap: 20px;
  
  // 大图标：一排4个
  &.grid-4 {
    grid-template-columns: repeat(4, 1fr);
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (max-width: 900px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
  
  // 中图标：一排5个
  &.grid-5 {
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: 900px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  // 小图标：一排6个
  &.grid-6 {
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    
    @media (max-width: 1400px) {
      grid-template-columns: repeat(5, 1fr);
    }
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @media (max-width: 900px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

.video-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.video-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .duration {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .vip-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
}

.video-info {
  padding: 12px;
  
  .video-title {
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
  }
  
  .video-meta {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.empty, .loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  
  .pagination-info {
    color: #606266;
    font-size: 14px;
    
    select {
      padding: 6px 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      margin: 0 6px;
      font-size: 14px;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: var(--color-primary);
      }
    }
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .btn-page {
      padding: 8px 16px;
      background-color: transparent;
      color: #4285f4;
      border: none;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        text-decoration: underline;
      }
      
      &:disabled {
        color: #ccc;
        cursor: not-allowed;
        text-decoration: none;
      }
    }
    
    .page-numbers {
      display: flex;
      gap: 4px;
      
      .page-number {
        min-width: 32px;
        height: 32px;
        padding: 0 8px;
        background-color: transparent;
        color: #4285f4;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          text-decoration: underline;
        }
        
        &.active {
          background-color: #4285f4;
          color: white;
          text-decoration: none;
          
          &:hover {
            background-color: #3367d6;
          }
        }
      }
    }
  }
}
</style>
