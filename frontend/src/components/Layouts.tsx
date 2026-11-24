import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../stores/auth'
import { useWatchlist } from '../stores/watchlist'
import { Navbar } from './Navbar'

/** Gate for logged-in routes; also loads the user's watchlist once per login. */
export function RequireAuth() {
  const token = useAuth((s) => s.accessToken)
  const load = useWatchlist((s) => s.load)
  const location = useLocation()

  useEffect(() => {
    if (token) void load().catch(() => {})
  }, [token, load])

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

export function AppShell() {
  return (
    <>
      <Navbar />
      <main className="pb-16">
        <Outlet />
      </main>
    </>
  )
}
