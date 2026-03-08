import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private messaging?: admin.messaging.Messaging;

  constructor(private prisma: PrismaService) {
    try {
      if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
        const creds = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
        this.messaging = admin.messaging();
      }
    } catch {
      this.logger.warn('FCM disabled: invalid credentials');
    }
  }

  async emit(driverId: string, tripId: string, childId: string, eventType: string, metadata?: any) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, status: 'ACTIVE', routeTemplate: { driverId } },
      include: { stops: true },
    });
    if (!trip) {
      throw new BadRequestException('Trip not found for driver');
    }

    const childStop = trip.stops.find((stop) => stop.childId === childId);
    if (!childStop) {
      throw new BadRequestException('Child is not part of the active trip');
    }

    try {
      const event = await this.prisma.tripEvent.create({ data: { tripId, childId, eventType: eventType as any, metadata } });
      this.logger.log(`event emitted trip=${tripId} child=${childId} type=${eventType}`);
      await this.notifyParent(childId, eventType, tripId);
      return { created: true, event };
    } catch (e: any) {
      if (e.code === 'P2002') return { created: false, reason: 'duplicate_event' };
      throw e;
    }
  }

  async notifyParent(childId: string, eventType: string, tripId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) return;
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId: child.parentId } });
    if (!tokens.length) return;
    if (!this.messaging) {
      this.logger.warn(`notification skipped (FCM disabled) event=${eventType}`);
      return;
    }
    const res = await this.messaging.sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title: 'Ashwa Trip Update', body: `${eventType.replaceAll('_', ' ')}` },
      data: { tripId, childId, eventType },
    });
    this.logger.log(`notification sent success=${res.successCount} fail=${res.failureCount}`);
  }
}
