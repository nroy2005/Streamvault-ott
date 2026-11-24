import { create } from 'zustand'
import { api } from '../api/client'
import type { Movie } from '../api/types'

interface WatchlistState {
  items: Movie[]
  loading: boolean
  load: () => Promise<void>
  toggle: (movie: Movie) => Promise<void>
}

export const useWatchlist = create<WatchlistState>()((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get<Movie[]>('/watchlist')
      set({ items: data })
    } finally {
      set({ loading: false })
    }
  },
  // Optimistic: update the UI first, roll back if the request fails.
  toggle: async (movie) => {
    const before = get().items
    const inList = before.some((m) => m._id === movie._id)
    set({ items: inList ? before.filter((m) => m._id !== movie._id) : [movie, ...before] })
    try {
      if (inList) await api.delete(`/watchlist/${movie._id}`)
      else await api.post('/watchlist', { movieId: movie._id })
    } catch {
      set({ items: before })
    }
  },
}))
