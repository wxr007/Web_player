import instance from './axios'

export interface CreateOrderParams {
  amount: number
  method: 'wechat' | 'alipay'
  vipMonths: number
}

export interface Order {
  id: string
  orderNo: string
  amount: number
  paymentMethod: string
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  vipMonths: number
  createdAt: string
  paidAt?: string
}

export const createOrder = (data: CreateOrderParams) => {
  return instance.post<{ orderNo: string; payParams: any }>('/payment/create-order', data)
}

export const getOrderStatus = (orderNo: string) => {
  return instance.get<Order>(`/payment/status/${orderNo}`)
}

export const getSubscriptionStatus = () => {
  return instance.get<{
    isVip: boolean
    vipExpireAt?: string
    subscription?: Order
  }>('/user/subscription')
}

export const getVipPrices = () => {
  return instance.get<Array<{ months: number; price: number; originalPrice?: number }>>('/payment/prices')
}
