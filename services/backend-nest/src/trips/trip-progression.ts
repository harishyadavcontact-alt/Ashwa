import { EventType, TripType } from '@ashwa/shared';

type TripLike = {
  tripType: TripType;
  stops?: Array<{
    id: string;
    stopType: 'PICKUP' | 'DROP' | 'SCHOOL';
    childId?: string | null;
    child?: { id: string; name: string } | null;
    sequenceIndex: number;
    address: string;
    lat: number;
    lng: number;
  }>;
  events?: Array<{
    childId: string;
    eventType: EventType;
    timestamp?: Date;
  }>;
};

const PICKUP_EVENTS: EventType[] = ['DRIVER_AT_PICKUP', 'CHILD_BOARDED'];
const MORNING_SCHOOL_EVENTS: EventType[] = ['DRIVER_AT_SCHOOL'];
const AFTERNOON_SCHOOL_EVENTS: EventType[] = ['DRIVER_LEFT_SCHOOL'];
const DROP_EVENTS: EventType[] = ['DRIVER_AT_DROP', 'CHILD_DROPPED'];

function getManifestChildIds(trip: TripLike) {
  return (trip.stops || [])
    .filter((stop) => !!stop.childId)
    .map((stop) => stop.childId as string)
    .filter((childId, index, items) => items.indexOf(childId) === index)
    .sort();
}

function getSchoolAnchorChildId(trip: TripLike) {
  return getManifestChildIds(trip)[0] || null;
}

function getRequiredEventsForStop(tripType: TripType, stopType: 'PICKUP' | 'DROP' | 'SCHOOL'): EventType[] {
  if (stopType === 'PICKUP') return PICKUP_EVENTS;
  if (stopType === 'DROP') return DROP_EVENTS;
  return tripType === 'AFTERNOON' ? AFTERNOON_SCHOOL_EVENTS : MORNING_SCHOOL_EVENTS;
}

function isEventPresent(trip: TripLike, childId: string | null, eventType: EventType) {
  return (trip.events || []).some((event) => event.eventType === eventType && (childId ? event.childId === childId : true));
}

export function isStopComplete(
  trip: TripLike,
  stop: { stopType: 'PICKUP' | 'DROP' | 'SCHOOL'; childId?: string | null },
  anchorChildId?: string | null,
) {
  const effectiveChildId = stop.stopType === 'SCHOOL' ? anchorChildId || getSchoolAnchorChildId(trip) : stop.childId || null;
  return getRequiredEventsForStop(trip.tripType, stop.stopType).every((eventType) =>
    isEventPresent(trip, effectiveChildId, eventType),
  );
}

export function getNextTripAction(trip: TripLike) {
  const stops = [...(trip.stops || [])].sort((left, right) => left.sequenceIndex - right.sequenceIndex);
  const schoolAnchorChildId = getSchoolAnchorChildId(trip);
  const nextStop =
    stops.find((stop) => !isStopComplete(trip, stop, schoolAnchorChildId)) || null;

  if (!nextStop) {
    return { nextStop: null, childId: null, allowedEvents: [] as EventType[], label: 'Trip complete' };
  }

  const childId = nextStop.stopType === 'SCHOOL' ? getSchoolAnchorChildId(trip) : nextStop.childId || null;
  const pendingEvent = getRequiredEventsForStop(trip.tripType, nextStop.stopType).find(
    (eventType) => !isEventPresent(trip, childId, eventType),
  );
  const allowedEvents = pendingEvent ? [pendingEvent] : [];

  const labelByStop = {
    PICKUP: `Handle pickup for ${nextStop.child?.name || 'assigned child'}`,
    DROP: `Handle drop-off for ${nextStop.child?.name || 'assigned child'}`,
    SCHOOL:
      trip.tripType === 'AFTERNOON'
        ? 'Leave school and begin drop sequence'
        : 'Arrive at school and complete the route',
  } as const;

  return {
    nextStop,
    childId,
    allowedEvents,
    label: labelByStop[nextStop.stopType],
  };
}

export function validateTripEvent(trip: TripLike, childId: string, eventType: EventType) {
  const nextAction = getNextTripAction(trip);
  if (!nextAction.nextStop) {
    return { ok: false, reason: 'Trip has no remaining stops' };
  }

  if (!nextAction.allowedEvents.includes(eventType)) {
    return {
      ok: false,
      reason: `Expected ${nextAction.allowedEvents.join(', ') || 'no further events'} before ${eventType}`,
    };
  }

  if (nextAction.childId && childId !== nextAction.childId) {
    return { ok: false, reason: 'Event must target the child for the current stop' };
  }

  if (!getManifestChildIds(trip).includes(childId)) {
    return { ok: false, reason: 'Child is not part of the active trip' };
  }

  return { ok: true, canonicalChildId: nextAction.childId || childId, nextAction };
}
