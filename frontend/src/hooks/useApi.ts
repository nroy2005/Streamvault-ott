import axios from 'axios'
import { useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { ContinueWatchingItem, Movie, MovieQuery, Page, PlaybackPosition } from '../api/types'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** GET `url` (skipped when null), refetching when url or params change. Stale requests are aborted. */
export function useFetch<T>(url: string | null, params?: object): FetchState<T> {
  const paramsKey = JSON.stringify(params ?? {})
  const requestKey = url === null ? null : `${url}?${paramsKey}`
  // Remember which request the stored result belongs to; "loading" is just "result is for an older request".
  // Previous data stays visible while the next request is in flight.
  const [result, setResult] = useState<{ key: string | null; data: T | null; error: string | null }>({
    key: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    if (url === null) return
    const key = `${url}?${paramsKey}`
    const controller = new AbortController()
    api
      .get<T>(url, { params: JSON.parse(paramsKey) as object, signal: controller.signal })
      .then(({ data }) => setResult({ key, data, error: null }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setResult({ key, data: null, error: errorMessage(err) })
      })
    return () => controller.abort()
  }, [url, paramsKey])

  const current = result.key === requestKey
  return { data: result.data, loading: requestKey !== null && !current, error: current ? result.error : null }
}

export const useMovies = (query: MovieQuery) => useFetch<Page<Movie>>('/movies', query)
export const useMovie = (id: string | undefined) => useFetch<Movie>(id ? `/movies/${id}` : null)
export const useContinueWatching = () => useFetch<ContinueWatchingItem[]>('/playback')
export const usePlaybackPosition = (movieId: string | undefined) =>
  useFetch<PlaybackPosition>(movieId ? `/playback/${movieId}` : null)

export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}
