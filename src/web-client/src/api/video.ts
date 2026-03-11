import instance from './axios'
import type { Video, VideoListParams, VideoListResponse, Subtitle } from '@/types/video'

export const getVideoList = (params: VideoListParams) => {
  return instance.get<VideoListResponse>('/videos', { params })
}

export const getVideoDetail = (id: string) => {
  return instance.get<Video>(`/videos/${id}`)
}

export const getVideoPlayUrl = (id: string) => {
  return instance.get<{ url: string }>(`/videos/${id}/play`)
}

export const getVideoSubtitles = (id: string) => {
  return instance.get<Subtitle[]>(`/videos/${id}/subtitles`)
}

export const getSubtitleUrl = (id: string) => {
  return instance.get<{ url: string }>(`/subtitles/${id}/url`)
}

export const getWatchHistory = (params?: { page?: number; pageSize?: number }) => {
  return instance.get<VideoListResponse>('/user/history', { params })
}

export const getFavorites = (params?: { page?: number; pageSize?: number }) => {
  return instance.get<VideoListResponse>('/user/favorites', { params })
}

export const addFavorite = (videoId: string) => {
  return instance.post('/user/favorites', { videoId })
}

export const removeFavorite = (videoId: string) => {
  return instance.delete(`/user/favorites/${videoId}`)
}

export const updateWatchProgress = (videoId: string, progress: number) => {
  return instance.post('/user/history', { videoId, progress })
}
