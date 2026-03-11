export interface Video {
  id: string
  title: string
  description?: string
  coverUrl?: string
  ossUrl?: string
  duration: number
  resolution?: string
  fileSize?: number
  viewCount: number
  status: 'draft' | 'published' | 'hidden'
  isVipOnly: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface VideoListParams {
  page: number
  pageSize: number
  keyword?: string
  tag?: string
  status?: string
}

export interface VideoListResponse {
  list: Video[]
  total: number
  page: number
  pageSize: number
}

export interface Subtitle {
  id: string
  videoId: string
  language: string
  name: string
  fileType: 'vtt' | 'srt' | 'ass'
  isDefault: boolean
}
