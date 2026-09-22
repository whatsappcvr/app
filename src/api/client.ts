import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { useAuthStore } from '../auth/store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

function jwtKey(accountType: 'parent' | 'student' | null): string {
  return accountType === 'student' ? 'jwt_student' : 'jwt_parent'
}

client.interceptors.request.use(async (config) => {
  const { activeAccountType } = useAuthStore.getState()
  const token = await SecureStore.getItemAsync(jwtKey(activeAccountType))
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthEndpoint = typeof error.config?.url === 'string' && error.config.url.includes('/auth/otp/')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      const { activeAccountType } = useAuthStore.getState()
      await SecureStore.deleteItemAsync(jwtKey(activeAccountType))
      useAuthStore.getState().removeSession(activeAccountType ?? 'parent')

      // If the other session still exists, switch to it; otherwise go to login
      const state = useAuthStore.getState()
      if (state.isAuthenticated) {
        router.replace('/(app)')
      } else {
        router.replace('/(auth)/login')
      }
    }
    return Promise.reject(error)
  },
)
