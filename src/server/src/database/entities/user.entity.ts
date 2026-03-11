import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Order } from './order.entity'
import { WatchHistory } from './watch-history.entity'
import { Favorite } from './favorite.entity'

export enum UserRole {
  USER = 'user',
  VIP = 'vip',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 50, unique: true })
  username: string

  @Column({ length: 255, unique: true })
  email: string

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string

  @Column({ type: 'text', nullable: true })
  avatar: string

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole

  @Column({ name: 'vip_expire_at', type: 'timestamp', nullable: true })
  vipExpireAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Order, order => order.user)
  orders: Order[]

  @OneToMany(() => WatchHistory, history => history.user)
  watchHistory: WatchHistory[]

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites: Favorite[]
}
