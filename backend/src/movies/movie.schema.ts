import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Movie {
  @Prop({ required: true, unique: true })
  tmdbId!: number;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: [String], default: [], index: true })
  genres!: string[];

  @Prop({ type: Number, default: null })
  releaseYear!: number | null;

  @Prop({ type: String, default: null })
  posterUrl!: string | null;

  @Prop({ type: String, default: null })
  trailerUrl!: string | null;

  @Prop({ min: 0, max: 10, default: 0 })
  rating!: number;
}

export type MovieDocument = HydratedDocument<Movie>;
export const MovieSchema = SchemaFactory.createForClass(Movie);
// ponytail: $text matches whole words/stems only ("aveng" won't find "Avengers").
// Move to Atlas Search or a prefix regex if search-as-you-type is needed.
MovieSchema.index({ title: 'text', genres: 'text' }, { weights: { title: 10, genres: 2 }, name: 'movie_text' });
