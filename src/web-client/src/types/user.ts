export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'user' | 'vip' | 'admin'
  vipExpireAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}
