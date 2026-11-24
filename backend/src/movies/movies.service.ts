import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListMoviesDto } from './dto/list-movies.dto';
import { Movie, MovieDocument } from './movie.schema';

@Injectable()
export class MoviesService {
  constructor(@InjectModel(Movie.name) private readonly movies: Model<Movie>) {}

  async findAll({ genre, page, limit }: ListMoviesDto): Promise<{ items: MovieDocument[]; total: number; page: number }> {
    const filter = genre ? { genres: genre } : {};
    const [items, total] = await Promise.all([
      this.movies.find(filter).sort({ rating: -1 }).skip((page - 1) * limit).limit(limit),
      this.movies.countDocuments(filter),
    ]);
    return { items, total, page };
  }

  async findOne(id: string): Promise<MovieDocument> {
    const movie = await this.movies.findById(id);
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }
}
