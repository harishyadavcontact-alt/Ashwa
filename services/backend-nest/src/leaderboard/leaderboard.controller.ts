import { Controller, Get, Query } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

@Controller('api/leaderboard')
export class LeaderboardController {
  @Get('drivers')
  getDriverLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return dummyStore.getLeaderboard(limitNum);
  }
}
