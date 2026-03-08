import {
  BadRequestException,
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
import { summarizeDriverTrust } from '../drivers/driver-trust';
import { presentAssignmentState } from '../current-state/presenters';

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

    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: body.driverId },
      include: { vehicle: true, institutions: true },
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const trust = summarizeDriverTrust(driver as any);
    if (!trust.isParentVisible) {
      throw new BadRequestException('Driver is not requestable yet');
    }

    return this.prisma.assignment.create({ data: { ...body, status: 'REQUESTED' } });
  }

  @Roles('DRIVER')
  @Get('incoming')
  async incoming(@CurrentUser() user: AuthUser) {
    const assignments = await this.prisma.assignment.findMany({
      where: { driverId: user.userId, status: 'REQUESTED' },
      include: { child: { include: { institution: true } }, driver: { include: { vehicle: true, user: true, institutions: { include: { institution: true } } } } },
    });
    return presentAssignmentState('DRIVER', assignments);
  }

  @Roles('PARENT', 'DRIVER')
  @Get('current')
  async current(@CurrentUser() user: AuthUser) {
    if (user.role === 'PARENT') {
      const assignments = await this.prisma.assignment.findMany({
        where: { child: { parentId: user.userId }, status: 'ACCEPTED' },
        include: {
          child: { include: { institution: true } },
          driver: { include: { vehicle: true, user: true, institutions: { include: { institution: true } } } },
        },
        orderBy: { startDate: 'desc' },
      });
      return presentAssignmentState('PARENT', assignments);
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { driverId: user.userId, status: 'ACCEPTED' },
      include: {
        child: { include: { institution: true } },
        driver: { include: { vehicle: true, user: true, institutions: { include: { institution: true } } } },
      },
      orderBy: { startDate: 'desc' },
    });
    return presentAssignmentState('DRIVER', assignments);
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
