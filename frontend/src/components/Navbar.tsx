import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { signOut } from '../api/client'
import { useDebounced } from '../hooks/useApi'
import { useAuth } from '../stores/auth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition hover:text-white ${isActive ? 'font-semibold text-white' : 'text-neutral-300'}`

export function Navbar() {
  const email = useAuth((s) => s.email)
  const navigate = useNavigate()
  const onSearchPage = useLocation().pathname === '/search'
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const debounced = useDebounced(query.trim(), 400)

  // Search as you type: typing on any page jumps to /search; clearing the box there goes home.
  useEffect(() => {
    if (debounced && debounced !== params.get('q')) navigate(`/search?q=${encodeURIComponent(debounced)}`, { replace: onSearchPage })
    else if (!debounced && onSearchPage) navigate('/')
    // Only react to what the user typed, not to navigation itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-gradient-to-b from-black/90 to-transparent">
      <nav className="flex items-center gap-4 px-4 py-4 sm:gap-8 sm:px-10">
        <NavLink to="/" className="text-xl font-black tracking-tight text-red-600 sm:text-2xl">
          STREAMVAULT
        </NavLink>
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/watchlist" className={linkClass}>
          My List
        </NavLink>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="ml-auto">
          <label htmlFor="search" className="sr-only">
            Search movies
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titles, genres"
            maxLength={100}
            className="w-32 rounded-md border border-white/30 bg-black/60 px-3 py-1.5 text-sm placeholder:text-neutral-500 focus:w-48 focus:border-white focus:outline-none sm:w-56 sm:focus:w-72 transition-all"
          />
        </form>

        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-40 truncate text-sm text-neutral-400" title={email ?? undefined}>
            {email}
          </span>
        </div>
        <button type="button" onClick={() => void signOut()} className="text-sm text-neutral-300 hover:text-white">
          Sign out
        </button>
      </nav>
    </header>
  )
}
