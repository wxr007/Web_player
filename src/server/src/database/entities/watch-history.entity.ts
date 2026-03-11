import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { Video } from './video.entity'

@Entity('watch_history')
export class WatchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, user => user.watchHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'video_id' })
  videoId: string

  @ManyToOne(() => Video, video => video.watchHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video

  @Column({ type: 'int', default: 0 })
  progress: number

  @Column({ name: 'last_watch', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastWatch: Date
}
