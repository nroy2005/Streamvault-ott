import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from '../movies/movies.module';
import { WatchlistController } from './watchlist.controller';
import { WatchlistItem, WatchlistItemSchema } from './watchlist.schema';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: WatchlistItem.name, schema: WatchlistItemSchema }]), MoviesModule],
  controllers: [WatchlistController],
  providers: [WatchlistService],
})
export class WatchlistModule {}
