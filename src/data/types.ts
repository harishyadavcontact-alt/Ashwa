import type { EventType, TripType } from '../logic/tripProgression';

export interface Point {
  lat: number;
  lng: number;
  label: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  vanSeats: number;
  // Van base (home or garage). Fixed start point, so the morning pickup order stays the same across taps.
  baseLat: number | null;
  baseLng: number | null;
}

export interface ParentProfile {
  id: string;
  name: string;
  phone: string;
}

export interface ChildRecord {
  id: string;
  parentId: string;
  driverId: string;
  firstName: string;
  schoolName: string;
  schoolLat: number | null;
  schoolLng: number | null;
  pickup: Point;
  drop: Point;
  createdAt: string;
}

export interface TripRecord {
  id: string;
  driverId: string;
  tripType: TripType;
  startedAt: string;
  endedAt: string | null;
}

export interface EventRecord {
  id: string;
  tripId: string;
  childId: string;
  eventType: EventType;
  createdAt: string;
}

export interface VanLocation {
  tripId: string;
  lat: number;
  lng: number;
  updatedAt: string;
}
