import type { Movie } from '../api/types'
import { useMovies } from '../hooks/useApi'
import { MovieCard } from './MovieCard'

export function MovieRow({ title, items }: { title: string; items: { movie: Movie; caption?: string }[] }) {
  if (!items.length) return null
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="px-4 text-lg font-semibold sm:px-10 sm:text-xl">{title}</h2>
      <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-4 pt-2 pb-4 sm:px-10">
        {items.map(({ movie, caption }) => (
          <li key={movie._id} className="w-32 shrink-0 snap-start sm:w-40 lg:w-44">
            <MovieCard movie={movie} caption={caption} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function GenreRow({ genre }: { genre: string }) {
  const { data } = useMovies({ genre, limit: 20 })
  return <MovieRow title={genre} items={(data?.items ?? []).map((movie) => ({ movie }))} />
}
