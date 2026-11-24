import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser, CurrentUser } from '../auth/jwt.strategy';
import { SavePlaybackDto } from './dto/save-playback.dto';
import { PlaybackService } from './playback.service';

@Controller('playback')
@UseGuards(AuthGuard('jwt'))
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Get()
  continueWatching(@CurrentUser() user: AuthUser) {
    return this.playback.continueWatching(user.userId);
  }

  @Get(':movieId')
  get(@CurrentUser() user: AuthUser, @Param('movieId', ParseObjectIdPipe) movieId: string) {
    return this.playback.get(user.userId, movieId);
  }

  // Upsert, so 200 rather than 201: repeated saves update the same record.
  @Post()
  @HttpCode(200)
  save(@CurrentUser() user: AuthUser, @Body() dto: SavePlaybackDto) {
    return this.playback.save(user.userId, dto.movieId, dto.positionSeconds);
  }
}
