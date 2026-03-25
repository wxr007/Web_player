import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { Subtitle } from './subtitle.entity'
import { WatchHistory } from './watch-history.entity'
import { Favorite } from './favorite.entity'
import { VideoTag } from './video-tag.entity'
import { VideoRepository } from './video-repository.entity'

export enum VideoStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ name: 'cover_url', length: 500, nullable: true })
  coverUrl: string

  @Column({ name: 'oss_key', length: 500, nullable: true })
  ossKey: string

  @Column({ name: 'oss_url', length: 500, nullable: true })
  ossUrl: string

  @Column({ type: 'int', default: 0 })
  duration: number

  @Column({ length: 50, nullable: true })
  resolution: string

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.DRAFT })
  status: VideoStatus

  @Column({ name: 'is_vip_only', type: 'boolean', default: false })
  isVipOnly: boolean

  @Column({ name: 'local_path', length: 1000, nullable: true })
  localPath: string

  @ManyToOne(() => VideoRepository, repository => repository.videos, { nullable: true })
  @JoinColumn({ name: 'repository_id' })
  repository: VideoRepository

  @Column({ name: 'repository_id', nullable: true })
  repositoryId: string

  @OneToMany(() => Subtitle, subtitle => subtitle.video)
  subtitles: Subtitle[]

  @OneToMany(() => WatchHistory, history => history.video)
  watchHistory: WatchHistory[]

  @OneToMany(() => Favorite, favorite => favorite.video)
  favorites: Favorite[]

  @OneToMany(() => VideoTag, tag => tag.video, { cascade: true })
  tags: VideoTag[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
