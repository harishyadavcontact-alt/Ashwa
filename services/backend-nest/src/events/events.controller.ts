import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventTypeEnum } from '@ashwa/shared/src';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';
import { EventsService } from './events.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EventsController {
  constructor(private events: EventsService, private prisma: PrismaService) {}

  @Roles('DRIVER')
  @Post('trips/:id/event')
  emit(@Param('id') tripId: string, @Body() body: any) {
    return this.events.emit(tripId, body.childId, EventTypeEnum.parse(body.eventType), body.metadata);
  }

  @Roles('PARENT', 'DRIVER', 'ADMIN')
  @Get('events')
  async list(@Req() req: any, @Query('tripId') tripId: string) {
    if (req.user.role === 'PARENT') {
      return this.prisma.tripEvent.findMany({ where: { tripId, child: { parentId: req.user.userId } }, orderBy: { timestamp: 'asc' } });
    }
    return this.prisma.tripEvent.findMany({ where: { tripId }, orderBy: { timestamp: 'asc' } });
  }
}
