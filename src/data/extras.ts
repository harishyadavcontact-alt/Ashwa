import { supabase } from '../lib/supabase';
import { phoneKey } from '../logic/routes';
import { store } from './index';
import type { Point } from './types';

// Growth and operations: referrals, waitlist, incidents, absences, backup drivers, push, funnel.
// Demo and Supabase implementations sit side by side. Screens only use `extras`.

export interface WaitlistEntry {
  id: string;
  firstName: string;
  schoolName: string;
  pickupLabel: string;
  pickupLat: number;
  pickupLng: number;
  status: string;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  routeId: string;
  kind: string;
  note: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  routeId: string;
  routeName: string;
  schoolName: string;
  day: string;
  note: string;
  ownerName: string;
}

export const INCIDENT_KINDS = ['Child unwell', 'Road blocked or delay', 'Van problem', 'Other'] as const;

export interface Extras {
  // Referrals (drivers and parents)
  trackReferralOpen(code: string): Promise<void>;
  redeemReferral(code: string): Promise<void>;
  myReferralStats(): Promise<{ opens: number; joins: number }>;

  // Drivers: a parent on the route can message the driver on WhatsApp
  syncMyPhone(): Promise<void>;
  driverPhoneForRoute(routeId: string): Promise<string | null>;

  // Waitlist for new parents
  joinWaitlist(input: { firstName: string; school: string; pickup: Point }): Promise<void>;
  listWaitlist(): Promise<WaitlistEntry[]>;

  // Problems on a run
  reportIncident(routeId: string, kind: string, note: string): Promise<void>;
  listIncidents(): Promise<IncidentRecord[]>;

  // Absences, by day (YYYY-MM-DD)
  setAbsent(childId: string, day: string, absent: boolean): Promise<void>;
  absentChildIds(childIds: string[], day: string): Promise<string[]>;

  // Backup drivers
  requestBackup(routeId: string, day: string, note: string): Promise<void>;
  openBackups(): Promise<BackupRecord[]>;
  coverBackup(id: string): Promise<void>;

  // Web push
  savePushSubscription(sub: PushSubscriptionJSON): Promise<void>;

  // Driver's own week
  myWeekStats(): Promise<{ runs: number; families: number }>;

  // Founder funnel
  funnel(days: number): Promise<{ stage: string; n: number }[]>;
}

export const todayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- Demo implementation (localStorage) ----------

const EXTRAS_KEY = 'ashwa.local.extras';
const STATE_KEY = 'ashwa.local.v2';
const USER_KEY = 'ashwa.local.user';

interface ExtrasState {
  referrals: { code: string; event: 'OPEN' | 'JOIN'; userId: string | null; at: string }[];
  phones: Record<string, string>;
  waitlist: (WaitlistEntry & { parentId: string })[];
  incidents: (IncidentRecord & { reporterId: string })[];
  absences: { childId: string; day: string }[];
  backups: { id: string; routeId: string; requestedBy: string; day: string; note: string; status: string; coveredBy: string | null; at: string }[];
  push: { endpoint: string; keys: unknown }[];
}

const emptyExtras: ExtrasState = { referrals: [], phones: {}, waitlist: [], incidents: [], absences: [], backups: [], push: [] };

function readExtras(): ExtrasState {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    return raw ? { ...emptyExtras, ...(JSON.parse(raw) as Partial<ExtrasState>) } : { ...emptyExtras };
  } catch {
    return { ...emptyExtras };
  }
}

function writeExtras(s: ExtrasState): void {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: the demo keeps working for this session.
  }
}

interface V2 {
  drivers: Record<string, { id: string; name: string; referralCode: string; referredBy: string | null }>;
  parents: Record<string, { id: string; referralCode: string; referredBy: string | null }>;
  routes: { id: string; ownerId: string; name: string; schoolName: string; createdAt: string; vanSeats: number }[];
  members: { routeId: string; driverId: string }[];
  children: { id: string; routeId: string; parentId: string | null; parentPhone: string; createdAt: string }[];
  trips: { routeId: string; startedBy: string; startedAt: string }[];
  payments: { status: string; updatedAt: string }[];
}

