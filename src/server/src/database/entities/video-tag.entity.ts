import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Video } from './video.entity'

@Entity('video_tags')
export class VideoTag {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'video_id' })
  videoId: string

  @ManyToOne(() => Video, video => video.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video

  @Column({ length: 50 })
  tag: string
}
