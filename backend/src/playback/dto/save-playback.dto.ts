import { IsNumber, Min } from 'class-validator';

export class SavePlaybackDto {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  positionSeconds!: number;
}
