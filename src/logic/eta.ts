// Distance and ETA. Straight-line distance with an assumed average speed: good enough for "about 5 minutes away".
// Road routing comes later; the assumption is explicit so it can be tuned from real pilot data.

export const ASSUMED_SPEED_KMPH = 20; // Bangalore school-hour average (assumption, tune in pilot)
export const APPROACH_ALERT_MINUTES = 5;

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function etaMinutes(distanceM: number, speedKmh = ASSUMED_SPEED_KMPH): number {
  return distanceM / ((speedKmh * 1000) / 60);
}

export function isApproaching(distanceM: number, thresholdMinutes = APPROACH_ALERT_MINUTES): boolean {
  return etaMinutes(distanceM) <= thresholdMinutes;
}
