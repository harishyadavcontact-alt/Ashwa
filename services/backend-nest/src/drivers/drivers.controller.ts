import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import {
  DriverOnboardSchema,
  DriverProfileSchema,
  DriverSearchQuerySchema,
  DriverServiceInfoSchema,
} from '@ashwa/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('drivers')
export class DriversController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('onboard')
  @UsePipes(new ZodValidationPipe(DriverOnboardSchema))
  async onboard(@Req() req: any, @Body() body: any) {
    return this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch('profile')
  @UsePipes(new ZodValidationPipe(DriverProfileSchema))
  profile(@Req() req: any, @Body() body: any) {
    return this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('service-info')
  @UsePipes(new ZodValidationPipe(DriverServiceInfoSchema))
  async serviceInfo(@Req() req: any, @Body() body: any) {
    const { institutionIds = [], vehicle, ...rest } = body;
    await this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: rest });
    if (vehicle) {
      await this.prisma.vehicle.upsert({
        where: { driverId: req.user.userId },
        update: vehicle,
        create: { ...vehicle, driverId: req.user.userId },
      });
    }
    await this.prisma.driverInstitution.deleteMany({ where: { driverId: req.user.userId } });
    if (institutionIds.length) {
      await this.prisma.driverInstitution.createMany({
        data: institutionIds.map((institutionId: string) => ({ driverId: req.user.userId, institutionId })),
      });
    }
    return { ok: true };
  }

  @Get('search')
  @UsePipes(new ZodValidationPipe(DriverSearchQuerySchema))
  async search(@Query() q: any) {
    const radiusKm = Number(q.radius) / 1000;
    const lat = Number(q.lat);
    const lng = Number(q.lng);
    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        institutions: q.institutionId ? { some: { institutionId: q.institutionId } } : undefined,
      },
      include: { vehicle: true, user: true, institutions: { include: { institution: true } } },
    });
    return drivers.filter((d) => {
      if (!d.baseLat || !d.baseLng) return true;
      const dx = d.baseLat - lat;
      const dy = d.baseLng - lng;
      return Math.sqrt(dx * dx + dy * dy) < radiusKm / 111;
    });
  }

  @Get(':id/summary')
  summary(@Param('id') id: string) {
    return this.prisma.driverProfile.findUnique({
      where: { userId: id },
      include: { vehicle: true, institutions: { include: { institution: true } }, user: true },
    });
  }
}
