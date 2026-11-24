import { Link } from 'react-router'
import type { Movie } from '../api/types'
import { WatchlistButton } from './WatchlistButton'

export function MovieCard({ movie, caption }: { movie: Movie; caption?: string }) {
  return (
    <div className="group relative">
      <Link
        to={`/watch/${movie._id}`}
        className="block aspect-[2/3] overflow-hidden rounded-md bg-neutral-800 ring-red-600 transition duration-200 group-hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
      >
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center p-3 text-center text-sm text-neutral-300">{movie.title}</span>
        )}
      </Link>
      <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <WatchlistButton movie={movie} compact />
      </div>
      <p className="mt-2 truncate text-sm font-medium" title={movie.title}>
        {movie.title}
      </p>
      <p className="text-xs text-neutral-400">
        {caption ?? [movie.releaseYear, `★ ${movie.rating.toFixed(1)}`].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}
