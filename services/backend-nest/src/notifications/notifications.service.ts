import { Injectable, Logger } from '@nestjs/common';
import { dummyStore, Notification } from '../dummy-store';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Send a notification for a child event.
   * This is called when a trip event occurs (DRIVER_AT_SCHOOL, CHILD_BOARDED, etc.)
   * Each child's parent gets notified separately.
   *
   * TODO: Later, send WhatsApp/FCM via Supabase integration
   */
  async sendNotification(body: {
    childId: string;
    parentPhone: string;
    childName: string;
    eventType: string;
    eventLabel: string;
    schoolName?: string;
  }): Promise<Notification> {
    const notification = dummyStore.sendNotification(
      body.childId,
      body.parentPhone,
      body.childName,
      body.eventType,
      body.eventLabel,
      body.schoolName,
    );

    this.logger.log(
      `Notification sent: child=${body.childName} parent=${body.parentPhone} event=${body.eventType}`,
    );

    // TODO: Call Supabase Edge Function to send WhatsApp
    // const whatsappSent = await supabase.functions.invoke('send-whatsapp', {
    //   body: { to: body.parentPhone, message: body.eventLabel }
    // });

    return notification;
  }

  /**
   * Get all notifications for a specific child.
   */
  async getNotificationsForChild(childId: string): Promise<Notification[]> {
    return dummyStore.getNotificationsForChild(childId);
  }

  /**
   * Get all notifications for a parent (across all their children).
   */
  async getNotificationsForParent(parentPhone: string): Promise<Notification[]> {
    return dummyStore.getNotificationsForParent(parentPhone);
  }

  /**
   * Mark a notification as read.
   */
  async markNotificationRead(notificationId: string): Promise<Notification | null> {
    return dummyStore.markNotificationRead(notificationId);
  }

  /**
   * Verify that all children at a school stop received notifications.
   * Returns a list of all children + whether they were notified.
   * Used for testing multi-child delivery.
   *
   * TODO: Later, query notification_delivery table from Supabase
   */
  async verifyChildNotificationDelivery(
    tripId: string,
    eventType: string,
  ): Promise<{ childId: string; parentPhone: string; notified: boolean }[]> {
    return dummyStore.verifyChildNotificationDelivery(tripId, eventType);
  }

  /**
   * Create a mock trip with 10 children at St. Xavier's school.
   * Used to verify multi-child alert delivery before Dad's first real trip.
   * Returns: trip object + list of 10 children + expected notifications
   */
  async createMockTrip10Children() {
    return dummyStore.createMockTrip10Children();
  }
}
