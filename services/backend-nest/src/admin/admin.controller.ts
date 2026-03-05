import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('drivers')
  listDrivers() { return this.prisma.driverProfile.findMany({ include: { vehicle: true, user: true } }); }

  @Post('drivers/:driverId/verify')
  verify(@Param('driverId') driverId: string) {
    return this.prisma.driverProfile.update({ where: { userId: driverId }, data: { verificationStatus: 'VERIFIED' } });
  }

  @Post('drivers/:driverId/suspend')
  suspend(@Param('driverId') driverId: string) {
    return this.prisma.driverProfile.update({ where: { userId: driverId }, data: { verificationStatus: 'SUSPENDED' } });
  }
}
