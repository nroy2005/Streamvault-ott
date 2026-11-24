import { Link } from 'react-router'
import type { Movie } from '../api/types'
import { WatchlistButton } from './WatchlistButton'

export function HeroBanner({ movie }: { movie: Movie }) {
  return (
    <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden" aria-label="Featured">
      {movie.posterUrl && (
        <img src={movie.posterUrl} alt="" className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-50 blur-2xl" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-neutral-950/90 to-transparent" />

      <div className="flex w-full items-end justify-between gap-8 px-4 pt-28 pb-12 sm:px-10">
        <div className="max-w-xl space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{movie.title}</h1>
          <p className="text-sm text-neutral-300 sm:text-base">
            <span className="font-semibold text-green-400">★ {movie.rating.toFixed(1)}</span>
            {movie.releaseYear && <> · {movie.releaseYear}</>}
            {movie.genres.length > 0 && <> · {movie.genres.slice(0, 3).join(', ')}</>}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/watch/${movie._id}`}
              className="rounded-md bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-red-500"
            >
              ▶ Play
            </Link>
            <WatchlistButton movie={movie} />
          </div>
        </div>
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title} className="hidden w-56 rounded-lg shadow-2xl shadow-black md:block lg:w-64" />
        )}
      </div>
    </section>
  )
}
