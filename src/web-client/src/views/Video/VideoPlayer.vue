<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getVideoDetail, getVideoSubtitles, getVideoPlayUrl } from '@/api/video'
import type { Video, Subtitle } from '@/types/video'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

console.log('VideoPlayer组件加载')

const route = useRoute()
const videoId = route.params.id as string

console.log('视频ID:', videoId)

const videoRef = ref<HTMLVideoElement>()
const player = ref<any>(null)
const video = ref<Video | null>(null)
const subtitles = ref<Subtitle[]>([])
const currentSubtitle = ref<Subtitle | null>(null)
const subtitleContents = ref<{[key: string]: {start: string, end: string, text: string}[]}>({})
const loading = ref(true)
const error = ref('')

console.log('初始化变量完成')

const initPlayer = async () => {
  console.log('initPlayer函数被调用')
  
  if (!videoRef.value) {
    console.error('videoRef.value为null')
    loading.value = false
    error.value = '播放器初始化失败'
    return
  }
  
  console.log('开始初始化播放器，视频ID:', videoId)
  
  try {
    console.log('获取视频详情和字幕...')
    
    // 分别获取视频详情和字幕，以便更好地定位问题
    console.log('获取视频详情...')
    const videoRes = await getVideoDetail(videoId) as unknown as Video
    console.log('视频详情获取成功:', videoRes)
    
    console.log('获取字幕列表...')
    const subtitleRes = await getVideoSubtitles(videoId) as unknown as Subtitle[]
    console.log('字幕列表获取成功:', subtitleRes)
    
    video.value = videoRes
    subtitles.value = subtitleRes || []
    
    console.log('获取视频播放地址...')
    const playRes = await getVideoPlayUrl(videoId) as unknown as { url: string }
    console.log('播放地址获取成功:', playRes)
    
    console.log('字幕列表:', subtitleRes)
    
    const tracks = subtitleRes.map((s: Subtitle) => {
      // 使用字幕ID构建API URL
      const src = `/api/videos/subtitles/${(s as any).id}`
      // 从文件名中提取语言信息，如果没有则使用默认值
      let srclang = s.language || 'zh'
      // 确保srclang是有效的语言代码
      if (srclang === 'unknown') {
        srclang = 'zh'
      }
      const track = {
        kind: 'captions' as const,
        srclang: srclang,
        label: s.name,
        src: src,
        default: s.isDefault
      }
      console.log('生成字幕轨道:', track)
      return track
    })
    
    // 根据URL判断视频类型
    let videoType = 'application/x-mpegURL'
    let videoUrl = playRes.url
    
    // 检查是否是相对路径，如果是，则添加完整的API基础URL
    if (!videoUrl.startsWith('http')) {
      // 确保URL以/开头
      if (!videoUrl.startsWith('/')) {
        videoUrl = '/' + videoUrl
      }
      // 添加API基础URL
      videoUrl = '/api' + videoUrl
    }
    
    if (videoUrl.includes('stream')) {
      videoType = 'video/mp4'
    }
    
    console.log('视频类型:', videoType)
    console.log('完整视频URL:', videoUrl)
    
    console.log('初始化Video.js播放器...')
    console.log('播放器配置:', {
      controls: true,
      fluid: true,
      sources: [{
        src: videoUrl,
        type: videoType
      }],
      tracks
    })
    
    console.log('最终使用的字幕轨道:', tracks)
    
    // 先创建video元素并手动添加字幕轨道
    const videoElement = videoRef.value
    if (videoElement && tracks.length > 0) {
      console.log('手动添加字幕轨道到video元素')
      tracks.forEach((track, index) => {
        const trackElement = document.createElement('track')
        trackElement.kind = track.kind
        trackElement.srclang = track.srclang
        trackElement.label = track.label
        trackElement.src = track.src
        trackElement.default = track.default
        trackElement.id = `track-${index}`
        videoElement.appendChild(trackElement)
        console.log('添加字幕轨道:', trackElement)
      })
    }
    
    player.value = videojs(videoRef.value, {
      controls: true,
      fluid: true,
      sources: [{
        src: videoUrl,
        type: videoType
      }],
      // 不在这里传递tracks，因为已经手动添加了
      // 禁用原生字幕轨道，使用Video.js的字幕按钮
      html5: {
        nativeTextTracks: false
      }
    })
    
    console.log('Video.js播放器初始化成功')
    console.log('播放器控制栏配置:', player.value.options().controlBar)
    console.log('播放器字幕轨道:', player.value.textTracks())
    
    // 设置默认字幕样式 - Text Background 半透明
    player.value.textTrackSettings.setValues({
      backgroundColor: '#000000',
      backgroundOpacity: '0.5'
    })
    console.log('设置默认字幕样式: Text Background 半透明')
    
    // 手动检查字幕按钮是否存在
    setTimeout(() => {
      const captionsButton = player.value.controlBar.getChild('captionsButton')
      console.log('字幕按钮存在:', !!captionsButton)
      if (captionsButton) {
        console.log('字幕按钮配置:', captionsButton.options())
      }
    }, 1000)
    
    // 添加播放器事件监听
    player.value.on('error', (e: any) => {
      console.error('播放器错误:', e.target.error)
      error.value = '播放器初始化失败'
    })
    
    player.value.on('loadedmetadata', () => {
      console.log('视频元数据加载完成')
      console.log('加载后字幕轨道:', player.value.textTracks())
    })
    
    player.value.on('play', () => {
      console.log('视频开始播放')
    })
    
    player.value.on('waiting', () => {
      console.log('视频加载中...')
    })
    
    player.value.on('stalled', () => {
      console.log('视频加载停滞...')
    })
    
    // 监听字幕加载事件
    player.value.on('texttrackchange', () => {
      console.log('字幕轨道变化:', player.value.textTracks())
    })
    
    player.value.on('loadstart', () => {
      console.log('开始加载媒体资源')
    })
    
    // 监听字幕加载错误
    player.value.on('texttrackerror', (e: any) => {
      console.error('字幕加载错误:', e)
    })
    
    if (subtitleRes.length > 0) {
      const defaultSub = subtitleRes.find((s: Subtitle) => s.isDefault) || subtitleRes[0]
      currentSubtitle.value = defaultSub || null
      
      // 加载默认字幕内容
      if (defaultSub) {
        console.log('开始加载默认字幕内容:', defaultSub.name)
        await loadSubtitleContent(defaultSub)
      }
    }
    
    // 手动启用默认字幕
    setTimeout(() => {
      const textTracks = player.value.textTracks()
      console.log('手动启用字幕前的轨道数量:', textTracks.length)
      console.log('所有字幕轨道:', textTracks)
      
      if (textTracks.length === 0) {
        console.warn('没有可用的字幕轨道')
        return
      }
      
      for (let i = 0; i < textTracks.length; i++) {
        const track = textTracks[i]
        console.log(`字幕轨道 ${i} 信息:`, {
          id: track.id,
          kind: track.kind,
          language: track.language,
          label: track.label,
          mode: track.mode,
          default: track.default,
          readyState: track.readyState
        })
        
        // 启用字幕轨道
        if (track.default) {
          track.mode = 'showing'
          console.log('启用默认字幕轨道:', track.label)
        }
      }
      
      // 如果没有默认轨道，启用第一个
      if (textTracks.length > 0) {
        let hasShowing = false
        for (let i = 0; i < textTracks.length; i++) {
          if (textTracks[i].mode === 'showing') {
            hasShowing = true
            break
          }
        }
        if (!hasShowing) {
          textTracks[0].mode = 'showing'
          console.log('启用第一个字幕轨道:', textTracks[0].label)
        }
      }
    }, 3000)
    
    console.log('播放器初始化完成')
  } catch (err: any) {
    console.error('初始化播放器失败:', err)
    console.error('错误详情:', {
      message: err.message,
      stack: err.stack,
      response: err.response
    })
    error.value = err.message || '加载视频失败'
  } finally {
    loading.value = false
    console.log('加载状态设置为false')
  }
}

