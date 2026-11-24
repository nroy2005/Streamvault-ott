import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class WatchlistItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Movie', required: true })
  movieId!: Types.ObjectId;
}

export const WatchlistItemSchema = SchemaFactory.createForClass(WatchlistItem);
WatchlistItemSchema.index({ userId: 1, movieId: 1 }, { unique: true });
