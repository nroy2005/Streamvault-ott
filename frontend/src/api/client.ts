import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuth } from '../stores/auth'
import type { AuthTokens } from './types'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Concurrent 401s share one refresh call (the backend rotates refresh tokens,
// so a second parallel refresh with the same token would be rejected).
let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens } = useAuth.getState()
  if (!refreshToken) throw new Error('Not logged in')
  // Bare axios, not `api`: a failing refresh must not re-enter the interceptor.
  const { data } = await axios.post<AuthTokens>('/api/auth/refresh', { refreshToken })
  setTokens(data)
  return data.accessToken
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retried || original.url?.startsWith('/auth/')) {
    throw error
  }
  original._retried = true
  try {
    refreshing ??= refreshAccessToken().finally(() => (refreshing = null))
    original.headers.Authorization = `Bearer ${await refreshing}`
    return api(original)
  } catch {
    useAuth.getState().logout()
    throw error
  }
})

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(err)) {
    const message = err.response?.data?.message
    if (message) return Array.isArray(message) ? message.join(', ') : message
    if (!err.response) return 'Cannot reach the server'
  }
  return 'Something went wrong'
}
