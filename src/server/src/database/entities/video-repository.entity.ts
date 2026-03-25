import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Video } from './video.entity'

export enum RepositoryStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  ERROR = 'error',
  COMPLETED = 'completed'
}

@Entity('video_repositories')
export class VideoRepository {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ name: 'path', length: 1000 })
  path: string

  @Column({ type: 'enum', enum: RepositoryStatus, default: RepositoryStatus.IDLE })
  status: RepositoryStatus

  @Column({ name: 'last_scan_at', nullable: true })
  lastScanAt: Date

  @Column({ name: 'video_count', type: 'int', default: 0 })
  videoCount: number

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @OneToMany(() => Video, video => video.repository)
  videos: Video[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}