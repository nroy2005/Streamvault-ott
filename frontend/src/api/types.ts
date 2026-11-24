export interface Movie {
  _id: string
  tmdbId: number
  title: string
  genres: string[]
  releaseYear: number | null
  posterUrl: string | null
  trailerUrl: string | null
  rating: number
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface MovieQuery {
  search?: string
  genre?: string
  page?: number
  limit?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface PlaybackPosition {
  movieId: string
  positionSeconds: number
}

export interface ContinueWatchingItem {
  movie: Movie
  positionSeconds: number
}

// TMDB genre names, as stored by the seed script.
export const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Science Fiction', 'Thriller', 'Animation', 'Horror']

export function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}
