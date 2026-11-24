import { create } from 'zustand'

interface AuthState {
  /** Short-lived (15m) and held in memory only. The refresh token lives in an httpOnly cookie JS can't read. */
  accessToken: string | null
  email: string | null
  /** False until the startup session restore (cookie → access token) has finished. */
  ready: boolean
  setAccessToken: (token: string | null) => void
  setReady: () => void
}

function emailFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(payload)) as { email?: string }).email ?? null
  } catch {
    return null
  }
}

export const useAuth = create<AuthState>()((set) => ({
  accessToken: null,
  email: null,
  ready: false,
  setAccessToken: (token) => set({ accessToken: token, email: token ? emailFromToken(token) : null }),
  setReady: () => set({ ready: true }),
}))
