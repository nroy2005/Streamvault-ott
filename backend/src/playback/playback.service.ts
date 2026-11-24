import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from '../movies/movie.schema';
import { MoviesService } from '../movies/movies.service';
import { Playback } from './playback.schema';

export interface PlaybackPosition {
  movieId: string;
  positionSeconds: number;
}

@Injectable()
export class PlaybackService {
  constructor(
    @InjectModel(Playback.name) private readonly playback: Model<Playback>,
    private readonly movies: MoviesService,
  ) {}

  async save(userId: string, movieId: string, positionSeconds: number): Promise<PlaybackPosition> {
    await this.movies.findOne(movieId); // 404 for unknown movies
    await this.playback.updateOne({ userId, movieId }, { positionSeconds }, { upsert: true });
    return { movieId, positionSeconds };
  }

  async get(userId: string, movieId: string): Promise<PlaybackPosition> {
    const entry = await this.playback.findOne({ userId, movieId });
    return { movieId, positionSeconds: entry?.positionSeconds ?? 0 };
  }

  // "Continue watching" row: most recently played first.
  async continueWatching(userId: string): Promise<{ movie: Movie; positionSeconds: number }[]> {
    const entries = await this.playback
      .find({ userId, positionSeconds: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate<{ movieId: Movie | null }>('movieId');
    return entries.flatMap((e) => (e.movieId ? [{ movie: e.movieId, positionSeconds: e.positionSeconds }] : []));
  }
}
