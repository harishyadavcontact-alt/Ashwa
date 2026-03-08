import { Body, Controller, NotFoundException, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { TrackingPingSchema } from '@ashwa/shared';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TrackingGateway } from './tracking.gateway';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
@Controller('tracking')
export class TrackingController {
  constructor(private prisma: PrismaService, private gateway: TrackingGateway) {}

  @Post('ping')
  @UsePipes(new ZodValidationPipe(TrackingPingSchema))
  async ping(@Req() req: any, @Body() body: any) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: body.tripId, status: 'ACTIVE', routeTemplate: { driverId: req.user.userId } },
    });
    if (!trip) {
      throw new NotFoundException('Active trip not found');
    }

    const ping = await this.prisma.locationPing.create({
      data: { driverId: req.user.userId, tripId: body.tripId, lat: body.lat, lng: body.lng },
    });
    this.gateway.broadcastLocation(ping);
    return ping;
  }
}
