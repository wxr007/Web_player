<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getVideoDetail, getVideoSubtitles, getVideoPlayUrl, updateWatchProgress, getVideoProgress } from '@/api/video'
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
const savedProgress = ref(0)
const lastReportedProgress = ref(0)

// 进度报告节流（每5秒报告一次）
const PROGRESS_REPORT_INTERVAL = 5000

// 字幕联动相关
const currentTime = ref(0)
const currentSubtitleIndex = ref(-1)
const subtitleListRef = ref<HTMLElement>()
const subtitleItemRefs = ref<{[key: number]: HTMLElement}>({})

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

    // 获取保存的观看进度
    try {
      const progressRes = await getVideoProgress(videoId) as unknown as { progress: number }
      if (progressRes && progressRes.progress > 0) {
        savedProgress.value = progressRes.progress
        console.log('获取到保存的进度:', savedProgress.value)
      }
    } catch (err) {
      console.log('获取观看进度失败:', err)
    }

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

    // 如果有保存的进度，设置跳转
    const seekToSavedProgress = () => {
      if (savedProgress.value > 0 && savedProgress.value < (player.value.duration() || 0)) {
        player.value.currentTime(savedProgress.value)
        console.log('跳转到保存的进度:', savedProgress.value)
      }
    }

    player.value.on('loadedmetadata', () => {
      console.log('视频元数据加载完成')
      console.log('加载后字幕轨道:', player.value.textTracks())
      seekToSavedProgress()
    })

    // 如果视频已经加载了元数据，直接跳转
    if (player.value.readyState() >= 1) {
      console.log('视频元数据已加载，直接跳转')
      seekToSavedProgress()
    }
    
    player.value.on('play', () => {
      console.log('视频开始播放')
    })
    
    // 监听播放时间更新
    player.value.on('timeupdate', () => {
      const time = player.value.currentTime()
      currentTime.value = time
      updateCurrentSubtitleIndex()
      
      // 记录观看进度（每10秒报告一次）
      const now = Date.now()
      if (now - lastReportedProgress.value >= PROGRESS_REPORT_INTERVAL) {
        const progress = Math.floor(time)
        if (progress > 0) {
          updateWatchProgress(videoId, progress)
          lastReportedProgress.value = now
          console.log('报告观看进度:', progress)
        }
      }
    })
    
    // 监听播放结束
    player.value.on('ended', () => {
      // 视频播放完成，记录完整进度
      updateWatchProgress(videoId, Math.floor(player.value.duration() || 0))
      console.log('视频播放完成')
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

// 将时间字符串转换为秒数
const timeToSeconds = (timeStr: string): number => {
  // 支持格式: 00:00:00,000 或 00:00:00.000
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/)
  if (!match) return 0
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])
  const milliseconds = parseInt(match[4])
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

// 跳转到指定字幕时间
const seekToSubtitle = (sub: {start: string, end: string, text: string}) => {
  const seconds = timeToSeconds(sub.start)
  if (player.value) {
    player.value.currentTime(seconds)
    player.value.play()
  }
}

// 更新当前字幕索引
const updateCurrentSubtitleIndex = () => {
  if (!currentSubtitle.value || !subtitleContents.value[currentSubtitle.value.id]) {
    currentSubtitleIndex.value = -1
    return
  }
  
  const subtitles = subtitleContents.value[currentSubtitle.value.id]
  const currentSeconds = currentTime.value
  
  // 查找当前时间对应的字幕
  for (let i = 0; i < subtitles.length; i++) {
    const startSeconds = timeToSeconds(subtitles[i].start)
    const endSeconds = timeToSeconds(subtitles[i].end)
    
    if (currentSeconds >= startSeconds && currentSeconds <= endSeconds) {
      if (currentSubtitleIndex.value !== i) {
        currentSubtitleIndex.value = i
        // 滚动到当前字幕
        scrollToCurrentSubtitle()
      }
      return
    }
  }
  
  // 不取消高亮状态，保留最后一个播放的字幕高亮
}

