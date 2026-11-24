import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser, CurrentUser } from '../auth/jwt.strategy';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
@UseGuards(AuthGuard('jwt'))
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.watchlist.get(user.userId);
  }

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() dto: AddToWatchlistDto) {
    return this.watchlist.add(user.userId, dto.movieId);
  }

  @Delete(':movieId')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('movieId', ParseObjectIdPipe) movieId: string): Promise<void> {
    return this.watchlist.remove(user.userId, movieId);
  }
}
