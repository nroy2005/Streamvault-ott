import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { api, errorMessage } from '../api/client'
import type { AuthTokens } from '../api/types'
import { useAuth } from '../stores/auth'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const token = useAuth((s) => s.accessToken)
  const setTokens = useAuth((s) => s.setTokens)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'

  if (token) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post<AuthTokens>(`/auth/${mode}`, { email, password })
      setTokens(data, email) // re-render redirects via <Navigate>
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-md border border-neutral-700 bg-neutral-800/80 px-4 py-3 placeholder:text-neutral-500 focus:border-white focus:outline-none'

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,_#450a0a_0%,_#0a0a0a_60%)] px-4">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-3xl font-black tracking-tight text-red-600">STREAMVAULT</p>
        <form onSubmit={submit} className="space-y-4 rounded-xl bg-black/75 p-8 shadow-2xl sm:p-10">
          <h1 className="mb-2 text-3xl font-bold">{isLogin ? 'Sign In' : 'Create account'}</h1>

          {error && (
            <p role="alert" className="rounded-md bg-red-600/20 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <label className="block space-y-1">
            <span className="text-sm text-neutral-300">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-neutral-300">Password</span>
            <input
              type="password"
              required
              minLength={isLogin ? undefined : 8}
              maxLength={72}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
            {!isLogin && <span className="text-xs text-neutral-500">At least 8 characters.</span>}
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-red-600 py-3 font-semibold transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="pt-2 text-sm text-neutral-400">
            {isLogin ? 'New to StreamVault? ' : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} state={{ from }} className="font-medium text-white hover:underline">
              {isLogin ? 'Sign up now' : 'Sign in'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
