import { describe, expect, it } from 'vitest';
import type { ChildRecord, PaymentRecord, RouteRecord, RouteStop } from '../data/types';
import {
  buildRunStops,
  cheapestInsertIndex,
  feeState,
  makeRouteCode,
  phoneKey,
  schoolMatches,
  seatsLeft,
} from './routes';
import { getNextTripAction, validateTripEvent, type TripLike } from './tripProgression';

const start = { lat: 12.9, lng: 77.6, label: 'Van base' };
const school = { lat: 12.95, lng: 77.62, label: 'Sunrise School' };

const route: RouteRecord = {
  id: 'r1',
  ownerId: 'd1',
  code: 'ABC123',
  name: 'Sunrise run',
  schoolName: 'Sunrise School',
  school,
  start,
  vanSeats: 8,
  createdAt: '2026-01-01T00:00:00Z',
};

const stop = (id: string, direction: 'TO_SCHOOL' | 'TO_HOME', order: number, lat: number, lng: number): RouteStop => ({
  id,
  routeId: 'r1',
  direction,
  order,
  point: { lat, lng, label: id },
});

const stops: RouteStop[] = [
  stop('s1', 'TO_SCHOOL', 0, 12.91, 77.6),
  stop('s2', 'TO_SCHOOL', 1, 12.93, 77.61),
  stop('h1', 'TO_HOME', 0, 12.93, 77.61),
  stop('h2', 'TO_HOME', 1, 12.91, 77.6),
];

const child = (id: string, name: string, toSchool: string, toHome: string): ChildRecord => ({
  id,
  routeId: 'r1',
  parentId: null,
  parentPhone: '9800000000',
  firstName: name,
  schoolName: 'Sunrise School',
  toSchoolStopId: toSchool,
  toHomeStopId: toHome,
  monthlyFee: 1500,
  createdAt: '2026-01-01T00:00:00Z',
});

describe('route codes and matching', () => {
  it('makes 6-character codes without look-alike characters', () => {
    const code = makeRouteCode(() => 0.5);
    expect(code).toHaveLength(6);
    expect(code).not.toMatch(/[01IO]/);
  });

  it('matches schools loosely, ignoring case and spacing', () => {
    expect(schoolMatches('Sunrise School', '  sunrise   school ')).toBe(true);
    expect(schoolMatches('Sunrise School', 'Sunrise')).toBe(true);
    expect(schoolMatches('Sunrise School', 'Oakridge')).toBe(false);
    expect(schoolMatches('Sunrise School', '')).toBe(false);
  });

  it('matches phone numbers on their last 10 digits', () => {
    expect(phoneKey('+91 98765 43210')).toBe(phoneKey('098765 43210'));
  });
});

describe('stop insertion', () => {
  it('inserts a point where it adds the least distance', () => {
    const ordered = [stop('s1', 'TO_SCHOOL', 0, 12.91, 77.6).point, stop('s2', 'TO_SCHOOL', 1, 12.93, 77.61).point];
    // Sits right next to s2, so it should go after s2 (index 2) or between s1 and s2 (index 1), but never first.
    const idx = cheapestInsertIndex(ordered, start, school, { lat: 12.931, lng: 77.611, label: 'new' });
    expect(idx).toBeGreaterThanOrEqual(1);
  });
});

describe('run builder', () => {
  it('morning: children picked up in route order, then school', () => {
    const kids = [child('a', 'Asha', 's2', 'h1'), child('b', 'Ravi', 's1', 'h2')];
    const run = buildRunStops(route, stops, kids, 'MORNING');
    expect(run.map((r) => r.childName ?? r.stopType)).toEqual(['Ravi', 'Asha', 'SCHOOL']);
  });

  it('afternoon: school first, then drops in route order', () => {
    const kids = [child('a', 'Asha', 's2', 'h1'), child('b', 'Ravi', 's1', 'h2')];
    const run = buildRunStops(route, stops, kids, 'AFTERNOON');
    expect(run[0].stopType).toBe('SCHOOL');
    expect(run.slice(1).map((r) => r.childName)).toEqual(['Asha', 'Ravi']);
  });

  it('a shared stop picks up two children in one visit', () => {
    const kids = [child('a', 'Asha', 's1', 'h2'), child('b', 'Ravi', 's1', 'h2')];
    const run = buildRunStops(route, stops, kids, 'MORNING');
    expect(run.filter((r) => r.stopType === 'PICKUP')).toHaveLength(2);
  });

  it('drives a full morning run through the trip rules', () => {
    const kids = [child('a', 'Asha', 's1', 'h2'), child('b', 'Ravi', 's2', 'h1')];
    const trip: TripLike = { tripType: 'MORNING', stops: buildRunStops(route, stops, kids, 'MORNING'), events: [] };
    for (const id of ['a', 'b']) {
      expect(validateTripEvent(trip, id, 'DRIVER_AT_PICKUP').ok).toBe(true);
      trip.events.push({ childId: id, eventType: 'DRIVER_AT_PICKUP' });
      trip.events.push({ childId: id, eventType: 'CHILD_BOARDED' });
    }
    expect(getNextTripAction(trip).nextStop?.stopType).toBe('SCHOOL');
  });
});

describe('seats and fees', () => {
  it('never reports negative seats', () => {
    expect(seatsLeft(8, 3)).toBe(5);
    expect(seatsLeft(2, 5)).toBe(0);
  });

  it('shows due, reported and paid', () => {
    const pay = (status: 'REPORTED' | 'PAID'): PaymentRecord => ({
      id: 'p',
      childId: 'a',
      month: '2026-11',
      amount: 1500,
      status,
      method: 'cash',
      reference: '',
      updatedAt: '',
    });
    expect(feeState(null)).toBe('DUE');
    expect(feeState(pay('REPORTED'))).toBe('REPORTED');
    expect(feeState(pay('PAID'))).toBe('PAID');
  });
});
