import type { EventType } from './tripProgression';

// Which trip events a parent should hear about, and how to word them.
// School events are logged against one anchor child on the trip, so they are shared by every child on that run.

const SCHOOL_EVENTS: EventType[] = ['DRIVER_AT_SCHOOL', 'DRIVER_LEFT_SCHOOL'];

export interface TripEventLike {
  childId: string;
  eventType: EventType;
  createdAt: string;
}

export function isVisibleToChild(event: TripEventLike, childId: string): boolean {
  return event.childId === childId || SCHOOL_EVENTS.includes(event.eventType);
}

export function parentMessage(
  eventType: EventType,
  child: { firstName: string; schoolName: string; pickupLabel: string; dropLabel: string },
): string {
  switch (eventType) {
    case 'DRIVER_10_MIN_TO_PICKUP':
      return `The van is about 10 minutes from ${child.pickupLabel}.`;
    case 'DRIVER_AT_PICKUP':
      return `The van has reached ${child.pickupLabel}.`;
    case 'CHILD_BOARDED':
      return `${child.firstName} is on the van.`;
    case 'DRIVER_AT_SCHOOL':
      return `The van has reached ${child.schoolName}.`;
    case 'DRIVER_LEFT_SCHOOL':
      return `The van has left ${child.schoolName} for home.`;
    case 'DRIVER_10_MIN_TO_DROP':
      return `The van is about 10 minutes from ${child.dropLabel}.`;
    case 'DRIVER_AT_DROP':
      return `The van has reached ${child.dropLabel}.`;
    case 'CHILD_DROPPED':
      return `${child.firstName} has been dropped off.`;
    default:
      return 'Update from the van.';
  }
}

// Events to show for one child, oldest first.
export function timelineFor<T extends TripEventLike>(events: T[], childId: string): T[] {
  return events
    .filter((e) => isVisibleToChild(e, childId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// New events since the parent last looked. `seenIds` is the set of event ids already shown.
export function unseenFor<T extends TripEventLike & { id: string }>(events: T[], childId: string, seenIds: Set<string>): T[] {
  return timelineFor(events, childId).filter((e) => !seenIds.has(e.id));
}
