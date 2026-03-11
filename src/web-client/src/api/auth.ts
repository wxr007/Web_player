import instance from './axios'
import type { LoginParams, RegisterParams, AuthResponse, User } from '@/types/user'

export const login = (data: LoginParams) => {
  return instance.post<AuthResponse>('/auth/login', data)
}

export const register = (data: RegisterParams) => {
  return instance.post<AuthResponse>('/auth/register', data)
}

export const logout = () => {
  return instance.post('/auth/logout')
}

export const refreshToken = () => {
  return instance.post<{ accessToken: string }>('/auth/refresh')
}

export const getUserProfile = () => {
  return instance.get<User>('/user/profile')
}

export const updateUserProfile = (data: Partial<User>) => {
  return instance.put<User>('/user/profile', data)
}
