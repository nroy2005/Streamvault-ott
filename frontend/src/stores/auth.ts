import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthTokens } from '../api/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  email: string | null
  setTokens: (tokens: AuthTokens, email?: string) => void
  logout: () => void
}

// ponytail: tokens persist in localStorage, so an XSS bug could read them.
// Move the refresh token to an httpOnly cookie set by the backend to close that.
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      email: null,
      setTokens: ({ accessToken, refreshToken }, email) =>
        set((s) => ({ accessToken, refreshToken, email: email ?? s.email })),
      logout: () => set({ accessToken: null, refreshToken: null, email: null }),
    }),
    { name: 'streamvault-auth', partialize: ({ accessToken, refreshToken, email }) => ({ accessToken, refreshToken, email }) },
  ),
)
