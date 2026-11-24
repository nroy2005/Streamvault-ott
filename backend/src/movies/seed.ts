import mongoose from 'mongoose';
import { env } from '../common/env';
import { Movie, MovieSchema } from './movie.schema';

interface TmdbMovie {
  id: number;
  title: string;
  genre_ids: number[];
  release_date?: string;
  poster_path: string | null;
  vote_average: number;
}

interface TmdbVideo {
  site: string;
  type: string;
  key: string;
  official: boolean;
}

const PAGES = 3; // 20 movies per page

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.search = new URLSearchParams({ ...params, api_key: env('TMDB_API_KEY') }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function main(): Promise<void> {
  const { genres } = await tmdb<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
  const genreName = new Map(genres.map((g) => [g.id, g.name]));

  const found = new Map<number, TmdbMovie>();
  for (let page = 1; page <= PAGES; page++) {
    const { results } = await tmdb<{ results: TmdbMovie[] }>('/movie/popular', { page: String(page) });
    results.forEach((m) => found.set(m.id, m));
  }

  const docs: Movie[] = [];
  // Sequential on purpose: stays well under TMDB's rate limit.
  for (const m of found.values()) {
    const { results } = await tmdb<{ results: TmdbVideo[] }>(`/movie/${m.id}/videos`);
    const trailers = results.filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
    const trailer = trailers.find((v) => v.official) ?? trailers[0];
    docs.push({
      tmdbId: m.id,
      title: m.title,
      genres: m.genre_ids.flatMap((id) => genreName.get(id) ?? []),
      releaseYear: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      rating: m.vote_average,
    });
  }

  await mongoose.connect(env('MONGO_URI'));
  const MovieModel = mongoose.model(Movie.name, MovieSchema);
  const result = await MovieModel.bulkWrite(
    docs.map((doc) => ({ updateOne: { filter: { tmdbId: doc.tmdbId }, update: { $set: doc }, upsert: true } })),
  );
  console.log(`Seeded ${docs.length} movies (${result.upsertedCount} new, ${result.modifiedCount} updated).`);
  await mongoose.disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
