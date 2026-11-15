import { supabase } from '../lib/supabase';
import { cheapestInsertIndex, makeReferralCode, orderedStops, phoneKey } from '../logic/routes';
import { haversineMeters } from '../logic/eta';
import type { EventType, TripType } from '../logic/tripProgression';
import type { AppStore } from './store';
import type {
  ChildRecord,
  Direction,
  DriverProfile,
  EventRecord,
  MapStop,
  ParentProfile,
  PaymentRecord,
  Point,
  RouteRecord,
  RouteSearchResult,
  RouteStop,
  TripRecord,
  VanLocation,
  VerificationStatus,
  AnalyticsName,
} from './types';

// Pilot store: Supabase Postgres with row-level security. Needs supabase/migrations/0001_pilot_schema.sql applied.
type Row = Record<string, unknown>;
const SAME_STOP_METRES = 30;

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const mapDriver = (r: Row): DriverProfile => ({
  id: r.id as string,
  name: r.name as string,
  vanSeats: r.van_seats as number,
  verificationStatus: r.verification_status as VerificationStatus,
  referralCode: (r.referral_code as string) ?? '',
  referredBy: (r.referred_by as string | null) ?? null,
});

const mapParent = (r: Row): ParentProfile => ({
  id: r.id as string,
  name: (r.name as string) ?? '',
  phone: r.phone as string,
  referralCode: r.referral_code as string,
  referredBy: (r.referred_by as string | null) ?? null,
  consentAt: (r.consent_at as string | null) ?? null,
});

const mapRoute = (r: Row): RouteRecord => ({
  id: r.id as string,
  ownerId: r.owner_id as string,
  code: r.code as string,
  name: r.name as string,
  schoolName: r.school_name as string,
  school: { lat: r.school_lat as number, lng: r.school_lng as number, label: r.school_name as string },
  start: { lat: r.start_lat as number, lng: r.start_lng as number, label: (r.start_label as string) ?? 'Van base' },
  vanSeats: r.van_seats as number,
  createdAt: r.created_at as string,
});

const mapStop = (r: Row): RouteStop => ({
  id: r.id as string,
  routeId: r.route_id as string,
  direction: r.direction as Direction,
  order: r.stop_order as number,
  point: { lat: r.lat as number, lng: r.lng as number, label: (r.label as string) ?? '' },
});

const mapChild = (r: Row): ChildRecord => ({
  id: r.id as string,
  routeId: r.route_id as string,
  parentId: (r.parent_id as string | null) ?? null,
  parentPhone: r.parent_phone as string,
  firstName: r.first_name as string,
  schoolName: r.school_name as string,
  toSchoolStopId: r.to_school_stop_id as string,
  toHomeStopId: r.to_home_stop_id as string,
  monthlyFee: r.monthly_fee as number,
  createdAt: r.created_at as string,
});

const mapTrip = (r: Row): TripRecord => ({
  id: r.id as string,
  routeId: r.route_id as string,
  startedBy: r.started_by as string,
  tripType: r.trip_type as TripType,
  startedAt: r.started_at as string,
  endedAt: (r.ended_at as string | null) ?? null,
});

const mapEvent = (r: Row): EventRecord => ({
  id: r.id as string,
  tripId: r.trip_id as string,
  childId: r.child_id as string,
  eventType: r.event_type as EventType,
  createdAt: r.created_at as string,
});

const mapPayment = (r: Row): PaymentRecord => ({
  id: r.id as string,
  childId: r.child_id as string,
  month: r.month as string,
  amount: r.amount as number,
  status: r.status as PaymentRecord['status'],
  method: (r.method as string) ?? '',
  reference: (r.reference as string) ?? '',
  updatedAt: r.updated_at as string,
});

export class SupabaseStore implements AppStore {
  auth = {
    sendCode: async (phone: string): Promise<void> => {
      check(await client().auth.signInWithOtp({ phone }));
    },
    verifyCode: async (phone: string, code: string): Promise<string> => {
      const data = check(await client().auth.verifyOtp({ phone, token: code, type: 'sms' }));
      const id = data.user?.id;
      if (!id) throw new Error('Sign-in failed');
      return id;
    },
    currentUserId: async (): Promise<string | null> => {
      const { data } = await client().auth.getUser();
      return data.user?.id ?? null;
    },
    currentPhone: async (): Promise<string | null> => {
      const { data } = await client().auth.getUser();
      return data.user?.phone ?? null;
    },
    signOut: async (): Promise<void> => {
      await client().auth.signOut();
    },
  };

