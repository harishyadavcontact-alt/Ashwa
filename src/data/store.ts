import type { TripType } from '../logic/tripProgression';
import type {
  ChildRecord,
  AnalyticsName,
  Direction,
  DriverProfile,
  EventRecord,
  ParentProfile,
  PaymentRecord,
  MapStop,
  Point,
  RouteRecord,
  RouteSearchResult,
  RouteStop,
  TripRecord,
  VanLocation,
  VerificationStatus,
} from './types';

// One interface, two implementations: LocalStore (demo) and SupabaseStore (pilot).
// The UI only talks to this interface.
export interface AppStore {
  auth: {
    sendCode(phone: string): Promise<void>;
    verifyCode(phone: string, code: string): Promise<string>;
    currentUserId(): Promise<string | null>;
    currentPhone(): Promise<string | null>;
    signOut(): Promise<void>;
  };

  // Profiles
  getDriver(id: string): Promise<DriverProfile | null>;
  getParent(id: string): Promise<ParentProfile | null>;
  saveParent(parent: Omit<ParentProfile, 'referralCode'> & { referralCode?: string }): Promise<ParentProfile>;
  getDriverName(id: string): Promise<string>;
  saveDriver(driver: Omit<DriverProfile, 'verificationStatus'>): Promise<void>; // status is never set by the driver

  // Admin (founder only)
  isAdmin(): Promise<boolean>;
  listDriversByStatus(status: VerificationStatus): Promise<DriverProfile[]>;
  setDriverStatus(driverId: string, status: VerificationStatus): Promise<void>;
  eventCounts(days: number): Promise<{ name: string; n: number }[]>;

  // Privacy
  deleteMyData(): Promise<void>;

  // Analytics (never throws to the UI; see src/lib/analytics.ts)
  track(name: AnalyticsName, props?: Record<string, string | number>): Promise<void>;
  routeDriverName(routeId: string): Promise<string>;

  // Routes (driver side)
  createRoute(input: Omit<RouteRecord, 'id' | 'code' | 'createdAt'>): Promise<RouteRecord>;
  listRoutesForDriver(driverId: string): Promise<RouteRecord[]>;
  getRoute(routeId: string): Promise<RouteRecord | null>;
  joinRouteByCode(code: string): Promise<RouteRecord>; // joins as the signed-in user
  listStops(routeId: string): Promise<RouteStop[]>;
  routeMap(routeId: string): Promise<MapStop[]>;
  addStop(routeId: string, direction: Direction, point: Point): Promise<RouteStop>;
  moveStop(stopId: string, delta: -1 | 1): Promise<void>;
  removeStop(stopId: string): Promise<void>;

  // Customers (children)
  listChildrenForRoute(routeId: string): Promise<ChildRecord[]>;
  addCustomer(input: {
    routeId: string;
    firstName: string;
    parentPhone: string;
    monthlyFee: number;
    pickup: Point;
    drop: Point | null; // null = same as pickup (home)
  }): Promise<ChildRecord>;
  setMonthlyFee(childId: string, fee: number): Promise<void>;
  listChildrenForParent(parentId: string): Promise<ChildRecord[]>;
  claimChildrenForPhone(parentId: string, phone: string): Promise<number>;

  // Parent search and enrolment
  searchRoutes(schoolName: string, point: Point): Promise<RouteSearchResult[]>;
  knownSchools(): Promise<string[]>;
  enrolChild(input: {
    routeId: string;
    parentId: string;
    parentPhone: string;
    firstName: string;
    pickup: Point;
  }): Promise<ChildRecord>;

  // Trips
  startTrip(routeId: string, startedBy: string, tripType: TripType, tripId: string): Promise<TripRecord>;
  getActiveTrip(routeId: string): Promise<TripRecord | null>;
  endTrip(tripId: string): Promise<void>;
  addEvent(event: Omit<EventRecord, 'createdAt'>): Promise<void>;
  listEvents(tripId: string): Promise<EventRecord[]>;
  setVanLocation(tripId: string, lat: number, lng: number): Promise<void>;
  getVanLocation(tripId: string): Promise<VanLocation | null>;

  // Fees
  listPayments(childIds: string[], month: string): Promise<PaymentRecord[]>;
  reportPayment(input: { childId: string; month: string; amount: number; method: string; reference: string }): Promise<void>;
  markPaid(input: { childId: string; month: string; amount: number; method: string; reference: string }): Promise<void>;
  clearPayment(childId: string, month: string): Promise<void>;
}
