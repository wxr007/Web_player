import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/types/user'
import { getToken, setToken, removeToken } from '@/utils/storage'
import { login as loginApi, register as registerApi, getUserProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(getToken() || '')
  const userInfo = ref<User | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isVip = computed(() => {
    if (!userInfo.value?.vipExpireAt) return false
    return new Date(userInfo.value.vipExpireAt) > new Date()
  })

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await loginApi({ username, password }) as unknown as AuthResponse
      token.value = res.accessToken
      setToken(res.accessToken)
      await fetchUserInfo()
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true
    try {
      const res = await registerApi({ username, email, password }) as unknown as AuthResponse
      token.value = res.accessToken
      setToken(res.accessToken)
      await fetchUserInfo()
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      userInfo.value = await getUserProfile() as unknown as User
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    removeToken()
  }

  function initAuth() {
    if (token.value) {
      fetchUserInfo()
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    isVip,
    login,
    register,
    logout,
    fetchUserInfo,
    initAuth
  }
})
