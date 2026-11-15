import type { ChildRecord, Point } from '../data/types';
import { haversineMeters } from './eta';
import type { StopType, TripStop, TripType } from './tripProgression';

// Builds the ordered stops for one trip from the children assigned to this driver.
// Morning: pick up children (nearest-neighbour from the van's start point), then school.
// Afternoon: leave school first, then drop children (nearest-neighbour from school).
// Each child's pickup/drop point is its own stop, so a child can have a different pickup and drop.

function nearestNeighbourOrder<T>(items: T[], start: Point, pointOf: (item: T) => Point): T[] {
  const remaining = [...items];
  const ordered: T[] = [];
  let cursor = start;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((item, index) => {
      const d = haversineMeters(cursor, pointOf(item));
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = pointOf(next);
  }
  return ordered;
}

export function buildTripStops(children: ChildRecord[], tripType: TripType, startPoint: Point): TripStop[] {
  if (children.length === 0) return [];
  const anchor = children[0];
  const school: Point = {
    lat: anchor.schoolLat ?? startPoint.lat,
    lng: anchor.schoolLng ?? startPoint.lng,
    label: anchor.schoolName,
  };

  const stop = (
    stopType: StopType,
    point: Point,
    childId: string | null,
    childName: string | null,
    sequenceIndex: number,
  ): TripStop => ({
    id: `${stopType}-${childId ?? 'school'}-${sequenceIndex}`,
    stopType,
    childId,
    childName,
    sequenceIndex,
    address: point.label,
    lat: point.lat,
    lng: point.lng,
  });

  if (tripType === 'MORNING') {
    const pickups = nearestNeighbourOrder(children, startPoint, (c) => c.pickup);
    const stops = pickups.map((c, i) => stop('PICKUP', c.pickup, c.id, c.firstName, i));
    stops.push(stop('SCHOOL', school, null, null, stops.length));
    return stops;
  }

  const drops = nearestNeighbourOrder(children, school, (c) => c.drop);
  const stops = [stop('SCHOOL', school, null, null, 0)];
  drops.forEach((c, i) => stops.push(stop('DROP', c.drop, c.id, c.firstName, i + 1)));
  return stops;
}
