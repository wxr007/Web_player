export enum RepositoryStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export interface VideoRepository {
  id: string
  name: string
  path: string
  status: RepositoryStatus
  lastScanAt: Date | null
  videoCount: number
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
  videos?: any[]
}