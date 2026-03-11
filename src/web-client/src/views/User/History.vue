<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getWatchHistory } from '@/api/video'
import type { Video } from '@/types/video'

const videos = ref<Video[]>([])
const loading = ref(true)

const fetchHistory = async () => {
  try {
    const res = await getWatchHistory() as any
    videos.value = res.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="history-page container">
    <h1>观看历史</h1>
    
    <div class="history-list" v-if="!loading && videos.length">
      <router-link 
        v-for="video in videos" 
        :key="video.id" 
        :to="`/video/${video.id}`"
        class="history-item"
      >
        <img :src="video.coverUrl || '/placeholder.png'" :alt="video.title" class="cover" />
        <div class="info">
          <h3>{{ video.title }}</h3>
          <p class="meta">{{ video.viewCount }} 次播放</p>
        </div>
      </router-link>
    </div>
    
    <div class="empty" v-else-if="!loading">
      <p>暂无观看历史</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.history-page {
  padding: var(--spacing-lg);
  
  h1 {
    font-size: 24px;
    margin-bottom: var(--spacing-lg);
  }
}

.history-list {
  .history-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 12px;
    text-decoration: none;
    color: inherit;
    transition: background 0.2s;
    
    &:hover {
      background: var(--color-bg-page);
    }
    
    .cover {
      width: 160px;
      height: 90px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      h3 {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .meta {
        font-size: 14px;
        color: var(--color-text-secondary);
      }
    }
  }
}

.empty {
  text-align: center;
  padding: 60px;
  color: var(--color-text-secondary);
}
</style>
