import instance from './axios'
import type { Video, VideoListParams, VideoListResponse, Subtitle } from '@/types/video'

export interface Repository {
  id: string
  name: string
}

export const getRepositories = () => {
  return instance.get<Repository[]>('/repositories/public/list')
}

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

export const getVideoProgress = (videoId: string) => {
  return instance.get<{ progress: number }>(`/user/history/progress/${videoId}`)
}

export const clearWatchHistory = () => {
  return instance.delete('/user/history/clear')
}

export const deleteWatchHistoryItem = (videoId: string) => {
  return instance.delete(`/user/history/${videoId}`)
}
