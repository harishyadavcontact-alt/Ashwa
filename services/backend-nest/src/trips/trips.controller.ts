import { Body, Controller, Get, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  private readonly logger = new Logger(TripsController.name);
  constructor(private prisma: PrismaService) {}

  @Roles('DRIVER')
  @Post('start')
  async start(@Req() req: any, @Body() body: { tripType: 'MORNING' | 'AFTERNOON' }) {
    const assignments = await this.prisma.assignment.findMany({ where: { driverId: req.user.userId, status: 'ACCEPTED' }, include: { child: { include: { institution: true } } } });
    if (!assignments.length) return { message: 'No accepted assignments' };
    const institutionId = assignments[0].child.institutionId;
    const rt = await this.prisma.routeTemplate.upsert({
      where: { id: `${req.user.userId}-${institutionId}-${body.tripType}` },
      update: {},
      create: { id: `${req.user.userId}-${institutionId}-${body.tripType}`, driverId: req.user.userId, institutionId, tripType: body.tripType },
    });
    const trip = await this.prisma.trip.create({ data: { routeTemplateId: rt.id, date: new Date(), tripType: body.tripType, status: 'ACTIVE' } });

    const stops = body.tripType === 'MORNING'
      ? [...assignments.map(a => ({ stopType: 'PICKUP', childId: a.child.id, lat: a.child.pickupLat, lng: a.child.pickupLng, address: a.child.pickupAddress })),
         { stopType: 'SCHOOL', childId: null, lat: assignments[0].child.institution.lat, lng: assignments[0].child.institution.lng, address: assignments[0].child.institution.address }]
      : [{ stopType: 'SCHOOL', childId: null, lat: assignments[0].child.institution.lat, lng: assignments[0].child.institution.lng, address: assignments[0].child.institution.address },
         ...assignments.map(a => ({ stopType: 'DROP', childId: a.child.id, lat: a.child.dropLat, lng: a.child.dropLng, address: a.child.dropAddress }))];

    await this.prisma.tripStop.createMany({ data: stops.map((s, i) => ({ ...s, tripId: trip.id, sequenceIndex: i })) });
    this.logger.log(`trip start: ${trip.id}`);
    return trip;
  }

  @Roles('DRIVER')
  @Post(':id/end')
  async end(@Req() req: any, @Param('id') id: string) {
    const trip = await this.prisma.trip.update({ where: { id }, data: { status: 'ENDED', endedAt: new Date() } });
    this.logger.log(`trip end: ${trip.id}`);
    return trip;
  }

  @Get('today')
  async today(@Req() req: any, @Query('childId') childId?: string) {
    if (req.user.role === 'DRIVER') return this.prisma.trip.findMany({ where: { routeTemplate: { driverId: req.user.userId } }, orderBy: { startedAt: 'desc' }, take: 1, include: { stops: true, events: true } });
    if (req.user.role === 'PARENT') {
      return this.prisma.trip.findMany({
        where: { events: { some: { child: { parentId: req.user.userId }, ...(childId ? { childId } : {}) } } },
        include: { stops: true, events: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      });
    }
    return [];
  }
}
