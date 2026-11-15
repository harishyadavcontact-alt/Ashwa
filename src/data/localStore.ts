import { cheapestInsertIndex, makeReferralCode, makeRouteCode, nearestStopDistance, orderedStops, phoneKey, schoolMatches, seatsLeft } from '../logic/routes';
import { haversineMeters } from '../logic/eta';
import type { TripType } from '../logic/tripProgression';
import type { AppStore } from './store';
import type {
  AnalyticsName,
  ChildRecord,
  Direction,
  DriverProfile,
  EventRecord,
  ParentProfile,
  PaymentRecord,
  Point,
  RouteRecord,
  RouteSearchResult,
  RouteStop,
  TripRecord,
  VanLocation,
  VerificationStatus,
} from './types';

// Demo store: everything lives in this browser's localStorage. For trying flows only, never for real families.
// Fake login: any phone with code 000000 signs in.

const KEY = 'ashwa.local.v2';
const USER_KEY = 'ashwa.local.user';
const DEMO_CODE = '000000';
const SAME_STOP_METRES = 30;
// Demo admin: sign in with this number to see the admin page locally. Real admins are set in the database.
const DEMO_ADMIN_PHONE = '9999999999';
const ANALYTICS_CAP = 1000;

interface State {
  drivers: Record<string, DriverProfile>;
  parents: Record<string, ParentProfile>;
  routes: RouteRecord[];
  members: { routeId: string; driverId: string }[];
  stops: RouteStop[];
  children: ChildRecord[];
  trips: TripRecord[];
  events: EventRecord[];
  locations: Record<string, VanLocation>;
  payments: PaymentRecord[];
  analytics: { userId: string; name: string; props: Record<string, string | number>; createdAt: string }[];
}

const empty: State = {
  drivers: {},
  parents: {},
  routes: [],
  members: [],
  stops: [],
  children: [],
  trips: [],
  events: [],
  locations: {},
  payments: [],
  analytics: [],
};

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<State>) } : { ...empty };
  } catch {
    return { ...empty };
  }
}

function write(state: State): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the session continues in memory until reload.
  }
}

function newId(): string {
  return crypto.randomUUID();
}

function readUser(): { id: string; phone: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { id: string; phone: string }) : null;
  } catch {
    return null;
  }
}

// Returns the id of an existing stop in this direction within a few metres, or inserts a new one.
function ensureStop(s: State, routeId: string, direction: Direction, point: Point): RouteStop {
  const route = s.routes.find((r) => r.id === routeId);
  if (!route) throw new Error('Route not found');
  const existing = s.stops.find(
    (x) =>
      x.routeId === routeId &&
      x.direction === direction &&
      haversineMeters(x.point, point) <= SAME_STOP_METRES,
  );
  if (existing) return existing;
  return insertStop(s, route, direction, point);
}

function insertStop(s: State, route: RouteRecord, direction: Direction, point: Point): RouteStop {
  const ordered = orderedStops(s.stops.filter((x) => x.routeId === route.id), direction);
  const pts = ordered.map((x) => x.point);
  const endpoints = direction === 'TO_SCHOOL' ? [route.start, route.school] : [route.school, route.start];
  const at = cheapestInsertIndex(pts, endpoints[0], endpoints[1], point);
  const stop: RouteStop = { id: newId(), routeId: route.id, direction, order: at, point };
  // Shift later stops down by one and renumber everything in this direction.
  const renumbered = [...ordered.slice(0, at), stop, ...ordered.slice(at)];
  renumbered.forEach((x, i) => {
    x.order = i;
  });
  s.stops = s.stops.filter((x) => !(x.routeId === route.id && x.direction === direction)).concat(renumbered);
  return stop;
}

export class LocalStore implements AppStore {
  auth = {
    sendCode: async (_phone: string): Promise<void> => {},
    verifyCode: async (phone: string, code: string): Promise<string> => {
      if (code !== DEMO_CODE) throw new Error(`Demo mode: use code ${DEMO_CODE}`);
      const id = `local-${phoneKey(phone)}`;
      try {
        localStorage.setItem(USER_KEY, JSON.stringify({ id, phone }));
      } catch {
        // Session will not persist across reloads.
      }
      return id;
    },
    currentUserId: async (): Promise<string | null> => readUser()?.id ?? null,
    currentPhone: async (): Promise<string | null> => readUser()?.phone ?? null,
    signOut: async (): Promise<void> => {
      try {
        localStorage.removeItem(USER_KEY);
      } catch {
        // Nothing to clear.
      }
    },
  };

