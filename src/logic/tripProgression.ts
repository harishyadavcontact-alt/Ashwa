// Ported from Ashwa/services/backend-nest/src/trips/trip-progression.ts.
// Pure, dependency-free. Same event rules; the ordering of the stop sequence decides what the driver may tap next.

export type TripType = 'MORNING' | 'AFTERNOON';
export type StopType = 'PICKUP' | 'DROP' | 'SCHOOL';

export type EventType =
  | 'DRIVER_10_MIN_TO_PICKUP'
  | 'DRIVER_AT_PICKUP'
  | 'CHILD_BOARDED'
  | 'DRIVER_AT_SCHOOL'
  | 'DRIVER_LEFT_SCHOOL'
  | 'DRIVER_10_MIN_TO_DROP'
  | 'DRIVER_AT_DROP'
  | 'CHILD_DROPPED';

export interface TripStop {
  id: string;
  stopType: StopType;
  childId?: string | null;
  childName?: string | null;
  sequenceIndex: number;
  address: string;
  lat: number;
  lng: number;
}

export interface TripEvent {
  childId: string;
  eventType: EventType;
}

export interface TripLike {
  tripType: TripType;
  stops: TripStop[];
  events: TripEvent[];
}

const PICKUP_EVENTS: EventType[] = ['DRIVER_AT_PICKUP', 'CHILD_BOARDED'];
const DROP_EVENTS: EventType[] = ['DRIVER_AT_DROP', 'CHILD_DROPPED'];
const MORNING_SCHOOL_EVENTS: EventType[] = ['DRIVER_AT_SCHOOL'];
const AFTERNOON_SCHOOL_EVENTS: EventType[] = ['DRIVER_LEFT_SCHOOL'];

export function getManifestChildIds(trip: TripLike): string[] {
  return [...new Set(trip.stops.filter((s) => !!s.childId).map((s) => s.childId as string))].sort();
}

// The school stop is anchored to one child so the "reached school" event fires once per trip.
export function getSchoolAnchorChildId(trip: TripLike): string | null {
  return getManifestChildIds(trip)[0] ?? null;
}

export function requiredEventsForStop(tripType: TripType, stopType: StopType): EventType[] {
  if (stopType === 'PICKUP') return PICKUP_EVENTS;
  if (stopType === 'DROP') return DROP_EVENTS;
  return tripType === 'AFTERNOON' ? AFTERNOON_SCHOOL_EVENTS : MORNING_SCHOOL_EVENTS;
}

function isEventPresent(trip: TripLike, childId: string | null, eventType: EventType): boolean {
  return trip.events.some((e) => e.eventType === eventType && (childId ? e.childId === childId : true));
}

function effectiveChildId(stop: TripStop, anchor: string | null): string | null {
  return stop.stopType === 'SCHOOL' ? anchor : stop.childId ?? null;
}

export function isStopComplete(trip: TripLike, stop: TripStop, anchor = getSchoolAnchorChildId(trip)): boolean {
  const childId = effectiveChildId(stop, anchor);
  return requiredEventsForStop(trip.tripType, stop.stopType).every((e) => isEventPresent(trip, childId, e));
}

export interface NextAction {
  nextStop: TripStop | null;
  childId: string | null;
  allowedEvents: EventType[];
  label: string;
}

export function getNextTripAction(trip: TripLike): NextAction {
  const stops = [...trip.stops].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  const anchor = getSchoolAnchorChildId(trip);
  const nextStop = stops.find((s) => !isStopComplete(trip, s, anchor)) ?? null;

  if (!nextStop) {
    return { nextStop: null, childId: null, allowedEvents: [], label: 'Trip complete' };
  }

  const childId = effectiveChildId(nextStop, anchor);
  const pending = requiredEventsForStop(trip.tripType, nextStop.stopType).find((e) => !isEventPresent(trip, childId, e));
  const name = nextStop.childName ?? 'assigned child';

  const label =
    nextStop.stopType === 'PICKUP'
      ? `Handle pickup for ${name}`
      : nextStop.stopType === 'DROP'
        ? `Handle drop-off for ${name}`
        : trip.tripType === 'AFTERNOON'
          ? 'Leave school and begin drop sequence'
          : 'Arrive at school and complete the route';

  return { nextStop, childId, allowedEvents: pending ? [pending] : [], label };
}

export type ValidationResult =
  | { ok: true; canonicalChildId: string | null; nextAction: NextAction }
  | { ok: false; reason: string };

export function validateTripEvent(trip: TripLike, childId: string, eventType: EventType): ValidationResult {
  const next = getNextTripAction(trip);
  if (!next.nextStop) return { ok: false, reason: 'Trip has no remaining stops' };
  if (!next.allowedEvents.includes(eventType)) {
    return {
      ok: false,
      reason: `Expected ${next.allowedEvents.join(', ') || 'no further events'} before ${eventType}`,
    };
  }
  if (next.childId && childId !== next.childId) {
    return { ok: false, reason: 'Event must target the child for the current stop' };
  }
  if (!getManifestChildIds(trip).includes(childId)) {
    return { ok: false, reason: 'Child is not part of the active trip' };
  }
  return { ok: true, canonicalChildId: next.childId ?? childId, nextAction: next };
}
