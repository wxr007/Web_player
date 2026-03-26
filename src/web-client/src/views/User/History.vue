<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getWatchHistory, updateWatchProgress, clearWatchHistory, deleteWatchHistoryItem } from '@/api/video'
import type { Video } from '@/types/video'

interface HistoryVideo extends Video {
  progress: number
  lastWatch: string
}

const videos = ref<HistoryVideo[]>([])
const loading = ref(true)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await getWatchHistory({ page: page.value, pageSize: pageSize.value }) as any
    videos.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (videoId: string, event: Event) => {
  event.preventDefault()
  event.stopPropagation()

  if (!confirm('确定要删除这条观看记录吗？')) {
    return
  }

  try {
    await deleteWatchHistoryItem(videoId)
    videos.value = videos.value.filter(v => v.id !== videoId)
    total.value--
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

const handleClearAll = async () => {
  if (!confirm('确定要清空所有观看历史吗？')) {
    return
  }

  try {
    await clearWatchHistory()
    videos.value = []
    total.value = 0
  } catch (error) {
    console.error('清空失败:', error)
    alert('清空失败')
  }
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

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }
  
  return date.toLocaleDateString('zh-CN')
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchHistory()
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="history-page container">
    <div class="page-header">
      <h1>观看历史</h1>
      <button v-if="videos.length > 0" class="btn-clear" @click="handleClearAll">
        清空历史
      </button>
    </div>
    
    <div class="history-list" v-if="!loading && videos.length">
      <router-link 
        v-for="video in videos" 
        :key="video.id" 
        :to="`/video/${video.id}/play`"
        class="history-item"
      >
        <div class="cover-wrapper">
          <img :src="video.coverUrl ? `/api/videos/${video.id}/cover` : '/placeholder.png'" :alt="video.title" class="cover" />
          <span class="duration">{{ formatDuration(video.duration) }}</span>
          <div v-if="video.progress > 0 && video.progress < video.duration" class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(video.progress / video.duration) * 100}%` }"></div>
          </div>
          <span v-if="video.progress > 0 && video.progress >= video.duration" class="watched-badge">已看完</span>
        </div>
        <div class="info">
          <h3>{{ video.title }}</h3>
          <p class="meta">
            <span class="view-count">{{ video.viewCount }} 次播放</span>
            <span class="separator">·</span>
            <span class="last-watch">{{ formatTime(video.lastWatch) }}</span>
          </p>
          <p v-if="video.progress > 0 && video.progress < video.duration" class="progress-text">
            观看到 {{ formatDuration(video.progress) }}
          </p>
        </div>
        <button class="btn-delete" @click="handleDelete(video.id, $event)" title="删除记录">
          ×
        </button>
      </router-link>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="!loading && videos.length && totalPages > 1">
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
    
    <div class="empty" v-if="!loading && videos.length === 0">
      <p>暂无观看历史</p>
      <router-link to="/video" class="btn-browse">去浏览视频</router-link>
    </div>
    
    <div class="loading" v-if="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.history-page {
  padding: var(--spacing-lg);
  max-width: 100%;
  margin: 0;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    font-weight: bold;
  }
  
  .btn-clear {
    padding: 8px 16px;
    background-color: transparent;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    color: #606266;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      color: #f56c6c;
      border-color: #f56c6c;
    }
  }
}

.history-list {
  display: grid;
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

  .history-item {
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      .btn-delete {
        opacity: 1;
      }
    }

    .cover-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;

      .cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }

      &:hover .cover {
        transform: scale(1.05);
      }

      .duration {
        position: absolute;
        bottom: 8px;
        right: 8px;
        padding: 2px 6px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 12px;
        border-radius: 2px;
      }

      .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.3);

        .progress-fill {
          height: 100%;
          background-color: var(--color-primary);
          transition: width 0.3s;
        }
      }

      .watched-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 2px 8px;
        background-color: var(--color-primary);
        color: white;
        font-size: 11px;
        border-radius: 2px;
      }
    }

    .info {
      padding: 12px;
      flex: 1;
      display: flex;
      flex-direction: column;

      h3 {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        min-height: 40px;
      }

      .meta {
        font-size: 12px;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .separator {
          color: #dcdfe6;
        }

        .last-watch {
          color: #909399;
        }
      }

      .progress-text {
        font-size: 12px;
        color: var(--color-primary);
        margin-top: 4px;
      }
    }

    .btn-delete {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;

      &:hover {
        background-color: #f56c6c;
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px 0;
  
  .btn-page {
    padding: 8px 16px;
    background-color: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    color: #606266;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      background-color: #e4e7ed;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-info {
    color: #606266;
    font-size: 14px;
  }
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-secondary);
  
  p {
    font-size: 16px;
    margin-bottom: 20px;
  }
  
  .btn-browse {
    display: inline-block;
    padding: 10px 24px;
    background-color: var(--color-primary);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 14px;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--color-primary-dark);
    }
  }
}

.loading {
  text-align: center;
  padding: 60px;
  color: var(--color-text-secondary);
}
</style>