  async getDriver(id: string) {
    return read().drivers[id] ?? null;
  }

  async saveDriver(driver: Omit<DriverProfile, 'verificationStatus'>) {
    const s = read();
    const existing = s.drivers[driver.id];
    s.drivers[driver.id] = {
      id: driver.id,
      name: driver.name,
      vanSeats: driver.vanSeats,
      verificationStatus: existing?.verificationStatus ?? 'PENDING',
    };
    write(s);
  }

  async isAdmin() {
    return readUser()?.phone === DEMO_ADMIN_PHONE;
  }

  async listDriversByStatus(status: VerificationStatus) {
    if (!(await this.isAdmin())) throw new Error('Admins only');
    return Object.values(read().drivers).filter((d) => d.verificationStatus === status);
  }

  async setDriverStatus(driverId: string, status: VerificationStatus) {
    if (!(await this.isAdmin())) throw new Error('Admins only');
    const s = read();
    const d = s.drivers[driverId];
    if (d) d.verificationStatus = status;
    write(s);
  }

  async eventCounts(days: number) {
    if (!(await this.isAdmin())) throw new Error('Admins only');
    const since = Date.now() - days * 86_400_000;
    const counts = new Map<string, number>();
    for (const e of read().analytics) {
      if (Date.parse(e.createdAt) >= since) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  }

  async deleteMyData() {
    const userId = readUser()?.id;
    if (!userId) return;
    const s = read();
    for (const c of s.children) {
      if (c.parentId === userId) {
        c.parentId = null;
        c.parentPhone = '';
        c.firstName = 'Deleted';
      }
    }
    delete s.parents[userId];
    s.analytics = s.analytics.filter((a) => a.userId !== userId);
    write(s);
  }

  async track(name: AnalyticsName, props: Record<string, string | number> = {}) {
    const userId = readUser()?.id ?? 'anonymous';
    const s = read();
    s.analytics.push({ userId, name, props, createdAt: new Date().toISOString() });
    if (s.analytics.length > ANALYTICS_CAP) s.analytics = s.analytics.slice(-ANALYTICS_CAP);
    write(s);
  }

  async getParent(id: string) {
    return read().parents[id] ?? null;
  }

  async saveParent(input: Omit<ParentProfile, 'referralCode'> & { referralCode?: string }) {
    const s = read();
    const existing = s.parents[input.id];
    const saved: ParentProfile = {
      id: input.id,
      name: input.name,
      phone: input.phone,
      referralCode: existing?.referralCode ?? input.referralCode ?? makeReferralCode(),
      referredBy: existing?.referredBy ?? input.referredBy ?? null,
      consentAt: existing?.consentAt ?? input.consentAt ?? null,
    };
    s.parents[input.id] = saved;
    write(s);
    return saved;
  }

  async getDriverName(id: string) {
    return read().drivers[id]?.name ?? 'Driver';
  }

  async routeDriverName(routeId: string) {
    const s = read();
    const route = s.routes.find((r) => r.id === routeId);
    return (route && s.drivers[route.ownerId]?.name) || 'Driver';
  }

  async createRoute(input: Omit<RouteRecord, 'id' | 'code' | 'createdAt'>) {
    const s = read();
    let code = makeRouteCode();
    while (s.routes.some((r) => r.code === code)) code = makeRouteCode();
    const route: RouteRecord = { ...input, id: newId(), code, createdAt: new Date().toISOString() };
    s.routes.push(route);
    write(s);
    return route;
  }

  async listRoutesForDriver(driverId: string) {
    const s = read();
    const joined = new Set(s.members.filter((m) => m.driverId === driverId).map((m) => m.routeId));
    return s.routes.filter((r) => r.ownerId === driverId || joined.has(r.id));
  }

  async getRoute(routeId: string) {
    return read().routes.find((r) => r.id === routeId) ?? null;
  }

  async joinRouteByCode(code: string) {
    const s = read();
    const driverId = readUser()?.id;
    if (!driverId) throw new Error('Sign in first');
    const route = s.routes.find((r) => r.code === code.trim().toUpperCase());
    if (!route) throw new Error('No route with that code');
    if (route.ownerId !== driverId && !s.members.some((m) => m.routeId === route.id && m.driverId === driverId)) {
      s.members.push({ routeId: route.id, driverId });
      write(s);
    }
    return route;
  }

  async listStops(routeId: string) {
    return read().stops.filter((x) => x.routeId === routeId);
  }

  async addStop(routeId: string, direction: Direction, point: Point) {
    const s = read();
    const route = s.routes.find((r) => r.id === routeId);
    if (!route) throw new Error('Route not found');
    const stop = insertStop(s, route, direction, point);
    write(s);
    return stop;
  }

  async moveStop(stopId: string, delta: -1 | 1) {
    const s = read();
    const stop = s.stops.find((x) => x.id === stopId);
    if (!stop) return;
    const list = orderedStops(s.stops.filter((x) => x.routeId === stop.routeId), stop.direction);
    const i = list.findIndex((x) => x.id === stopId);
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((x, k) => {
      x.order = k;
    });
    write(s);
  }

  async removeStop(stopId: string) {
    const s = read();
    if (s.children.some((c) => c.toSchoolStopId === stopId || c.toHomeStopId === stopId)) {
      throw new Error('A child uses this stop. Move the child first.');
    }
    s.stops = s.stops.filter((x) => x.id !== stopId);
    write(s);
  }

  async listChildrenForRoute(routeId: string) {
    return read().children.filter((c) => c.routeId === routeId);
  }

  async addCustomer(input: {
    routeId: string;
    firstName: string;
    parentPhone: string;
    monthlyFee: number;
    pickup: Point;
    drop: Point | null;
  }) {
    const s = read();
    const toSchool = ensureStop(s, input.routeId, 'TO_SCHOOL', input.pickup);
    const toHome = ensureStop(s, input.routeId, 'TO_HOME', input.drop ?? input.pickup);
    const child: ChildRecord = {
      id: newId(),
      routeId: input.routeId,
      parentId: null,
      parentPhone: phoneKey(input.parentPhone),
      firstName: input.firstName.trim(),
      schoolName: s.routes.find((r) => r.id === input.routeId)?.schoolName ?? '',
      toSchoolStopId: toSchool.id,
      toHomeStopId: toHome.id,
      monthlyFee: input.monthlyFee,
      createdAt: new Date().toISOString(),
    };
    s.children.push(child);
    write(s);
    return child;
  }

  async setMonthlyFee(childId: string, fee: number) {
    const s = read();
    const c = s.children.find((x) => x.id === childId);
    if (c) c.monthlyFee = fee;
    write(s);
  }

  async listChildrenForParent(parentId: string) {
    return read().children.filter((c) => c.parentId === parentId);
  }

  async claimChildrenForPhone(parentId: string, phone: string) {
    const s = read();
    const key = phoneKey(phone);
    let n = 0;
    for (const c of s.children) {
      if (!c.parentId && c.parentPhone === key) {
        c.parentId = parentId;
        n++;
      }
    }
    write(s);
    return n;
  }

  async searchRoutes(schoolName: string, point: Point): Promise<RouteSearchResult[]> {
    const s = read();
    const results: RouteSearchResult[] = [];
    for (const route of s.routes) {
      if (!schoolMatches(route.schoolName, schoolName)) continue;
      if (s.drivers[route.ownerId]?.verificationStatus !== 'VERIFIED') continue;
      const stops = s.stops.filter((x) => x.routeId === route.id);
      const kids = s.children.filter((c) => c.routeId === route.id).length;
      const left = seatsLeft(route.vanSeats, kids);
      if (left === 0) continue;
      const near = stops.some((x) => x.direction === 'TO_SCHOOL')
        ? nearestStopDistance(stops, 'TO_SCHOOL', point)
        : haversineMeters(point, route.start);
      results.push({
        routeId: route.id,
        routeName: route.name,
        schoolName: route.schoolName,
        driverName: s.drivers[route.ownerId]?.name ?? 'Driver',
        seatsLeft: left,
        distanceM: Math.round(near),
      });
    }
    return results.sort((a, b) => a.distanceM - b.distanceM);
  }

  async knownSchools() {
    return [...new Set(read().routes.map((r) => r.schoolName))].sort();
  }

  async enrolChild(input: { routeId: string; parentId: string; parentPhone: string; firstName: string; pickup: Point }) {
    const s = read();
    const route = s.routes.find((r) => r.id === input.routeId);
    if (!route) throw new Error('Van not found');
    const kids = s.children.filter((c) => c.routeId === route.id).length;
    if (seatsLeft(route.vanSeats, kids) === 0) throw new Error('This van is full');
    const toSchool = ensureStop(s, route.id, 'TO_SCHOOL', input.pickup);
    const toHome = ensureStop(s, route.id, 'TO_HOME', input.pickup);
    const child: ChildRecord = {
      id: newId(),
      routeId: route.id,
      parentId: input.parentId,
      parentPhone: phoneKey(input.parentPhone),
      firstName: input.firstName.trim(),
      schoolName: route.schoolName,
      toSchoolStopId: toSchool.id,
      toHomeStopId: toHome.id,
      monthlyFee: 0,
      createdAt: new Date().toISOString(),
    };
    s.children.push(child);
    write(s);
    return child;
  }

  async startTrip(routeId: string, startedBy: string, tripType: TripType, tripId: string) {
    const s = read();
    const now = new Date().toISOString();
    s.trips = s.trips.map((t) => (t.routeId === routeId && !t.endedAt ? { ...t, endedAt: now } : t));
    const trip: TripRecord = { id: tripId, routeId, startedBy, tripType, startedAt: now, endedAt: null };
    s.trips.push(trip);
    write(s);
    return trip;
  }

  async getActiveTrip(routeId: string) {
    return read().trips.find((t) => t.routeId === routeId && !t.endedAt) ?? null;
  }

  async endTrip(tripId: string) {
    const s = read();
    s.trips = s.trips.map((t) => (t.id === tripId ? { ...t, endedAt: new Date().toISOString() } : t));
    write(s);
  }

  async addEvent(event: Omit<EventRecord, 'createdAt'>) {
    const s = read();
    const exists = s.events.some(
      (e) => e.tripId === event.tripId && e.childId === event.childId && e.eventType === event.eventType,
    );
    if (!exists) {
      s.events.push({ ...event, createdAt: new Date().toISOString() });
      write(s);
    }
  }

  async listEvents(tripId: string) {
    return read().events.filter((e) => e.tripId === tripId);
  }

  async setVanLocation(tripId: string, lat: number, lng: number) {
    const s = read();
    s.locations[tripId] = { tripId, lat, lng, updatedAt: new Date().toISOString() };
    write(s);
  }

  async getVanLocation(tripId: string) {
    return read().locations[tripId] ?? null;
  }

  async listPayments(childIds: string[], month: string) {
    const ids = new Set(childIds);
    return read().payments.filter((p) => ids.has(p.childId) && p.month === month);
  }

  private upsertPayment(
    input: { childId: string; month: string; amount: number; method: string; reference: string },
    status: PaymentRecord['status'],
  ) {
    const s = read();
    const now = new Date().toISOString();
    const existing = s.payments.find((p) => p.childId === input.childId && p.month === input.month);
    if (existing) {
      Object.assign(existing, { ...input, status, updatedAt: now });
    } else {
      s.payments.push({ id: newId(), ...input, status, updatedAt: now });
    }
    write(s);
  }

  async reportPayment(input: { childId: string; month: string; amount: number; method: string; reference: string }) {
    this.upsertPayment(input, 'REPORTED');
  }

  async markPaid(input: { childId: string; month: string; amount: number; method: string; reference: string }) {
    this.upsertPayment(input, 'PAID');
  }

  async clearPayment(childId: string, month: string) {
    const s = read();
    s.payments = s.payments.filter((p) => !(p.childId === childId && p.month === month));
    write(s);
  }
}
