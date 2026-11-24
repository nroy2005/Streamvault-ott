import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuth } from '../stores/auth'
import type { AccessTokenResponse } from './types'

// withCredentials: send the httpOnly refresh cookie even if the API is on another origin.
export const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Concurrent callers share one refresh call: the backend rotates the refresh cookie,
// so a second parallel refresh with the old cookie would be rejected.
let refreshing: Promise<string> | null = null

/** Trades the httpOnly refresh cookie for a new access token. */
export function refreshAccessToken(): Promise<string> {
  refreshing ??= axios
    // Bare axios, not `api`: a failing refresh must not re-enter the 401 interceptor.
    .post<AccessTokenResponse>('/api/auth/refresh', undefined, { withCredentials: true })
    .then(({ data }) => {
      useAuth.getState().setAccessToken(data.accessToken)
      return data.accessToken
    })
    .finally(() => (refreshing = null))
  return refreshing
}

/** On startup: if the refresh cookie is still valid, the user stays logged in across reloads. */
export async function restoreSession(): Promise<void> {
  try {
    await refreshAccessToken()
  } catch {
    // no or expired cookie: stay logged out
  } finally {
    useAuth.getState().setReady()
  }
}

export async function signOut(): Promise<void> {
  try {
    await api.post('/auth/logout') // revokes the token server-side and clears the cookie
  } finally {
    useAuth.getState().setAccessToken(null)
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retried || original.url?.startsWith('/auth/')) {
    throw error
  }
  original._retried = true
  try {
    original.headers.Authorization = `Bearer ${await refreshAccessToken()}`
    return api(original)
  } catch {
    useAuth.getState().setAccessToken(null)
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
