import type { EventType, TripType } from '../logic/tripProgression';

// Morning run = TO_SCHOOL (start → stops → school). Afternoon run = TO_HOME (school → stops → start).
export type Direction = 'TO_SCHOOL' | 'TO_HOME';

export type PaymentStatus = 'REPORTED' | 'PAID';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

// Event names for analytics. Never put a child's name, phone or address in the properties.
export type AnalyticsName =
  | 'parent_profile_created'
  | 'consent_given'
  | 'driver_profile_created'
  | 'route_created'
  | 'route_joined'
  | 'customer_added'
  | 'invite_shared'
  | 'child_added'
  | 'van_search'
  | 'trip_started'
  | 'stop_tapped'
  | 'payment_reported'
  | 'payment_marked'
  | 'data_deleted';

export interface Point {
  lat: number;
  lng: number;
  label: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  vanSeats: number;
  verificationStatus: VerificationStatus;
}

export interface ParentProfile {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  referredBy: string | null;
  consentAt: string | null;
}

// One van, one school, one start point. A route is what a replacement driver "follows".
export interface RouteRecord {
  id: string;
  ownerId: string;
  code: string;
  name: string;
  schoolName: string;
  school: Point;
  start: Point;
  vanSeats: number;
  createdAt: string;
}

// A mapped point on a route, in the order the van visits it.
export interface RouteStop {
  id: string;
  routeId: string;
  direction: Direction;
  order: number;
  point: Point;
}

// A child (customer). Created by the driver before the parent joins; linked to the parent by phone.
export interface ChildRecord {
  id: string;
  routeId: string;
  parentId: string | null;
  parentPhone: string;
  firstName: string;
  schoolName: string;
  toSchoolStopId: string;
  toHomeStopId: string;
  monthlyFee: number;
  createdAt: string;
}

export interface TripRecord {
  id: string;
  routeId: string;
  startedBy: string;
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

// Fees: no record for a month = DUE. REPORTED = parent says they paid (driver to confirm). PAID = driver confirmed.
export interface PaymentRecord {
  id: string;
  childId: string;
  month: string; // YYYY-MM
  amount: number;
  status: PaymentStatus;
  method: string; // cash | upi | bank | other
  reference: string;
  updatedAt: string;
}

// One point on the map. START is shown to the team only. SCHOOL and STOP are shown to everyone on the route.
export interface MapStop {
  id: string | null; // null for the school and start
  kind: 'START' | 'SCHOOL' | 'STOP';
  direction: Direction | null;
  order: number;
  point: Point;
  childCount: number;
  names: string[]; // team: every child here. parent: only their own children here.
}

// What a parent sees when searching for a van.
export interface RouteSearchResult {
  routeId: string;
  routeName: string;
  schoolName: string;
  driverName: string;
  seatsLeft: number;
  distanceM: number;
}
