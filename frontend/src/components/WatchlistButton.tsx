import type { Movie } from '../api/types'
import { useWatchlist } from '../stores/watchlist'

export function WatchlistButton({ movie, compact = false }: { movie: Movie; compact?: boolean }) {
  const inList = useWatchlist((s) => s.items.some((m) => m._id === movie._id))
  const toggle = useWatchlist((s) => s.toggle)
  const label = inList ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void toggle(movie)}
        aria-label={label}
        aria-pressed={inList}
        title={label}
        className="grid size-8 place-items-center rounded-full border border-white/60 bg-black/70 text-lg leading-none text-white transition hover:border-white hover:bg-black focus-visible:outline-2 focus-visible:outline-red-500"
      >
        {inList ? '✓' : '+'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void toggle(movie)}
      aria-pressed={inList}
      className="rounded-md bg-neutral-500/60 px-5 py-2.5 font-semibold text-white backdrop-blur transition hover:bg-neutral-500/40 focus-visible:outline-2 focus-visible:outline-white"
    >
      {inList ? '✓ In My List' : '+ My List'}
    </button>
  )
}
