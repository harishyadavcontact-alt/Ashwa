import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TrackingGateway } from './tracking.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
@Controller('tracking')
export class TrackingController {
  constructor(private prisma: PrismaService, private gateway: TrackingGateway) {}
  @Post('ping')
  async ping(@Req() req: any, @Body() body: any) {
    const ping = await this.prisma.locationPing.create({ data: { driverId: req.user.userId, tripId: body.tripId, lat: body.lat, lng: body.lng } });
    this.gateway.broadcastLocation(ping);
    return ping;
  }
}
