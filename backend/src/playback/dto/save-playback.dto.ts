import { IsMongoId, IsNumber, Min } from 'class-validator';

export class SavePlaybackDto {
  @IsMongoId()
  movieId!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  positionSeconds!: number;
}