// 滚动到当前字幕
const scrollToCurrentSubtitle = () => {
  const element = subtitleItemRefs.value[currentSubtitleIndex.value]
  if (element && subtitleListRef.value) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 保存当前进度到后端
const saveCurrentProgress = async () => {
  if (player.value && videoId) {
    const currentTime = player.value.currentTime()
    const duration = player.value.duration() || 0
    // 只有当进度大于0且小于总时长（未看完）时才保存
    if (currentTime > 0 && currentTime < duration) {
      try {
        await updateWatchProgress(videoId, Math.floor(currentTime))
        console.log('页面关闭前保存进度:', currentTime)
      } catch (err) {
        console.error('保存进度失败:', err)
      }
    }
  }
}

onMounted(async () => {
  console.log('onMounted被调用')
  // 使用nextTick确保DOM已经更新，videoRef已经引用到video元素
  await nextTick()
  console.log('nextTick完成，检查videoRef.value:', videoRef.value)
  initPlayer()

  // 监听页面关闭/刷新事件
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 页面关闭/刷新前的处理
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  // 使用同步的 XMLHttpRequest 确保请求发送完成
  if (player.value && videoId) {
    const currentTime = player.value.currentTime()
    const duration = player.value.duration() || 0
    if (currentTime > 0 && currentTime < duration) {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/user/history', false) // 同步请求
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
      xhr.send(JSON.stringify({ videoId, progress: Math.floor(currentTime) }))
    }
  }
}

onUnmounted(() => {
  console.log('onUnmounted被调用')
  // 保存进度
  saveCurrentProgress()
  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
  // 销毁播放器
  player.value?.dispose()
})
</script>

<template>
  <div class="video-player-page">
    <div class="container">
      <div class="player-layout" v-show="!loading">
        <!-- 左侧播放器区域 -->
        <div class="player-section">
          <div class="player-container" v-show="!error">
            <div class="video-wrapper">
              <video ref="videoRef" class="video-js vjs-fill"></video>
            </div>
            <div class="error" v-show="error">
              <p>{{ error }}</p>
            </div>
          </div>
          
          <!-- 视频标题 - 放在视频下方 -->
          <div class="video-title" v-if="video">
            <h1>{{ video.title }}</h1>
            <p class="subtitle-info" v-if="subtitles.length === 0">
              <small>没有找到字幕</small>
            </p>
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
          <div v-else class="subtitle-content-list" ref="subtitleListRef">
            <div 
              v-for="(sub, index) in subtitleContents[currentSubtitle.id]" 
              :key="index"
              class="subtitle-content-item"
              :class="{ 'active': currentSubtitleIndex === index }"
              @click="seekToSubtitle(sub)"
              :ref="el => { if (el) subtitleItemRefs[index] = el }"
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
  max-width: 100%;
  margin: 0;
  padding: 20px;
  width: 100%;
}

.player-layout {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  width: 100%;
  align-items: stretch;
}

.player-section {
  flex: 0 0 64%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.player-container {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
}

.video-wrapper {
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-title {
  margin-top: 16px;
  padding: 0 4px;
  
  h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #0f0f0f;
    line-height: 1.3;
  }
  
  .subtitle-info {
    color: #606060;
    margin: 0;
    font-size: 14px;
  }
}

.subtitle-list-container {
  flex: 0 0 35%;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
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
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.subtitle-content-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 4px;
}

.subtitle-content-item:hover {
  background-color: #f5f5f5;
}

.subtitle-content-item.active {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.subtitle-content-item.active .subtitle-time {
  color: #2196f3;
}

.subtitle-content-item:last-child {
  border-bottom: none;
}

.subtitle-time {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  letter-spacing: 0.5px;
}

.subtitle-text {
  color: #1a1a1a;
  line-height: 1.6;
  font-size: 16px;
  font-weight: 400;
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