  async getDriver(id: string) {
    const r = check(await client().from('drivers').select('*').eq('id', id).maybeSingle());
    return r ? mapDriver(r as Row) : null;
  }

  async saveDriver(d: { id: string; name: string; vanSeats: number; referredBy?: string | null }) {
    // Status is deliberately not sent: the database trigger rejects status changes from drivers.
    // referral_code is set by the database default; referred_by is kept once set (see migration 0005).
    check(
      await client()
        .from('drivers')
        .upsert({ id: d.id, name: d.name, van_seats: d.vanSeats, ...(d.referredBy ? { referred_by: d.referredBy } : {}) }),
    );
  }

  async isAdmin() {
    return (check(await client().rpc('is_admin')) as boolean) === true;
  }

  async listDriversByStatus(status: VerificationStatus) {
    const rows = check(await client().rpc('admin_drivers', { p_status: status })) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      vanSeats: r.van_seats as number,
      verificationStatus: r.verification_status as VerificationStatus,
      referralCode: (r.referral_code as string) ?? '',
      referredBy: (r.referred_by as string | null) ?? null,
    }));
  }

  async setDriverStatus(driverId: string, status: VerificationStatus) {
    check(await client().rpc('set_driver_status', { p_driver: driverId, p_status: status }));
  }

  async eventCounts(days: number) {
    const rows = check(await client().rpc('admin_event_counts', { p_days: days })) as Row[];
    return rows.map((r) => ({ name: r.name as string, n: Number(r.n) }));
  }

  async deleteMyData() {
    check(await client().rpc('delete_my_data'));
  }

  async track(name: AnalyticsName, props: Record<string, string | number> = {}) {
    // user_id is filled in by the database from the signed-in user. Props must hold counts and enums only.
    check(await client().from('analytics_events').insert({ name, props }));
  }

  async getParent(id: string) {
    const r = check(await client().from('parents').select('*').eq('id', id).maybeSingle());
    return r ? mapParent(r as Row) : null;
  }

  async saveParent(input: Omit<ParentProfile, 'referralCode'> & { referralCode?: string }) {
    const row = {
      id: input.id,
      name: input.name,
      phone: input.phone,
      referral_code: input.referralCode ?? makeReferralCode(),
      referred_by: input.referredBy,
      consent_at: input.consentAt,
    };
    // Keep the referral code and referrer once set.
    const existing = await this.getParent(input.id);
    const payload = existing
      ? { id: input.id, name: input.name, phone: input.phone, consent_at: input.consentAt ?? existing.consentAt }
      : row;
    const saved = check(
      await client().from('parents').upsert(payload).select('*').single(),
    );
    return mapParent(saved as Row);
  }

  async getDriverName(id: string) {
    const d = await this.getDriver(id);
    return d?.name ?? 'Driver';
  }

  async routeDriverName(routeId: string) {
    return (check(await client().rpc('route_driver_name', { p_route_id: routeId })) as string) || 'Driver';
  }

  async createRoute(input: Omit<RouteRecord, 'id' | 'code' | 'createdAt'>) {
    const code = makeCode();
    const row = check(
      await client()
        .from('routes')
        .insert({
          owner_id: input.ownerId,
          code,
          name: input.name,
          school_name: input.schoolName,
          school_lat: input.school.lat,
          school_lng: input.school.lng,
          start_lat: input.start.lat,
          start_lng: input.start.lng,
          start_label: input.start.label,
          van_seats: input.vanSeats,
        })
        .select('*')
        .single(),
    );
    return mapRoute(row as Row);
  }

  async listRoutesForDriver(_driverId: string) {
    // RLS returns routes the user owns or has joined.
    const rows = check(await client().from('routes').select('*').order('created_at'));
    return (rows as Row[]).map(mapRoute);
  }

  async getRoute(routeId: string) {
    const r = check(await client().from('routes').select('*').eq('id', routeId).maybeSingle());
    return r ? mapRoute(r as Row) : null;
  }

  async joinRouteByCode(code: string) {
    const rid = check(await client().rpc('join_route', { p_code: code }));
    const route = await this.getRoute(rid as string);
    if (!route) throw new Error('Route not found');
    return route;
  }

  async routeMap(routeId: string): Promise<MapStop[]> {
    const rows = check(await client().rpc('route_map', { p_route_id: routeId })) as Row[];
    return rows.map((r) => ({
      id: (r.id as string | null) ?? null,
      kind: r.kind as MapStop['kind'],
      direction: (r.direction as Direction | null) ?? null,
      order: (r.stop_order as number) ?? 0,
      point: { lat: r.lat as number, lng: r.lng as number, label: (r.label as string) ?? '' },
      childCount: (r.child_count as number) ?? 0,
      names: (r.names as string[] | null) ?? [],
    }));
  }

  async listStops(routeId: string) {
    const rows = check(await client().from('route_stops').select('*').eq('route_id', routeId));
    return (rows as Row[]).map(mapStop);
  }

  // Inserts a stop at the cheapest position in its direction, then renumbers the direction.
  private async insertStop(route: RouteRecord, direction: Direction, point: Point): Promise<RouteStop> {
    const all = await this.listStops(route.id);
    const ordered = orderedStops(all, direction);
    const endpoints = direction === 'TO_SCHOOL' ? [route.start, route.school] : [route.school, route.start];
    const at = cheapestInsertIndex(ordered.map((s) => s.point), endpoints[0], endpoints[1], point);
    const created = check(
      await client()
        .from('route_stops')
        .insert({ route_id: route.id, direction, stop_order: at, lat: point.lat, lng: point.lng, label: point.label })
        .select('*')
        .single(),
    );
    // Shift the later stops down by one so the orders stay unique.
    const later = ordered.slice(at);
    for (const s of later) {
      check(await client().from('route_stops').update({ stop_order: s.order + 1 }).eq('id', s.id));
    }
    return mapStop(created as Row);
  }

  private async ensureStop(route: RouteRecord, direction: Direction, point: Point): Promise<RouteStop> {
    const near = (await this.listStops(route.id)).find(
      (s) => s.direction === direction && haversineMeters(s.point, point) <= SAME_STOP_METRES,
    );
    return near ?? this.insertStop(route, direction, point);
  }

  async addStop(routeId: string, direction: Direction, point: Point) {
    const route = await this.getRoute(routeId);
    if (!route) throw new Error('Route not found');
    return this.insertStop(route, direction, point);
  }

  async moveStop(stopId: string, delta: -1 | 1) {
    const stop = check(await client().from('route_stops').select('*').eq('id', stopId).single());
    const mine = mapStop(stop as Row);
    const list = orderedStops(await this.listStops(mine.routeId), mine.direction);
    const i = list.findIndex((s) => s.id === stopId);
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    const other = list[j];
    // Swap orders through a temporary value to respect the unique (route, direction, order) constraint.
    check(await client().from('route_stops').update({ stop_order: -1 }).eq('id', mine.id));
    check(await client().from('route_stops').update({ stop_order: mine.order }).eq('id', other.id));
    check(await client().from('route_stops').update({ stop_order: other.order }).eq('id', mine.id));
  }

  async removeStop(stopId: string) {
    check(await client().from('route_stops').delete().eq('id', stopId));
  }

  async listChildrenForRoute(routeId: string) {
    const rows = check(await client().from('children').select('*').eq('route_id', routeId).order('created_at'));
    return (rows as Row[]).map(mapChild);
  }

  async addCustomer(input: {
    routeId: string;
    firstName: string;
    parentPhone: string;
    monthlyFee: number;
    pickup: Point;
    drop: Point | null;
  }) {
    const route = await this.getRoute(input.routeId);
    if (!route) throw new Error('Route not found');
    const toSchool = await this.ensureStop(route, 'TO_SCHOOL', input.pickup);
    const toHome = await this.ensureStop(route, 'TO_HOME', input.drop ?? input.pickup);
    const row = check(
      await client()
        .from('children')
        .insert({
          route_id: route.id,
          parent_phone: phoneKey(input.parentPhone),
          first_name: input.firstName.trim(),
          school_name: route.schoolName,
          to_school_stop_id: toSchool.id,
          to_home_stop_id: toHome.id,
          monthly_fee: input.monthlyFee,
        })
        .select('*')
        .single(),
    );
    return mapChild(row as Row);
  }

  async setMonthlyFee(childId: string, fee: number) {
    check(await client().from('children').update({ monthly_fee: fee }).eq('id', childId));
  }

  async listChildrenForParent(parentId: string) {
    const rows = check(await client().from('children').select('*').eq('parent_id', parentId));
    return (rows as Row[]).map(mapChild);
  }

  async claimChildrenForPhone(_parentId: string, _phone: string) {
    return check(await client().rpc('claim_children')) as number;
  }

  async searchRoutes(schoolName: string, point: Point): Promise<RouteSearchResult[]> {
    const rows = check(
      await client().rpc('search_routes', { p_school: schoolName, p_lat: point.lat, p_lng: point.lng }),
    ) as Row[];
    return rows.map((r) => ({
      routeId: r.route_id as string,
      routeName: r.route_name as string,
      schoolName: r.school_name as string,
      driverName: r.driver_name as string,
      seatsLeft: r.seats_left as number,
      distanceM: r.distance_m as number,
    }));
  }

  async knownSchools() {
    const rows = check(await client().rpc('known_schools')) as Row[];
    return [...new Set(rows.map((r) => r.school_name as string))].sort();
  }

  async enrolChild(input: { routeId: string; parentId: string; parentPhone: string; firstName: string; pickup: Point }) {
    const id = check(
      await client().rpc('enrol_child', {
        p_route_id: input.routeId,
        p_first_name: input.firstName,
        p_lat: input.pickup.lat,
        p_lng: input.pickup.lng,
        p_label: input.pickup.label,
      }),
    ) as string;
    const row = check(await client().from('children').select('*').eq('id', id).single());
    return mapChild(row as Row);
  }

  async startTrip(routeId: string, startedBy: string, tripType: TripType, tripId: string) {
    check(
      await client()
        .from('trips')
        .update({ ended_at: new Date().toISOString() })
        .eq('route_id', routeId)
        .is('ended_at', null),
    );
    const row = check(
      await client()
        .from('trips')
        .insert({ id: tripId, route_id: routeId, started_by: startedBy, trip_type: tripType })
        .select('*')
        .single(),
    );
    return mapTrip(row as Row);
  }

  async getActiveTrip(routeId: string) {
    const row = check(
      await client().from('trips').select('*').eq('route_id', routeId).is('ended_at', null).maybeSingle(),
    );
    return row ? mapTrip(row as Row) : null;
  }

  async endTrip(tripId: string) {
    check(await client().from('trips').update({ ended_at: new Date().toISOString() }).eq('id', tripId));
  }

  async addEvent(e: Omit<EventRecord, 'createdAt'>) {
    // The unique (trip, child, event) constraint makes a repeat tap a no-op.
    check(
      await client()
        .from('trip_events')
        .upsert(
          { id: e.id, trip_id: e.tripId, child_id: e.childId, event_type: e.eventType },
          { onConflict: 'trip_id,child_id,event_type', ignoreDuplicates: true },
        ),
    );
  }

  async listEvents(tripId: string) {
    const rows = check(await client().from('trip_events').select('*').eq('trip_id', tripId));
    return (rows as Row[]).map(mapEvent);
  }

  async setVanLocation(tripId: string, lat: number, lng: number) {
    check(
      await client()
        .from('driver_locations')
        .upsert({ trip_id: tripId, lat, lng, updated_at: new Date().toISOString() }),
    );
  }

  async getVanLocation(tripId: string): Promise<VanLocation | null> {
    const r = check(await client().from('driver_locations').select('*').eq('trip_id', tripId).maybeSingle());
    if (!r) return null;
    return {
      tripId: r.trip_id as string,
      lat: r.lat as number,
      lng: r.lng as number,
      updatedAt: r.updated_at as string,
    };
  }

  async listPayments(childIds: string[], month: string) {
    if (childIds.length === 0) return [];
    const rows = check(await client().from('payments').select('*').in('child_id', childIds).eq('month', month));
    return (rows as Row[]).map(mapPayment);
  }

  private async upsertPayment(
    input: { childId: string; month: string; amount: number; method: string; reference: string },
    status: PaymentRecord['status'],
  ) {
    check(
      await client()
        .from('payments')
        .upsert(
          {
            child_id: input.childId,
            month: input.month,
            amount: input.amount,
            status,
            method: input.method,
            reference: input.reference,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'child_id,month' },
        ),
    );
  }

  async reportPayment(input: { childId: string; month: string; amount: number; method: string; reference: string }) {
    await this.upsertPayment(input, 'REPORTED');
  }

  async markPaid(input: { childId: string; month: string; amount: number; method: string; reference: string }) {
    await this.upsertPayment(input, 'PAID');
  }

  async clearPayment(childId: string, month: string) {
    check(await client().from('payments').delete().eq('child_id', childId).eq('month', month));
  }
}

function makeCode(): string {
  return makeReferralCode();
}