function readV2(): V2 {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const s = raw ? (JSON.parse(raw) as Partial<V2>) : {};
    return {
      drivers: s.drivers ?? {},
      parents: s.parents ?? {},
      routes: s.routes ?? [],
      members: s.members ?? [],
      children: s.children ?? [],
      trips: (s as { trips?: V2['trips'] }).trips ?? [],
      payments: (s as { payments?: V2['payments'] }).payments ?? [],
    };
  } catch {
    return { drivers: {}, parents: {}, routes: [], members: [], children: [], trips: [], payments: [] };
  }
}

function writeV2(s: V2 & Record<string, unknown>): void {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const full = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...full, drivers: s.drivers, parents: s.parents }));
  } catch {
    // ignore
  }
}

function currentUser(): { id: string; phone: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { id: string; phone: string }) : null;
  } catch {
    return null;
  }
}

function requireUser(): { id: string; phone: string } {
  const u = currentUser();
  if (!u) throw new Error('Sign in first');
  return u;
}

class LocalExtras implements Extras {
  async trackReferralOpen(code: string) {
    const c = code.trim().toUpperCase();
    const v = readV2();
    const owned = Object.values(v.drivers).some((d) => d.referralCode === c) || Object.values(v.parents).some((p) => p.referralCode === c);
    if (!owned) return;
    const s = readExtras();
    s.referrals.push({ code: c, event: 'OPEN', userId: null, at: new Date().toISOString() });
    writeExtras(s);
  }

  async redeemReferral(code: string) {
    const me = requireUser();
    const c = code.trim().toUpperCase();
    const v = readV2();
    const ownerDriver = Object.values(v.drivers).find((d) => d.referralCode === c);
    const ownerParent = Object.values(v.parents).find((p) => p.referralCode === c);
    const ownerId = ownerDriver?.id ?? ownerParent?.id;
    if (!ownerId || ownerId === me.id) return;
    const s = readExtras();
    if (s.referrals.some((r) => r.event === 'JOIN' && r.userId === me.id)) return;
    if (v.drivers[me.id] && !v.drivers[me.id].referredBy) v.drivers[me.id].referredBy = c;
    if (v.parents[me.id] && !v.parents[me.id].referredBy) v.parents[me.id].referredBy = c;
    writeV2(v as V2 & Record<string, unknown>);
    s.referrals.push({ code: c, event: 'JOIN', userId: me.id, at: new Date().toISOString() });
    writeExtras(s);
  }

  async myReferralStats() {
    const me = requireUser();
    const v = readV2();
    const codes = new Set([v.drivers[me.id]?.referralCode, v.parents[me.id]?.referralCode].filter(Boolean) as string[]);
    const s = readExtras();
    const mine = s.referrals.filter((r) => codes.has(r.code));
    return { opens: mine.filter((r) => r.event === 'OPEN').length, joins: mine.filter((r) => r.event === 'JOIN').length };
  }

  async syncMyPhone() {
    const me = requireUser();
    const s = readExtras();
    s.phones[me.id] = phoneKey(me.phone);
    writeExtras(s);
  }

  async driverPhoneForRoute(routeId: string) {
    const me = requireUser();
    const v = readV2();
    const route = v.routes.find((r) => r.id === routeId);
    if (!route) return null;
    if (!v.children.some((c) => c.routeId === routeId && c.parentId === me.id)) return null;
    return readExtras().phones[route.ownerId] ?? null;
  }

  async joinWaitlist(input: { firstName: string; school: string; pickup: Point }) {
    const me = requireUser();
    const s = readExtras();
    s.waitlist.push({
      id: crypto.randomUUID(),
      parentId: me.id,
      firstName: input.firstName.trim(),
      schoolName: input.school.trim(),
      pickupLabel: input.pickup.label,
      pickupLat: input.pickup.lat,
      pickupLng: input.pickup.lng,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });
    writeExtras(s);
  }

  async listWaitlist() {
    if (!(await store.isAdmin())) throw new Error('Admins only');
    return readExtras().waitlist.map(({ parentId: _p, ...w }) => w);
  }

  async reportIncident(routeId: string, kind: string, note: string) {
    const me = requireUser();
    const s = readExtras();
    s.incidents.push({ id: crypto.randomUUID(), routeId, kind, note: note.slice(0, 500), createdAt: new Date().toISOString(), reporterId: me.id });
    writeExtras(s);
  }

