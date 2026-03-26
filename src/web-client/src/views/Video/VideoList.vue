<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getVideoList } from '@/api/video'
import type { Video } from '@/types/video'

const videos = ref<Video[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const fetchVideos = async () => {
  loading.value = true
  try {
    const res = await getVideoList({ page: page.value, pageSize: pageSize.value }) as any
    videos.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
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
    
    <div class="video-grid" v-if="!loading && videos.length">
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

.page-header {
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    font-weight: bold;
  }
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
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
