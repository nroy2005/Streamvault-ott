import { IsMongoId } from 'class-validator';

export class AddToWatchlistDto {
  @IsMongoId()
  movieId!: string;
}
