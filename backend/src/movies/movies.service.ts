import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder } from 'mongoose';
import { ListMoviesDto } from './dto/list-movies.dto';
import { Movie, MovieDocument } from './movie.schema';

export interface MoviePage {
  items: MovieDocument[];
  total: number;
  page: number;
  limit: number;
}

type MovieSort = Record<string, SortOrder | { $meta: 'textScore' }>;

/**
 * Regex source matching `term` literally (metacharacters escaped) at the start of any word,
 * so "aveng" matches "Avengers" and "man" matches "Spider-Man" but not "Batman".
 * Use with the `i` option; MongoDB patterns are UTF-8, so \p{P} covers Unicode punctuation.
 */
export function wordPrefixPattern(term: string): string {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `(?:^|[\\s\\p{P}])${escaped}`;
}

@Injectable()
export class MoviesService {
  constructor(@InjectModel(Movie.name) private readonly movies: Model<Movie>) {}

  async findAll({ search, genre, page, limit }: ListMoviesDto): Promise<MoviePage> {
    const base: QueryFilter<Movie> = genre ? { genres: genre } : {};
    const term = search?.trim();
    if (!term) return this.findPage(base, { rating: -1 }, page, limit);

    // 1. Full-text search: whole words/stems, ranked by relevance, uses the text index.
    const text = await this.findPage({ ...base, $text: { $search: term } }, { score: { $meta: 'textScore' }, rating: -1 }, page, limit);
    if (text.total > 0) return text;

    // 2. Fallback for half-typed words ("aveng" → "Avengers"), case-insensitive.
    // ponytail: this regex can't use an index (collection scan). Fine for a catalog in the
    // thousands; move to Atlas Search autocomplete if the catalog grows large.
    const prefix = { $regex: wordPrefixPattern(term), $options: 'i' };
    return this.findPage({ ...base, $or: [{ title: prefix }, { genres: prefix }] }, { rating: -1 }, page, limit);
  }

  async findOne(id: string): Promise<MovieDocument> {
    const movie = await this.movies.findById(id);
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }

  private async findPage(filter: QueryFilter<Movie>, sort: MovieSort, page: number, limit: number): Promise<MoviePage> {
    const [items, total] = await Promise.all([
      this.movies.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      this.movies.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
}
