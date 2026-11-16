/**
 * Helper to notify ALL parents of children at a school stop.
 * When van arrives at school (DRIVER_AT_SCHOOL), ALL children's parents get notified,
 * not just the anchor child.
 *
 * This is the critical fix for multi-child alert delivery.
 */

import { dummyStore } from '../dummy-store';
import { Logger } from '@nestjs/common';

const logger = new Logger('TripNotificationHelper');

interface ChildAtStop {
  childId: string;
  childName: string;
  parentPhone: string;
}

interface SchoolStop {
  schoolName: string;
  children: ChildAtStop[];
}

/**
 * When a trip event occurs at a school stop, notify all children's parents.
 *
 * @param eventType - e.g., 'DRIVER_AT_SCHOOL' or 'DRIVER_LEFT_SCHOOL'
 * @param schoolStop - Contains school name and all children at that stop
 * @returns Array of notification IDs sent
 */
export async function notifyAllChildrenAtSchool(
  eventType: string,
  schoolStop: SchoolStop,
): Promise<string[]> {
  const notificationIds: string[] = [];

  // Map event types to human-readable messages
  const eventMessages: Record<string, (childName: string, schoolName: string) => string> = {
    DRIVER_AT_SCHOOL: (child, school) => `✓ ${child} reached ${school}.`,
    DRIVER_LEFT_SCHOOL: (child, school) => `✓ Left ${school}. ${child} will be home soon.`,
  };

  const messageTemplate = eventMessages[eventType];
  if (!messageTemplate) {
    logger.warn(`Unknown event type for school notification: ${eventType}`);
    return [];
  }

  // Notify EACH child's parent separately (not lumped by anchor)
  for (const child of schoolStop.children) {
    try {
      const notification = dummyStore.sendNotification(
        child.childId,
        child.parentPhone,
        child.childName,
        eventType,
        messageTemplate(child.childName, schoolStop.schoolName),
        schoolStop.schoolName,
      );

      notificationIds.push(notification.id);
      logger.log(
        `Multi-child notification sent: child=${child.childName} parent=${child.parentPhone} event=${eventType}`,
      );

      // TODO: Later, call Supabase Edge Function to send WhatsApp for each parent
      // const whatsappSent = await supabase.functions.invoke('send-whatsapp', {
      //   body: { to: child.parentPhone, message: messageTemplate(child.childName, schoolStop.schoolName) }
      // });
    } catch (error) {
      logger.error(
        `Failed to send notification to ${child.childName}'s parent`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  logger.log(
    `School event notification batch: event=${eventType} school=${schoolStop.schoolName} children=${schoolStop.children.length} sent=${notificationIds.length}`,
  );

  return notificationIds;
}

/**
 * Get all children at a specific school stop.
 * Called when processing a DRIVER_AT_SCHOOL event.
 *
 * TODO: Later, query actual trip.stops with multi-child expansion from Supabase
 */
export function getChildrenAtSchoolStop(
  tripId: string,
  schoolName: string,
): SchoolStop | null {
  // Dummy implementation: in real usage, query trip data
  // For now, return a structure that can be populated from trip data

  return {
    schoolName,
    children: [
      // This would be populated from actual trip data
      // { childId: 'child-1', childName: 'Alice', parentPhone: '+91-9876543210' },
      // { childId: 'child-2', childName: 'Bob', parentPhone: '+91-9876543211' },
    ],
  };
}
