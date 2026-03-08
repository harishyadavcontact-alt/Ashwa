import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AssignmentRequestSchema, AuthUser } from '@ashwa/shared';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private prisma: PrismaService) {}

  @Roles('PARENT')
  @Post('request')
  @UsePipes(new ZodValidationPipe(AssignmentRequestSchema))
  async request(@CurrentUser() user: AuthUser, @Body() body: any) {
    const child = await this.prisma.child.findFirst({
      where: { id: body.childId, parentId: user.userId },
    });
    if (!child) {
      throw new NotFoundException('Child not found for parent');
    }

    return this.prisma.assignment.create({ data: { ...body, status: 'REQUESTED' } });
  }

  @Roles('DRIVER')
  @Get('incoming')
  incoming(@CurrentUser() user: AuthUser) {
    return this.prisma.assignment.findMany({
      where: { driverId: user.userId, status: 'REQUESTED' },
      include: { child: true },
    });
  }

  @Roles('PARENT', 'DRIVER')
  @Get('current')
  current(@CurrentUser() user: AuthUser) {
    if (user.role === 'PARENT') {
      return this.prisma.assignment.findFirst({
        where: { child: { parentId: user.userId }, status: 'ACCEPTED' },
        include: { child: true, driver: { include: { vehicle: true, user: true } } },
        orderBy: { startDate: 'desc' },
      });
    }

    return this.prisma.assignment.findMany({
      where: { driverId: user.userId, status: 'ACCEPTED' },
      include: { child: true },
      orderBy: { startDate: 'desc' },
    });
  }

  @Roles('DRIVER')
  @Post(':id/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id, driverId: user.userId } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.prisma.assignment.update({ where: { id }, data: { status: 'ACCEPTED' } });
  }

  @Roles('DRIVER')
  @Post(':id/reject')
  async reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id, driverId: user.userId } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.prisma.assignment.update({ where: { id }, data: { status: 'REJECTED' } });
  }
}
