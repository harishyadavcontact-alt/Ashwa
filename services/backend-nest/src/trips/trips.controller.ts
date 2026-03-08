import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TripStartSchema } from '@ashwa/shared';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { summarizeDriverTrust } from '../drivers/driver-trust';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  private readonly logger = new Logger(TripsController.name);

  constructor(private prisma: PrismaService) {}

  @Roles('DRIVER')
  @Post('start')
  @UsePipes(new ZodValidationPipe(TripStartSchema))
  async start(@Req() req: any, @Body() body: { tripType: 'MORNING' | 'AFTERNOON' }) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: req.user.userId },
      include: { vehicle: true, institutions: true },
    });
    if (!driver || !summarizeDriverTrust(driver as any).isServiceReady) {
      throw new BadRequestException('Driver profile is not service-ready');
    }

    const activeTrip = await this.prisma.trip.findFirst({
      where: {
        status: 'ACTIVE',
        routeTemplate: { driverId: req.user.userId },
        tripType: body.tripType,
      },
      include: { stops: true, events: true },
      orderBy: { startedAt: 'desc' },
    });
    if (activeTrip) {
      return activeTrip;
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { driverId: req.user.userId, status: 'ACCEPTED' },
      include: { child: { include: { institution: true } } },
    });
    if (!assignments.length) return { message: 'No accepted assignments' };

    const institutionId = assignments[0].child.institutionId;
    const routeTemplateId = `${req.user.userId}-${institutionId}-${body.tripType}`;
    const rt = await this.prisma.routeTemplate.upsert({
      where: { id: routeTemplateId },
      update: {},
      create: {
        id: routeTemplateId,
        driverId: req.user.userId,
        institutionId,
        tripType: body.tripType,
      },
    });

    const trip = await this.prisma.trip.create({
      data: { routeTemplateId: rt.id, date: new Date(), tripType: body.tripType, status: 'ACTIVE' },
    });

    const stops =
      body.tripType === 'MORNING'
        ? [
            ...assignments.map((a) => ({
              stopType: 'PICKUP',
              childId: a.child.id,
              lat: a.child.pickupLat,
              lng: a.child.pickupLng,
              address: a.child.pickupAddress,
            })),
            {
              stopType: 'SCHOOL',
              childId: null,
              lat: assignments[0].child.institution.lat,
              lng: assignments[0].child.institution.lng,
              address: assignments[0].child.institution.address,
            },
          ]
        : [
            {
              stopType: 'SCHOOL',
              childId: null,
              lat: assignments[0].child.institution.lat,
              lng: assignments[0].child.institution.lng,
              address: assignments[0].child.institution.address,
            },
            ...assignments.map((a) => ({
              stopType: 'DROP',
              childId: a.child.id,
              lat: a.child.dropLat,
              lng: a.child.dropLng,
              address: a.child.dropAddress,
            })),
          ];

    await this.prisma.tripStop.createMany({
      data: stops.map((s, i) => ({ ...s, stopType: s.stopType as any, tripId: trip.id, sequenceIndex: i })),
    });
    this.logger.log(`trip start: ${trip.id}`);
    return this.prisma.trip.findUnique({ where: { id: trip.id }, include: { stops: true, events: true } });
  }

  @Roles('DRIVER')
  @Post(':id/end')
  async end(@Req() req: any, @Param('id') id: string) {
    const existing = await this.prisma.trip.findFirst({
      where: { id, routeTemplate: { driverId: req.user.userId }, status: 'ACTIVE' },
    });
    if (!existing) {
      throw new NotFoundException('Active trip not found');
    }

    const trip = await this.prisma.trip.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    this.logger.log(`trip end: ${trip.id}`);
    return trip;
  }

  @Get('current')
  current(@Req() req: any, @Query('tripType') tripType?: 'MORNING' | 'AFTERNOON') {
    if (req.user.role === 'DRIVER') {
      return this.prisma.trip.findFirst({
        where: {
          routeTemplate: { driverId: req.user.userId },
          ...(tripType ? { tripType } : {}),
          status: 'ACTIVE',
        },
        include: { stops: true, events: true, pings: { orderBy: { timestamp: 'desc' }, take: 1 } },
        orderBy: { startedAt: 'desc' },
      });
    }

    return this.prisma.trip.findFirst({
      where: {
        status: 'ACTIVE',
        stops: { some: { child: { parentId: req.user.userId } } },
        ...(tripType ? { tripType } : {}),
      },
      include: { stops: true, events: true, pings: { orderBy: { timestamp: 'desc' }, take: 1 } },
      orderBy: { startedAt: 'desc' },
    });
  }

  @Get('today')
  async today(@Req() req: any, @Query('childId') childId?: string) {
    if (req.user.role === 'DRIVER') {
      return this.prisma.trip.findMany({
        where: { routeTemplate: { driverId: req.user.userId } },
        orderBy: { startedAt: 'desc' },
        take: 1,
        include: { stops: true, events: true },
      });
    }

    if (req.user.role === 'PARENT') {
      return this.prisma.trip.findMany({
        where: { stops: { some: { child: { parentId: req.user.userId }, ...(childId ? { childId } : {}) } } },
        include: { stops: true, events: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      });
    }

    return [];
  }
}
