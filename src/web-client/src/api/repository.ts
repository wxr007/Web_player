import instance from './axios'
import type { VideoRepository } from '@/types/repository'

export const createRepository = (data: { name: string; path: string }) => {
  return instance.post<VideoRepository>('/repositories', data)
}

export const getRepositories = () => {
  return instance.get<VideoRepository[]>('/repositories')
}

export const getRepositoryById = (id: string) => {
  return instance.get<VideoRepository>(`/repositories/${id}`)
}

export const updateRepository = (id: string, data: Partial<VideoRepository>) => {
  return instance.put<VideoRepository>(`/repositories/${id}`, data)
}

export const deleteRepository = (id: string) => {
  return instance.delete(`/repositories/${id}`)
}

export const scanRepository = (id: string) => {
  return instance.post<{ added: number; updated: number; total: number }>(`/repositories/${id}/scan`)
}