  async listIncidents() {
    if (!(await store.isAdmin())) throw new Error('Admins only');
    return readExtras().incidents.map(({ reporterId: _r, ...i }) => i);
  }

  async setAbsent(childId: string, day: string, absent: boolean) {
    const s = readExtras();
    s.absences = s.absences.filter((a) => !(a.childId === childId && a.day === day));
    if (absent) s.absences.push({ childId, day });
    writeExtras(s);
  }

  async absentChildIds(childIds: string[], day: string) {
    const set = new Set(childIds);
    return readExtras()
      .absences.filter((a) => a.day === day && set.has(a.childId))
      .map((a) => a.childId);
  }

  async requestBackup(routeId: string, day: string, note: string) {
    const me = requireUser();
    const s = readExtras();
    s.backups.push({ id: crypto.randomUUID(), routeId, requestedBy: me.id, day, note: note.slice(0, 200), status: 'OPEN', coveredBy: null, at: new Date().toISOString() });
    writeExtras(s);
  }

  async openBackups() {
    const me = requireUser();
    const v = readV2();
    if (v.drivers[me.id]?.referralCode === undefined) return [];
    const s = readExtras();
    const today = todayKey();
    return s.backups
      .filter((b) => b.status === 'OPEN' && b.day >= today && b.requestedBy !== me.id)
      .map((b) => {
        const route = v.routes.find((r) => r.id === b.routeId);
        return {
          id: b.id,
          routeId: b.routeId,
          routeName: route?.name ?? 'Route',
          schoolName: route?.schoolName ?? '',
          day: b.day,
          note: b.note,
          ownerName: route ? v.drivers[route.ownerId]?.name ?? 'Driver' : 'Driver',
        };
      });
  }

  async coverBackup(id: string) {
    const me = requireUser();
    const s = readExtras();
    const b = s.backups.find((x) => x.id === id && x.status === 'OPEN');
    if (!b) throw new Error('That backup is no longer open');
    b.status = 'COVERED';
    b.coveredBy = me.id;
    writeExtras(s);
  }

  async savePushSubscription(sub: PushSubscriptionJSON) {
    if (!sub.endpoint) return;
    const s = readExtras();
    s.push = [...s.push.filter((p) => p.endpoint !== sub.endpoint), { endpoint: sub.endpoint, keys: sub.keys }];
    writeExtras(s);
  }

  async myWeekStats() {
    const me = requireUser();
    const v = readV2();
    const since = Date.now() - 7 * 86_400_000;
    const runs = v.trips.filter((t) => t.startedBy === me.id && Date.parse(t.startedAt) > since).length;
    const mine = new Set(v.routes.filter((r) => r.ownerId === me.id).map((r) => r.id));
    const families = v.children.filter((c) => mine.has(c.routeId)).length;
    return { runs, families };
  }

  async funnel(days: number) {
    if (!(await store.isAdmin())) throw new Error('Admins only');
    const since = Date.now() - days * 86_400_000;
    const inWindow = (at: string) => Date.parse(at) > since;
    const v = readV2();
    const s = readExtras();
    const drivers = Object.values(v.drivers);
    const count = (xs: { createdAt?: string }[]) => xs.filter((x) => inWindow(x.createdAt ?? '')).length;
    return [
      { stage: 'Invite opened', n: s.referrals.filter((r) => r.event === 'OPEN' && inWindow(r.at)).length },
      { stage: 'Joined by referral', n: s.referrals.filter((r) => r.event === 'JOIN' && inWindow(r.at)).length },
      { stage: 'Drivers signed up', n: drivers.length },
      { stage: 'Routes created', n: count(v.routes) },
      { stage: 'Customers added', n: count(v.children) },
      { stage: 'Customers joined', n: v.children.filter((c) => c.parentId && inWindow(c.createdAt)).length },
      { stage: 'Runs started', n: v.trips.filter((t) => inWindow(t.startedAt)).length },
      { stage: 'Payments reported', n: v.payments.filter((p) => inWindow(p.updatedAt)).length },
      { stage: 'Payments confirmed', n: v.payments.filter((p) => p.status === 'PAID' && inWindow(p.updatedAt)).length },
      { stage: 'Waitlist requests', n: s.waitlist.filter((w) => inWindow(w.createdAt)).length },
      { stage: 'Problems reported', n: s.incidents.filter((i) => inWindow(i.createdAt)).length },
    ];
  }
}

