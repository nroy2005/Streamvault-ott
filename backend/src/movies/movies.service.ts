import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder } from 'mongoose';
import { ListMoviesDto } from './dto/list-movies.dto';
import { Movie, MovieDocument } from './movie.schema';

@Injectable()
export class MoviesService {
  constructor(@InjectModel(Movie.name) private readonly movies: Model<Movie>) {}

  async findAll({ search, genre, page, limit }: ListMoviesDto): Promise<{ items: MovieDocument[]; total: number; page: number; limit: number }> {
    const filter: QueryFilter<Movie> = {};
    if (genre) filter.genres = genre;
    if (search?.trim()) filter.$text = { $search: search.trim() };
    // Best text match first when searching, otherwise highest rated.
    const sort: Record<string, SortOrder | { $meta: 'textScore' }> = filter.$text
      ? { score: { $meta: 'textScore' }, rating: -1 }
      : { rating: -1 };
    const [items, total] = await Promise.all([
      this.movies.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      this.movies.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<MovieDocument> {
    const movie = await this.movies.findById(id);
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }
}
