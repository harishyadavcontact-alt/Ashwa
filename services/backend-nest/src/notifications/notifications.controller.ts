import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Send notification to a parent for a specific child event.
   * Called when trip event occurs (school arrival, departure, etc.)
   */
  @Post('send')
  async sendNotification(
    @Body()
    body: {
      childId: string;
      parentPhone: string;
      childName: string;
      eventType: string;
      eventLabel: string;
      schoolName?: string;
    },
  ) {
    return this.notificationsService.sendNotification(body);
  }

  /**
   * Get all notifications for a specific child.
   * Parent can view all alerts received for their child.
   */
  @Get('child/:childId')
  @UseGuards(JwtAuthGuard)
  async getNotificationsForChild(@Param('childId') childId: string) {
    return this.notificationsService.getNotificationsForChild(childId);
  }

  /**
   * Get all notifications for a parent (across all children).
   * Parent can view all their recent alerts.
   */
  @Get('parent/:parentPhone')
  @UseGuards(JwtAuthGuard)
  async getNotificationsForParent(@Param('parentPhone') parentPhone: string) {
    return this.notificationsService.getNotificationsForParent(parentPhone);
  }

  /**
   * Mark a notification as read.
   */
  @Post(':notificationId/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationsService.markNotificationRead(notificationId);
  }

  /**
   * Verify that all children at a school stop received notifications.
   * Used to test multi-child notification delivery.
   * Returns: [{ childId, parentPhone, notified: true/false }, ...]
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyDelivery(@Body() body: { tripId: string; eventType: string }) {
    return this.notificationsService.verifyChildNotificationDelivery(
      body.tripId,
      body.eventType,
    );
  }
}
