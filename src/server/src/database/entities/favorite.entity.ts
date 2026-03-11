import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { Video } from './video.entity'

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, user => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'video_id' })
  videoId: string

  @ManyToOne(() => Video, video => video.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
