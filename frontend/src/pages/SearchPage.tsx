import { useSearchParams } from 'react-router'
import { GENRES } from '../api/types'
import { MovieCard } from '../components/MovieCard'
import { useMovies } from '../hooks/useApi'

const PAGE_SIZE = 24

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const genre = params.get('genre') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const { data, loading, error } = useMovies({ search: search || undefined, genre: genre || undefined, page, limit: PAGE_SIZE })
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next)
  }

  return (
    <div className="space-y-6 px-4 pt-24 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {search ? <>Results for “{search}”</> : 'Browse'}
          {data && <span className="ml-2 text-base font-normal text-neutral-400">({data.total})</span>}
        </h1>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          Genre
          <select
            value={genre}
            onChange={(e) => update({ genre: e.target.value, page: '' })}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 focus:border-white focus:outline-none"
          >
            <option value="">All</option>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-400">No titles match your search.</p>}

      <ul className={`grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6 ${loading ? 'opacity-50' : ''}`}>
        {data?.items.map((movie) => (
          <li key={movie._id}>
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-neutral-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => update({ page: String(page + 1) })}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700 disabled:opacity-40"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
