import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { env } from './common/env';
import { MoviesModule } from './movies/movies.module';
import { PlaybackModule } from './playback/playback.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({ useFactory: () => ({ uri: env('MONGO_URI') }) }),
    AuthModule,
    MoviesModule,
    WatchlistModule,
    PlaybackModule,
  ],
})
export class AppModule {}
