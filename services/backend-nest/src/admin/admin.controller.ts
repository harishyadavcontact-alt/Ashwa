import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';
import { summarizeDriverTrust } from '../drivers/driver-trust';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('drivers')
  async listDrivers(@Query('status') status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const drivers = await this.prisma.driverProfile.findMany({
      where: status ? { verificationStatus: status } : undefined,
      include: { vehicle: true, user: true, institutions: true },
    });
    return drivers.map((driver) => ({ ...driver, trust: summarizeDriverTrust(driver as any) }));
  }

  @Get('drivers/review-queue')
  async reviewQueue() {
    const drivers = await this.prisma.driverProfile.findMany({
      include: { vehicle: true, user: true, institutions: true },
    });
    const items = drivers
      .map((driver) => ({ ...driver, trust: summarizeDriverTrust(driver as any) }))
      .sort((left, right) => {
        const leftWeight = left.trust.isServiceReady ? 2 : 1;
        const rightWeight = right.trust.isServiceReady ? 2 : 1;
        return leftWeight - rightWeight;
      });

    return {
      counts: {
        pending: items.filter((item) => item.verificationStatus === 'PENDING').length,
        verified: items.filter((item) => item.verificationStatus === 'VERIFIED').length,
        rejected: items.filter((item) => item.verificationStatus === 'REJECTED').length,
        suspended: items.filter((item) => item.verificationStatus === 'SUSPENDED').length,
        serviceReady: items.filter((item) => item.trust.isServiceReady).length,
      },
      drivers: items,
    };
  }

  @Post('drivers/:driverId/verify')
  verify(@Param('driverId') driverId: string) {
    return this.prisma.driverProfile.update({ where: { userId: driverId }, data: { verificationStatus: 'VERIFIED' } });
  }

  @Post('drivers/:driverId/reject')
  reject(@Param('driverId') driverId: string) {
    return this.prisma.driverProfile.update({ where: { userId: driverId }, data: { verificationStatus: 'REJECTED' } });
  }

  @Post('drivers/:driverId/suspend')
  suspend(@Param('driverId') driverId: string) {
    return this.prisma.driverProfile.update({ where: { userId: driverId }, data: { verificationStatus: 'SUSPENDED' } });
  }
}
