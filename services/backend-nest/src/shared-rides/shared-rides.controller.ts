import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharedRidesService } from './shared-rides.service';

@Controller('api/shared-rides')
@UseGuards(AuthGuard('jwt'))
export class SharedRidesController {
  constructor(private sharedRidesService: SharedRidesService) {}

  @Post('match')
  async matchParentsForSharedRide(
    @Body() body: any,
    @Request() req: any,
  ): Promise<{ data: any }> {
    const driverId = req.user.userId;
    if (body.driverId !== driverId && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    const groups = await this.sharedRidesService.findSharedRideMatches(
      body.serviceId,
      body.driverId,
      body.timeWindowMinutes,
    );
    return { data: groups };
  }

  @Get('options/:childId/:serviceId')
  async getRideOptions(
    @Param('childId') childId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ data: any }> {
    const options = await this.sharedRidesService.getRideOptions(serviceId, childId);
    return { data: options };
  }

  @Post('enroll')
  async enrollInSharedRide(
    @Body() body: any,
    @Request() req: any,
  ): Promise<{ data: any }> {
    const result = await this.sharedRidesService.enrollInSharedRide(
      body.enrollmentId,
      body.groupId || '',
      body.enrollmentType,
    );
    return { data: result };
  }

  @Get('driver/:driverId/seat-allocation/:serviceId')
  async getDriverSeatAllocation(
    @Param('driverId') driverId: string,
    @Param('serviceId') serviceId: string,
    @Request() req: any,
  ): Promise<{ data: any }> {
    if (req.user.userId !== driverId && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    const allocation = await this.sharedRidesService.getDriverSeatAllocation(
      driverId,
      serviceId,
    );
    return { data: allocation };
  }
}
