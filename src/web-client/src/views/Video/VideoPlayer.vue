<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getVideoDetail, getVideoSubtitles, getVideoPlayUrl } from '@/api/video'
import type { Video, Subtitle } from '@/types/video'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

const route = useRoute()
const videoId = route.params.id as string

const videoRef = ref<HTMLVideoElement>()
const player = ref<any>(null)
const video = ref<Video | null>(null)
const subtitles = ref<Subtitle[]>([])
const currentSubtitle = ref<Subtitle | null>(null)
const loading = ref(true)
const error = ref('')

const initPlayer = async () => {
  if (!videoRef.value) return
  
  try {
    const [videoRes, subtitleRes] = await Promise.all([
      getVideoDetail(videoId) as unknown as Promise<Video>,
      getVideoSubtitles(videoId) as unknown as Promise<Subtitle[]>
    ])
    
    video.value = videoRes
    subtitles.value = subtitleRes || []
    
    const playRes = await getVideoPlayUrl(videoId) as unknown as { url: string }
    
    const tracks = subtitleRes.map((s: Subtitle) => ({
      kind: 'subtitles' as const,
      srclang: s.language,
      label: s.name,
      src: (s as any).url || '',
      default: s.isDefault
    }))
    
    player.value = videojs(videoRef.value, {
      controls: true,
      fluid: true,
      sources: [{
        src: playRes.url,
        type: 'application/x-mpegURL'
      }],
      tracks
    })
    
    if (subtitleRes.length > 0) {
      const defaultSub = subtitleRes.find((s: Subtitle) => s.isDefault) || subtitleRes[0]
      currentSubtitle.value = defaultSub || null
    }
  } catch (err: any) {
    error.value = err.message || '加载视频失败'
  } finally {
    loading.value = false
  }
}

const changeSubtitle = async (subtitle: Subtitle) => {
  currentSubtitle.value = subtitle
  const enabledTrack = player.value?.textTracks()?.getTrackByLanguage(subtitle.language)
  if (enabledTrack) {
    enabledTrack.mode = 'showing'
  }
}

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  player.value?.dispose()
})
</script>

<template>
  <div class="video-player-page">
    <div class="player-container" v-if="!loading">
      <div class="video-wrapper" v-if="!error">
        <video ref="videoRef" class="video-js"></video>
      </div>
      <div class="error" v-else>
        <p>{{ error }}</p>
      </div>
    </div>
    
    <div class="video-info container" v-if="video">
      <h1>{{ video.title }}</h1>
      <p>{{ video.description }}</p>
      
      <div class="subtitle-selector" v-if="subtitles.length > 0">
        <span>字幕:</span>
        <select @change="(e) => {
          const sub = subtitles.find(s => s.id === (e.target as HTMLSelectElement).value)
          if (sub) changeSubtitle(sub)
        }">
          <option value="">关闭</option>
          <option 
            v-for="sub in subtitles" 
            :key="sub.id" 
            :value="sub.id"
            :selected="currentSubtitle?.id === sub.id"
          >
            {{ sub.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="loading" v-if="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.video-player-page {
  min-height: calc(100vh - var(--header-height));
  background: #000;
}

.player-container {
  max-width: 1000px;
  margin: 0 auto;
}

.video-wrapper {
  aspect-ratio: 16 / 9;
}

.error {
  color: #fff;
  text-align: center;
  padding: 60px;
}

.video-info {
  padding: 20px;
  background: #fff;
  
  h1 {
    font-size: 24px;
    margin-bottom: 12px;
  }
  
  .subtitle-selector {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    select {
      padding: 6px 12px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
    }
  }
}

.loading {
  color: #fff;
  text-align: center;
  padding: 60px;
}
</style>
