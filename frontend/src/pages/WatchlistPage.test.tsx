import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import type { Movie } from '../api/types'
import { MovieCard } from '../components/MovieCard'
import { useWatchlist } from '../stores/watchlist'
import { WatchlistPage } from './WatchlistPage'

const movie: Movie = {
  _id: '507f1f77bcf86cd799439011',
  tmdbId: 1,
  title: 'Inception',
  genres: ['Science Fiction'],
  releaseYear: 2010,
  posterUrl: null,
  trailerUrl: null,
  rating: 8.4,
}

// A browse card plus the My List page, sharing the real Zustand store.
function renderCardAndList() {
  render(
    <MemoryRouter>
      <section aria-label="Browse">
        <MovieCard movie={movie} />
      </section>
      <WatchlistPage />
    </MemoryRouter>,
  )
  return within(screen.getByRole('region', { name: 'Browse' }))
}

describe('Watchlist flow', () => {
  beforeEach(() => useWatchlist.setState({ items: [], loading: false }))

  it('adds a movie: calls the API and shows it in My List', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: movie })
    const browse = renderCardAndList()
    expect(screen.getByText(/your list is empty/i)).toBeInTheDocument()

    await userEvent.click(browse.getByRole('button', { name: 'Add Inception to My List' }))

    expect(post).toHaveBeenCalledWith('/watchlist', { movieId: movie._id })
    expect(browse.getByRole('button', { name: 'Remove Inception from My List' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText(/your list is empty/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Inception' })).toHaveLength(2) // browse card + My List entry
  })

  it('rolls back the optimistic add when the API fails', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('network down'))
    const browse = renderCardAndList()

    await userEvent.click(browse.getByRole('button', { name: 'Add Inception to My List' }))

    expect(await browse.findByRole('button', { name: 'Add Inception to My List' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/your list is empty/i)).toBeInTheDocument()
  })

  it('removes a movie: calls DELETE and empties My List', async () => {
    useWatchlist.setState({ items: [movie] })
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined })
    const browse = renderCardAndList()

    await userEvent.click(browse.getByRole('button', { name: 'Remove Inception from My List' }))

    expect(del).toHaveBeenCalledWith(`/watchlist/${movie._id}`)
    expect(screen.getByText(/your list is empty/i)).toBeInTheDocument()
  })
})
