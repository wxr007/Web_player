import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Video } from './video.entity'

@Entity('subtitles')
export class Subtitle {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'video_id' })
  videoId: string

  @ManyToOne(() => Video, video => video.subtitles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video

  @Column({ length: 10 })
  language: string

  @Column({ length: 100, nullable: true })
  name: string

  @Column({ name: 'oss_key', length: 500 })
  ossKey: string

  @Column({ name: 'file_type', length: 20 })
  fileType: string

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
