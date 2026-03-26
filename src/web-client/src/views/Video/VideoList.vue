<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
</style>
