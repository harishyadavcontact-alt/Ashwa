import {
  AssignmentSummary,
  CurrentAssignmentState,
  CurrentTripState,
  DriverServiceSummary,
  TimelineEventSummary,
  TripStopSummary,
} from '@ashwa/shared';
import { summarizeDriverTrust } from '../drivers/driver-trust';

export function presentDriverSummary(driver: any): DriverServiceSummary {
  return {
    id: driver.userId,
    name: driver.name || driver.user?.email || 'Unknown driver',
    email: driver.user?.email || '',
    verificationStatus: driver.verificationStatus,
    serviceArea: driver.serviceArea || null,
    trust: summarizeDriverTrust(driver),
    vehicle: driver.vehicle
      ? {
          makeModel: driver.vehicle.makeModel || null,
          plateNumber: driver.vehicle.plateNumber || null,
          seatsCapacity: driver.vehicle.seatsCapacity ?? null,
          color: driver.vehicle.color || null,
        }
      : null,
    institutions: (driver.institutions || []).map((entry: any) => ({
      id: entry.institution?.id || entry.institutionId,
      name: entry.institution?.name || 'Unknown institution',
      type: entry.institution?.type || 'UNKNOWN',
    })),
  };
}

export function presentChildSummary(child: any) {
  return {
    id: child.id,
    name: child.name,
    institutionId: child.institutionId,
    institutionName: child.institution?.name || null,
    pickupAddress: child.pickupAddress,
    dropAddress: child.dropAddress,
  };
}

export function presentAssignment(assignment: any): AssignmentSummary {
  return {
    id: assignment.id,
    status: assignment.status,
    startDate: assignment.startDate.toISOString(),
    child: presentChildSummary(assignment.child),
    driver: assignment.driver ? presentDriverSummary(assignment.driver) : null,
  };
}

export function presentAssignmentState(role: 'PARENT' | 'DRIVER', assignments: any[]): CurrentAssignmentState {
  const items = assignments.map(presentAssignment);
  return {
    role,
    primary: items[0] || null,
    items,
  };
}

function presentStop(stop: any): TripStopSummary {
  return {
    id: stop.id,
    stopType: stop.stopType,
    childId: stop.childId || null,
    childName: stop.child?.name || null,
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    sequenceIndex: stop.sequenceIndex,
  };
}

function presentTimelineEvent(event: any): TimelineEventSummary {
  return {
    id: event.id,
    childId: event.childId,
    childName: event.child?.name || 'Unknown child',
    eventType: event.eventType,
    timestamp: event.timestamp.toISOString(),
    metadata: event.metadata || undefined,
  };
}

function isStopComplete(stop: any, events: any[]) {
  if (stop.stopType === 'PICKUP') {
    return events.some((event) => event.childId === stop.childId && event.eventType === 'CHILD_BOARDED');
  }
  if (stop.stopType === 'DROP') {
    return events.some((event) => event.childId === stop.childId && event.eventType === 'CHILD_DROPPED');
  }
  return events.some((event) => event.eventType === 'DRIVER_AT_SCHOOL');
}

export function presentTripState(trip: any, visibleChildIds?: string[]): CurrentTripState {
  if (!trip) {
    return {
      trip: null,
      latestLocation: null,
      nextStop: null,
      stops: [],
      manifest: [],
      timeline: [],
    };
  }

  const childFilter = visibleChildIds?.length
    ? (childId: string | null) => !childId || visibleChildIds.includes(childId)
    : () => true;

  const stops = (trip.stops || [])
    .filter((stop: any) => childFilter(stop.childId))
    .sort((left: any, right: any) => left.sequenceIndex - right.sequenceIndex);

  const timeline = (trip.events || [])
    .filter((event: any) => childFilter(event.childId))
    .sort((left: any, right: any) => left.timestamp.getTime() - right.timestamp.getTime())
    .map(presentTimelineEvent);

  const nextStopRecord =
    stops.find((stop: any) => !isStopComplete(stop, trip.events || [])) || null;

  const manifest = stops
    .filter((stop: any) => !!stop.child)
    .map((stop: any) => presentChildSummary(stop.child))
    .filter((child, index, array) => array.findIndex((item) => item.id === child.id) === index);

  return {
    trip: {
      id: trip.id,
      tripType: trip.tripType,
      status: trip.status,
      startedAt: trip.startedAt.toISOString(),
      endedAt: trip.endedAt ? trip.endedAt.toISOString() : null,
    },
    latestLocation: trip.pings?.[0]
      ? {
          lat: trip.pings[0].lat,
          lng: trip.pings[0].lng,
          timestamp: trip.pings[0].timestamp.toISOString(),
        }
      : null,
    nextStop: nextStopRecord ? presentStop(nextStopRecord) : null,
    stops: stops.map(presentStop),
    manifest,
    timeline,
  };
}
