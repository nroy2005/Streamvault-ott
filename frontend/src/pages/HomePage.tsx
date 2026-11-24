import { formatTime, GENRES } from '../api/types'
import { HeroBanner } from '../components/HeroBanner'
import { GenreRow, MovieRow } from '../components/MovieRow'
import { useContinueWatching, useMovies } from '../hooks/useApi'

export function HomePage() {
  const featured = useMovies({ limit: 1 }) // highest rated
  const continueWatching = useContinueWatching()
  const hero = featured.data?.items[0]

  if (featured.error) {
    return <p className="grid min-h-screen place-items-center px-4 text-neutral-400">{featured.error}</p>
  }

  return (
    <>
      {hero ? <HeroBanner movie={hero} /> : <div className="min-h-[70vh] animate-pulse bg-neutral-900" />}
      <div className="relative z-10 -mt-8 space-y-8">
        <MovieRow
          title="Continue Watching"
          items={(continueWatching.data ?? []).map(({ movie, positionSeconds }) => ({
            movie,
            caption: `Resume at ${formatTime(positionSeconds)}`,
          }))}
        />
        {GENRES.map((genre) => (
          <GenreRow key={genre} genre={genre} />
        ))}
      </div>
    </>
  )
}
