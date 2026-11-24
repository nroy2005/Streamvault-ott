import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api/client'
import { VideoPlayer } from '../components/VideoPlayer'
import { useMovie, usePlaybackPosition } from '../hooks/useApi'

const SAVE_EVERY_MS = 10_000

export function PlayerPage() {
  const { id } = useParams()
  const movie = useMovie(id)
  const saved = usePlaybackPosition(id)
  const timeRef = useRef<(() => number | null) | null>(null)

  // Save progress every 10s, and once more on leave. Skips the request if the position hasn't moved.
  useEffect(() => {
    if (!id) return
    let lastSaved = -1
    const save = () => {
      const t = timeRef.current?.()
      if (t == null || Math.floor(t) === lastSaved) return
      lastSaved = Math.floor(t)
      void api.post('/playback', { movieId: id, positionSeconds: lastSaved }).catch(() => {})
    }
    const timer = setInterval(save, SAVE_EVERY_MS)
    return () => {
      clearInterval(timer)
      save()
    }
  }, [id])

  const ready = !movie.loading && !saved.loading
  const src = movie.data?.trailerUrl

  return (
    <div className="fixed inset-0 bg-black">
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 rounded-full bg-black/60 px-4 py-2 text-sm font-medium hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-white"
      >
        ← Back{movie.data && <span className="text-neutral-400"> · {movie.data.title}</span>}
      </Link>

      {!ready ? (
        <p className="grid h-full place-items-center text-neutral-400">Loading…</p>
      ) : movie.error ? (
        <p className="grid h-full place-items-center text-neutral-400">{movie.error}</p>
      ) : !src ? (
        <p className="grid h-full place-items-center text-neutral-400">No stream available for this title.</p>
      ) : (
        <VideoPlayer src={src} startAt={saved.data?.positionSeconds ?? 0} timeRef={timeRef} />
      )}
    </div>
  )
}
