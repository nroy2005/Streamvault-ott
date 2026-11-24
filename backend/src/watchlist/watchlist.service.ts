import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from '../movies/movie.schema';
import { MoviesService } from '../movies/movies.service';
import { WatchlistItem } from './watchlist.schema';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectModel(WatchlistItem.name) private readonly items: Model<WatchlistItem>,
    private readonly movies: MoviesService,
  ) {}

  async get(userId: string): Promise<Movie[]> {
    const items = await this.items
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate<{ movieId: Movie | null }>('movieId');
    return items.flatMap((i) => i.movieId ?? []);
  }

  // Idempotent: adding twice is a no-op.
  async add(userId: string, movieId: string): Promise<MovieDocument> {
    const movie = await this.movies.findOne(movieId);
    await this.items.updateOne({ userId, movieId }, {}, { upsert: true });
    return movie;
  }

  async remove(userId: string, movieId: string): Promise<void> {
    await this.items.deleteOne({ userId, movieId });
  }
}
