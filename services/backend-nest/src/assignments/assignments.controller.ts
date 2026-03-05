import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private prisma: PrismaService) {}

  @Roles('PARENT')
  @Post('request')
  request(@Req() req: any, @Body() body: any) {
    return this.prisma.assignment.create({ data: { ...body, status: 'REQUESTED' } });
  }

  @Roles('DRIVER')
  @Get('incoming')
  incoming(@Req() req: any) { return this.prisma.assignment.findMany({ where: { driverId: req.user.userId, status: 'REQUESTED' }, include: { child: true } }); }

  @Roles('DRIVER')
  @Post(':id/accept')
  accept(@Req() req: any, @Param('id') id: string) { return this.prisma.assignment.update({ where: { id, driverId: req.user.userId } as any, data: { status: 'ACCEPTED' } }); }

  @Roles('DRIVER')
  @Post(':id/reject')
  reject(@Req() req: any, @Param('id') id: string) { return this.prisma.assignment.update({ where: { id, driverId: req.user.userId } as any, data: { status: 'REJECTED' } }); }
}
