import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Playback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Movie', required: true })
  movieId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  positionSeconds!: number;
}

export const PlaybackSchema = SchemaFactory.createForClass(Playback);
PlaybackSchema.index({ userId: 1, movieId: 1 }, { unique: true });
PlaybackSchema.index({ userId: 1, updatedAt: -1 });
