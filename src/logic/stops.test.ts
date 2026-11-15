import { describe, expect, it } from 'vitest';
import type { ChildRecord } from '../data/types';
import { buildTripStops } from './stops';
import { getNextTripAction, validateTripEvent, type TripLike } from './tripProgression';

const home = { lat: 12.9, lng: 77.6, label: 'Van start' };

function child(id: string, firstName: string, pickupLat: number, dropLat: number): ChildRecord {
  return {
    id,
    parentId: `p-${id}`,
    driverId: 'd1',
    firstName,
    schoolName: 'Test School',
    schoolLat: 12.95,
    schoolLng: 77.62,
    pickup: { lat: pickupLat, lng: 77.6, label: `${firstName} pickup` },
    drop: { lat: dropLat, lng: 77.64, label: `${firstName} drop` },
    createdAt: '2026-01-01T00:00:00Z',
  };
}

const kids = [child('c2', 'Ravi', 12.93, 12.97), child('c1', 'Asha', 12.91, 12.96)];

describe('buildTripStops', () => {
  it('morning: pickups in nearest-neighbour order, then school last', () => {
    const stops = buildTripStops(kids, 'MORNING', home);
    expect(stops.map((s) => s.stopType)).toEqual(['PICKUP', 'PICKUP', 'SCHOOL']);
    // Asha (12.91) is closer to home (12.90) than Ravi (12.93)
    expect(stops[0].childName).toBe('Asha');
    expect(stops[1].childName).toBe('Ravi');
  });

  it('afternoon: school first, then drops', () => {
    const stops = buildTripStops(kids, 'AFTERNOON', home);
    expect(stops[0].stopType).toBe('SCHOOL');
    expect(stops.slice(1).every((s) => s.stopType === 'DROP')).toBe(true);
  });

  it('uses a different drop point from the pickup point', () => {
    const stops = buildTripStops([kids[0]], 'MORNING', home);
    const pickup = stops[0];
    const afternoon = buildTripStops([kids[0]], 'AFTERNOON', home);
    expect(afternoon[1].lat).not.toBe(pickup.lat);
  });

  it('runs a full morning trip end to end with the progression rules', () => {
    const stops = buildTripStops(kids, 'MORNING', home);
    const trip: TripLike = { tripType: 'MORNING', stops, events: [] };
    const asha = kids.find((k) => k.firstName === 'Asha')!.id;
    const ravi = kids.find((k) => k.firstName === 'Ravi')!.id;

    const tap = (childId: string, eventType: Parameters<typeof validateTripEvent>[2]) => {
      const r = validateTripEvent(trip, childId, eventType);
      expect(r.ok).toBe(true);
      trip.events.push({ childId, eventType });
    };

    tap(asha, 'DRIVER_AT_PICKUP');
    tap(asha, 'CHILD_BOARDED');
    tap(ravi, 'DRIVER_AT_PICKUP');
    tap(ravi, 'CHILD_BOARDED');
    expect(getNextTripAction(trip).nextStop?.stopType).toBe('SCHOOL');
    tap(asha, 'DRIVER_AT_SCHOOL');
    expect(getNextTripAction(trip).label).toBe('Trip complete');
  });
});