// ---------- Supabase implementation ----------

type Row = Record<string, unknown>;
function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}
function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

class SupabaseExtras implements Extras {
  async trackReferralOpen(code: string) {
    await client().rpc('track_referral_open', { p_code: code });
  }

  async redeemReferral(code: string) {
    check(await client().rpc('redeem_referral', { p_code: code }));
  }

  async myReferralStats() {
    const rows = check(await client().rpc('my_referral_stats')) as Row[];
    const r = rows[0] ?? {};
    return { opens: Number(r.opens ?? 0), joins: Number(r.joins ?? 0) };
  }

  async syncMyPhone() {
    check(await client().rpc('sync_my_phone'));
  }

  async driverPhoneForRoute(routeId: string) {
    return (check(await client().rpc('driver_phone_for_route', { p_route: routeId })) as string | null) ?? null;
  }

  async joinWaitlist(input: { firstName: string; school: string; pickup: Point }) {
    check(
      await client().rpc('join_waitlist', {
        p_first_name: input.firstName,
        p_school: input.school,
        p_label: input.pickup.label,
        p_lat: input.pickup.lat,
        p_lng: input.pickup.lng,
      }),
    );
  }

  async listWaitlist() {
    const rows = check(await client().rpc('admin_waitlist')) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      firstName: r.first_name as string,
      schoolName: r.school_name as string,
      pickupLabel: (r.pickup_label as string) ?? '',
      pickupLat: r.pickup_lat as number,
      pickupLng: r.pickup_lng as number,
      status: r.status as string,
      createdAt: r.created_at as string,
    }));
  }

  async reportIncident(routeId: string, kind: string, note: string) {
    check(await client().rpc('report_incident', { p_route: routeId, p_kind: kind, p_note: note }));
  }

  async listIncidents() {
    const rows = check(await client().rpc('admin_incidents')) as Row[];
    return rows.map((r) => ({ id: r.id as string, routeId: r.route_id as string, kind: r.kind as string, note: r.note as string, createdAt: r.created_at as string }));
  }

  async setAbsent(childId: string, day: string, absent: boolean) {
    if (absent) {
      check(await client().from('absences').upsert({ child_id: childId, day }));
    } else {
      check(await client().from('absences').delete().eq('child_id', childId).eq('day', day));
    }
  }

  async absentChildIds(childIds: string[], day: string) {
    if (childIds.length === 0) return [];
    const rows = check(await client().from('absences').select('child_id').in('child_id', childIds).eq('day', day)) as Row[];
    return rows.map((r) => r.child_id as string);
  }

  async requestBackup(routeId: string, day: string, note: string) {
    check(await client().rpc('request_backup', { p_route: routeId, p_day: day, p_note: note }));
  }

  async openBackups() {
    const rows = check(await client().rpc('open_backups')) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      routeId: r.route_id as string,
      routeName: r.route_name as string,
      schoolName: r.school_name as string,
      day: String(r.day),
      note: (r.note as string) ?? '',
      ownerName: r.owner_name as string,
    }));
  }

  async coverBackup(id: string) {
    check(await client().rpc('cover_backup', { p_id: id }));
  }

  async savePushSubscription(sub: PushSubscriptionJSON) {
    if (!sub.endpoint) return;
    const { data } = await client().auth.getUser();
    const uid = data.user?.id;
    if (!uid) throw new Error('Sign in first');
    check(await client().from('push_subscriptions').upsert({ endpoint: sub.endpoint, user_id: uid, keys: sub.keys ?? {} }));
  }

  async myWeekStats() {
    const rows = check(await client().rpc('my_week_stats')) as Row[];
    const r = rows[0] ?? {};
    return { runs: Number(r.runs ?? 0), families: Number(r.families ?? 0) };
  }

  async funnel(days: number) {
    const rows = check(await client().rpc('admin_funnel', { p_days: days })) as Row[];
    return rows.map((r) => ({ stage: r.stage as string, n: Number(r.n) }));
  }
}

export const extras: Extras = supabase ? new SupabaseExtras() : new LocalExtras();
