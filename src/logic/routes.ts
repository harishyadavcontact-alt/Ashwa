import type { ChildRecord, Direction, PaymentRecord, Point, RouteRecord, RouteStop } from '../data/types';
import { haversineMeters } from './eta';
import type { TripStop, TripType } from './tripProgression';

// Route codes: short, readable, no look-alike characters (no 0/O, 1/I).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeRouteCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(random() * CODE_CHARS.length)];
  return code;
}

// Referral codes for parents: 6 characters, same alphabet.
export const makeReferralCode = makeRouteCode;

export function directionFor(tripType: TripType): Direction {
  return tripType === 'MORNING' ? 'TO_SCHOOL' : 'TO_HOME';
}

export function normaliseSchool(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function schoolMatches(routeSchool: string, query: string): boolean {
  const q = normaliseSchool(query);
  if (!q) return false;
  const s = normaliseSchool(routeSchool);
  return s === q || s.includes(q) || q.includes(s);
}

// Where to insert a new point into an ordered path that runs start → stops → end.
// Picks the gap that adds the least extra distance. Returns the index in `stops` (0 = right after start).
export function cheapestInsertIndex(stops: Point[], start: Point, end: Point, p: Point): number {
  const path = [start, ...stops, end];
  let bestIndex = 0;
  let bestAdded = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const added =
      haversineMeters(path[i], p) + haversineMeters(p, path[i + 1]) - haversineMeters(path[i], path[i + 1]);
    if (added < bestAdded) {
      bestAdded = added;
      bestIndex = i;
    }
  }
  return bestIndex; // gap i sits between path[i] and path[i+1]; stop index in `stops` is i
}

// The stops of one direction, in visiting order.
export function orderedStops(stops: RouteStop[], direction: Direction): RouteStop[] {
  return stops.filter((s) => s.direction === direction).sort((a, b) => a.order - b.order);
}

// Shortest distance from a point to any stop of a route in the given direction (or Infinity).
export function nearestStopDistance(stops: RouteStop[], direction: Direction, p: Point): number {
  return orderedStops(stops, direction).reduce(
    (best, s) => Math.min(best, haversineMeters(p, s.point)),
    Infinity,
  );
}

// Builds the per-child stop list a driver follows on one run.
// TO_SCHOOL: start → each stop (children picked up there) → school.
// TO_HOME:   school → each stop (children dropped there) → end.
// Stops with no children are waypoints the van passes; they are not in the run.
export function buildRunStops(
  route: RouteRecord,
  stops: RouteStop[],
  children: ChildRecord[],
  tripType: TripType,
): TripStop[] {
  const direction = directionFor(tripType);
  const run: TripStop[] = [];
  const schoolStop = (sequenceIndex: number): TripStop => ({
    id: `school-${sequenceIndex}`,
    stopType: 'SCHOOL',
    childId: null,
    childName: null,
    sequenceIndex,
    address: route.school.label,
    lat: route.school.lat,
    lng: route.school.lng,
  });

  if (direction === 'TO_SCHOOL') {
    for (const stop of orderedStops(stops, direction)) {
      for (const child of children.filter((c) => c.toSchoolStopId === stop.id)) {
        run.push({
          id: `PICKUP-${child.id}`,
          stopType: 'PICKUP',
          childId: child.id,
          childName: child.firstName,
          sequenceIndex: run.length,
          address: stop.point.label,
          lat: stop.point.lat,
          lng: stop.point.lng,
        });
      }
    }
    run.push(schoolStop(run.length));
    return run;
  }

  run.push(schoolStop(0));
  for (const stop of orderedStops(stops, direction)) {
    for (const child of children.filter((c) => c.toHomeStopId === stop.id)) {
      run.push({
        id: `DROP-${child.id}`,
        stopType: 'DROP',
        childId: child.id,
        childName: child.firstName,
        sequenceIndex: run.length,
        address: stop.point.label,
        lat: stop.point.lat,
        lng: stop.point.lng,
      });
    }
  }
  return run;
}

export function seatsLeft(vanSeats: number, childCount: number): number {
  return Math.max(0, vanSeats - childCount);
}

export type FeeState = 'DUE' | 'REPORTED' | 'PAID';

export function feeState(payment: PaymentRecord | null): FeeState {
  if (!payment) return 'DUE';
  return payment.status === 'PAID' ? 'PAID' : 'REPORTED';
}

export function currentMonth(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${m}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// Phone numbers: compare the last 10 digits, so +91 98… and 098… match.
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}
