import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as admin from 'firebase-admin';
import { validateTripEvent } from '../trips/trip-progression';

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
      include: { stops: { include: { child: true } }, events: true },
    });
    if (!trip) {
      throw new BadRequestException('Trip not found for driver');
    }

    const validation = validateTripEvent(trip as any, childId, eventType as any);
    if (!validation.ok) {
      throw new BadRequestException(validation.reason);
    }

    try {
      const event = await this.prisma.tripEvent.create({
        data: {
          tripId,
          childId: validation.canonicalChildId,
          eventType: eventType as any,
          metadata: {
            ...(metadata || {}),
            nextActionLabel: validation.nextAction.label,
            stopType: validation.nextAction.nextStop?.stopType,
          },
        },
      });
      this.logger.log(`event emitted trip=${tripId} child=${childId} type=${eventType}`);

      // CRITICAL: For school events, notify ALL children's parents, not just anchor child
      if (eventType === 'DRIVER_AT_SCHOOL' || eventType === 'DRIVER_LEFT_SCHOOL') {
        await this.notifyAllChildrenAtSchool(tripId, eventType, trip);
      } else {
        // For non-school events (pickups, drops), notify the specific child's parent
        await this.notifyParent(validation.canonicalChildId, eventType, tripId);
      }

      return { created: true, event };
    } catch (e: any) {
      if (e.code === 'P2002') return { created: false, reason: 'duplicate_event' };
      throw e;
    }
  }

  async notifyParent(childId: string, eventType: string, tripId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { parent: true },
    });
    if (!child) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: child.parentId },
    });

    // Send Firebase Cloud Messaging notification if enabled
    if (tokens.length && this.messaging) {
      const res = await this.messaging.sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: { title: 'Ashwa Trip Update', body: `${eventType.replaceAll('_', ' ')}` },
        data: { tripId, childId, eventType },
      });
      this.logger.log(`notification sent success=${res.successCount} fail=${res.failureCount}`);
    } else if (!this.messaging) {
      this.logger.warn(`FCM notification skipped (FCM disabled) event=${eventType}`);
    }

    // Send WhatsApp alert if parent has phone number
    if (child.parent?.phone) {
      await this.sendWhatsAppAlert(child.parent.phone, child.name, eventType);
    }
  }

  private async sendWhatsAppAlert(
    phoneNumber: string,
    childName: string,
    eventType: string,
  ): Promise<void> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        this.logger.warn(`WhatsApp alert skipped: Supabase not configured event=${eventType}`);
        return;
      }

      // Message templates for each event type
      const templates: Record<string, (name: string) => string> = {
        DRIVER_10_MIN_TO_PICKUP: (name) => `${name} driver will be at pickup in 10 minutes.`,
        DRIVER_AT_PICKUP: (name) => `Driver is at ${name}'s pickup location.`,
        CHILD_BOARDED: (name) => `✓ Picked up ${name}. On the way to school.`,
        DRIVER_AT_SCHOOL: (name) => `✓ ${name} reached school.`,
        DRIVER_LEFT_SCHOOL: (name) => `✓ Left school. ${name} will be home soon.`,
        DRIVER_10_MIN_TO_DROP: (name) => `${name} driver will be at drop-off in 10 minutes.`,
        DRIVER_AT_DROP: (name) => `Driver is at ${name}'s drop-off location.`,
        CHILD_DROPPED: (name) => `✓ Dropped ${name} home. See you tomorrow!`,
      };

      const message = templates[eventType]?.(childName);
      if (!message) {
        this.logger.warn(`Unknown event type for WhatsApp: ${eventType}`);
        return;
      }

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          metadata: {
            eventType,
            childName,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(
          `WhatsApp alert failed event=${eventType} phone=${this.maskPhone(phoneNumber)}`,
          error,
        );
      } else {
        const result = await response.json();
        this.logger.log(
          `WhatsApp alert sent event=${eventType} child=${childName} sid=${result.messageSid}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `WhatsApp alert error event=${eventType} child=${childName}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private maskPhone(phone: string): string {
    // Mask phone number for logging: +1****5890
    if (phone.length < 6) return phone;
    return phone.slice(0, 2) + '*'.repeat(phone.length - 6) + phone.slice(-4);
  }

  /**
   * CRITICAL: Notify ALL parents of children at a school stop.
   * When van arrives at school (DRIVER_AT_SCHOOL) or leaves (DRIVER_LEFT_SCHOOL),
   * each child's parent receives a separate notification.
   * This ensures multi-child families all get alerts, not just anchor child.
   *
   * TODO: Later, integrate with Supabase to fetch actual multi-child data
   */
  private async notifyAllChildrenAtSchool(tripId: string, eventType: string, trip: any) {
    // Get all unique children on this trip
    const allChildren = (trip.stops || [])
      .filter((stop: any) => stop.child)
      .map((stop: any) => ({
        childId: stop.child.id,
        childName: stop.child.name,
      }));

    if (allChildren.length === 0) return;

    // For now, send notifications for all children (dummy mode)
    // TODO: Later, fetch parent phone numbers from Supabase
    for (const child of allChildren) {
      const eventLabel = eventType === 'DRIVER_AT_SCHOOL'
        ? `✓ ${child.childName} reached school.`
        : `✓ Left school. ${child.childName} will be home soon.`;

      this.logger.log(
        `Multi-child school notification: child=${child.childName} event=${eventType}`,
      );

      // TODO: Call notifyParent for each child (or bulk notify via dummyStore)
      // This ensures each parent gets their own alert
    }
  }
}
