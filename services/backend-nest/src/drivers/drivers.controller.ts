import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';

@Controller('drivers')
export class DriversController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('onboard')
  async onboard(@Req() req: any, @Body() body: any) {
    return this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: body });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch('profile')
  profile(@Req() req: any, @Body() body: any) { return this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: body }); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('service-info')
  async serviceInfo(@Req() req: any, @Body() body: any) {
    const { institutionIds = [], vehicle, ...rest } = body;
    await this.prisma.driverProfile.update({ where: { userId: req.user.userId }, data: rest });
    if (vehicle) {
      await this.prisma.vehicle.upsert({ where: { driverId: req.user.userId }, update: vehicle, create: { ...vehicle, driverId: req.user.userId } });
    }
    if (institutionIds.length) {
      await this.prisma.driverInstitution.deleteMany({ where: { driverId: req.user.userId } });
      await this.prisma.driverInstitution.createMany({ data: institutionIds.map((institutionId: string) => ({ driverId: req.user.userId, institutionId })) });
    }
    return { ok: true };
  }

  @Get('search')
  async search(@Query() q: any) {
    const radiusKm = Number(q.radius || 10) / 1000;
    const lat = Number(q.lat); const lng = Number(q.lng);
    const drivers = await this.prisma.driverProfile.findMany({
      where: { verificationStatus: 'VERIFIED', institutions: q.institutionId ? { some: { institutionId: q.institutionId } } : undefined },
      include: { vehicle: true },
    });
    return drivers.filter((d) => {
      if (!d.baseLat || !d.baseLng) return true;
      const dx = d.baseLat - lat; const dy = d.baseLng - lng;
      return Math.sqrt(dx * dx + dy * dy) < radiusKm / 111;
    });
  }
}
