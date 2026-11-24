import { Link } from 'react-router'
import { MovieCard } from '../components/MovieCard'
import { useWatchlist } from '../stores/watchlist'

export function WatchlistPage() {
  const items = useWatchlist((s) => s.items)
  const loading = useWatchlist((s) => s.loading)

  return (
    <div className="space-y-6 px-4 pt-24 sm:px-10">
      <h1 className="text-2xl font-semibold">My List</h1>
      {!loading && items.length === 0 ? (
        <p className="text-neutral-400">
          Your list is empty.{' '}
          <Link to="/" className="text-white underline">
            Find something to watch
          </Link>
          .
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((movie) => (
            <li key={movie._id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