const changeSubtitle = async (subtitle: Subtitle) => {
  currentSubtitle.value = subtitle
  const enabledTrack = player.value?.textTracks()?.getTrackByLanguage(subtitle.language)
  if (enabledTrack) {
    enabledTrack.mode = 'showing'
  }
}

const loadSubtitleContent = async (subtitle: Subtitle) => {
  try {
    const response = await fetch(`/api/videos/subtitles/${subtitle.id}`)
    if (!response.ok) {
      throw new Error('Failed to load subtitle')
    }
    const content = await response.text()
    
    // 解析字幕内容 - 后端统一返回VTT格式
    const parsedSubtitles = parseSubtitle(content, 'vtt')
    subtitleContents.value[subtitle.id] = parsedSubtitles
    console.log('Parsed subtitle content:', parsedSubtitles)
  } catch (err) {
    console.error('Error loading subtitle content:', err)
  }
}

const parseSubtitle = (content: string, fileType: string): {start: string, end: string, text: string}[] => {
  const subtitles: {start: string, end: string, text: string}[] = []
  
  if (fileType === 'srt') {
    // 解析SRT格式
    const lines = content.split('\n')
    let currentSubtitle: {start: string, end: string, text: string} | null = null
    let textLines: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 检查是否是时间线
      const timeMatch = trimmedLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)
      if (timeMatch) {
        // 如果有当前字幕，保存它
        if (currentSubtitle) {
          currentSubtitle.text = textLines.join('\n')
          subtitles.push(currentSubtitle)
        }
        
        // 开始新字幕
        currentSubtitle = {
          start: timeMatch[1],
          end: timeMatch[2],
          text: ''
        }
        textLines = []
      } else if (trimmedLine && currentSubtitle) {
        // 累加文本行
        textLines.push(trimmedLine)
      }
    }
    
    // 保存最后一个字幕
    if (currentSubtitle) {
      currentSubtitle.text = textLines.join('\n')
      subtitles.push(currentSubtitle)
    }
  } else if (fileType === 'vtt') {
    // 解析WebVTT格式
    const lines = content.split('\n')
    let currentSubtitle: {start: string, end: string, text: string} | null = null
    let textLines: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 跳过WebVTT头部
      if (trimmedLine === 'WEBVTT' || trimmedLine === '') {
        continue
      }
      
      // 检查是否是时间线
      const timeMatch = trimmedLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/)
      if (timeMatch) {
        // 如果有当前字幕，保存它
        if (currentSubtitle) {
          currentSubtitle.text = textLines.join('\n')
          subtitles.push(currentSubtitle)
        }
        
        // 开始新字幕
        currentSubtitle = {
          start: timeMatch[1],
          end: timeMatch[2],
          text: ''
        }
        textLines = []
      } else if (trimmedLine && currentSubtitle) {
        // 累加文本行
        textLines.push(trimmedLine)
      }
    }
    
    // 保存最后一个字幕
    if (currentSubtitle) {
      currentSubtitle.text = textLines.join('\n')
      subtitles.push(currentSubtitle)
    }
  }
  
  return subtitles
}

