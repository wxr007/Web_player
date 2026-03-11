import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'order_no', length: 100, unique: true })
  orderNo: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number

  @Column({ name: 'payment_method', length: 20 })
  paymentMethod: PaymentMethod

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date

  @Column({ name: 'vip_months', type: 'int', default: 1 })
  vipMonths: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
