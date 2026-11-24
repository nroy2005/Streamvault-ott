import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from '../movies/movies.module';
import { PlaybackController } from './playback.controller';
import { Playback, PlaybackSchema } from './playback.schema';
import { PlaybackService } from './playback.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Playback.name, schema: PlaybackSchema }]), MoviesModule],
  controllers: [PlaybackController],
  providers: [PlaybackService],
})
export class PlaybackModule {}