const selectSubtitle = async (subtitle: Subtitle) => {
  currentSubtitle.value = subtitle
  // 禁用所有字幕轨道
  const textTracks = player.value?.textTracks()
  if (textTracks) {
    for (let i = 0; i < textTracks.length; i++) {
      textTracks[i].mode = 'disabled'
    }
  }
  // 启用选中的字幕轨道
  const selectedTrack = textTracks?.getTrackByLanguage(subtitle.language)
  if (selectedTrack) {
    selectedTrack.mode = 'showing'
  }
  
  // 加载字幕内容
  if (!subtitleContents.value[subtitle.id]) {
    await loadSubtitleContent(subtitle)
  }
}

onMounted(async () => {
  console.log('onMounted被调用')
  // 使用nextTick确保DOM已经更新，videoRef已经引用到video元素
  await nextTick()
  console.log('nextTick完成，检查videoRef.value:', videoRef.value)
  initPlayer()
})

onUnmounted(() => {
  console.log('onUnmounted被调用')
  player.value?.dispose()
})
</script>

<template>
  <div class="video-player-page">
    <div class="container">
      <!-- 视频标题 -->
      <div class="video-title" v-if="video">
        <h1>{{ video.title }}</h1>
        <p class="subtitle-info" v-if="subtitles.length === 0">
          <small>没有找到字幕</small>
        </p>
      </div>
      
      <div class="player-layout" v-show="!loading">
        <!-- 左侧播放器 -->
        <div class="player-container" v-show="!error">
          <div class="video-wrapper">
            <video ref="videoRef" class="video-js vjs-fill"></video>
          </div>
          <div class="error" v-show="error">
            <p>{{ error }}</p>
          </div>
        </div>
        
        <!-- 右侧字幕内容 -->
        <div class="subtitle-list-container">
          <h2 class="subtitle-list-title">字幕内容</h2>
          <div v-if="subtitles.length === 0" class="empty-subtitles">
            <p>暂无字幕</p>
          </div>
          <div v-else-if="!currentSubtitle" class="empty-subtitles">
            <p>正在加载字幕...</p>
          </div>
          <div v-else-if="!subtitleContents[currentSubtitle.id]" class="loading-subtitle">
            <p>加载字幕内容中...</p>
          </div>
          <div v-else class="subtitle-content-list">
            <div 
              v-for="(sub, index) in subtitleContents[currentSubtitle.id]" 
              :key="index"
              class="subtitle-content-item"
            >
              <div class="subtitle-time">{{ sub.start }} --> {{ sub.end }}</div>
              <div class="subtitle-text">{{ sub.text }}</div>
            </div>
          </div>
        </div>
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
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.video-title {
  margin-bottom: 20px;
  
  h1 {
    font-size: 24px;
    margin-bottom: 8px;
    color: #333;
  }
  
  .subtitle-info {
    color: #999;
    margin: 0;
  }
}

.player-layout {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  width: 100%;
  align-items: flex-start;
}

.player-container {
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-width: 0;
  max-width: calc(100% - 320px);
}

.video-wrapper {
  aspect-ratio: 16 / 9;
  background: #000;
}

.subtitle-list-container {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 500px;
  overflow-y: auto;
  flex-shrink: 0;
  flex-grow: 0;
}

.subtitle-list-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.empty-subtitles {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.subtitle-content-list {
  max-height: 400px;
  overflow-y: auto;
}

.subtitle-content-list {
  max-height: 300px;
  overflow-y: auto;
}

.subtitle-content-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.subtitle-content-item:last-child {
  border-bottom: none;
}

.subtitle-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.subtitle-text {
  color: #333;
  line-height: 1.4;
}

.loading-subtitle {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

/* 确保Video.js播放器填满容器 */
:deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
}

.error {
  color: #fff;
  text-align: center;
  padding: 60px;
}

.loading {
  color: #333;
  text-align: center;
  padding: 60px;
  background: #f5f5f5;
}
</style>
