import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { useAuth } from '../stores/auth'
import { AuthPage } from './AuthPage'

const fakeJwt = (email: string) => `x.${btoa(JSON.stringify({ sub: 'u1', email }))}.sig`

function renderLogin(from?: string) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: from ? { from } : null }]}>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/watchlist" element={<p>Watchlist page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

describe('Login flow', () => {
  beforeEach(() => {
    useAuth.setState({ accessToken: null, email: null, ready: true })
    localStorage.clear()
  })

  it('logs in, keeps the token in memory only, and redirects home', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: fakeJwt('ana@example.com') } })
    renderLogin()

    await fillAndSubmit('ana@example.com', 'password123')

    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'ana@example.com', password: 'password123' })
    expect(useAuth.getState().email).toBe('ana@example.com')
    expect(localStorage.length).toBe(0) // nothing for an XSS payload to steal from storage
  })

  it('returns to the page the user originally asked for', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: fakeJwt('ana@example.com') } })
    renderLogin('/watchlist')

    await fillAndSubmit('ana@example.com', 'password123')

    expect(await screen.findByText('Watchlist page')).toBeInTheDocument()
  })

  it('shows the server error and stays logged out on bad credentials', async () => {
    const response = { status: 401, data: { message: 'Invalid credentials' } } as AxiosResponse
    vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Unauthorized', '401', undefined, undefined, response))
    renderLogin()

    await fillAndSubmit('ana@example.com', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
    expect(useAuth.getState().accessToken).toBeNull()
  })
})
