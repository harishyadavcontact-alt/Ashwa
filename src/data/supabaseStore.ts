import { supabase } from '../lib/supabase';
import type { EventType, TripType } from '../logic/tripProgression';
import type { AppStore } from './store';
import type {
  ChildRecord,
  DriverProfile,
  EventRecord,
  ParentProfile,
  TripRecord,
  VanLocation,
} from './types';

// Pilot store: Supabase Postgres with row-level security. Requires the schema in supabase/migrations to be applied.
type Row = Record<string, unknown>;

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function mapChild(r: Row): ChildRecord {
  return {
    id: r.id as string,
    parentId: r.parent_id as string,
    driverId: r.driver_id as string,
    firstName: r.first_name as string,
    schoolName: r.school_name as string,
    schoolLat: (r.school_lat as number | null) ?? null,
    schoolLng: (r.school_lng as number | null) ?? null,
    pickup: { lat: r.pickup_lat as number, lng: r.pickup_lng as number, label: (r.pickup_label as string) ?? '' },
    drop: { lat: r.drop_lat as number, lng: r.drop_lng as number, label: (r.drop_label as string) ?? '' },
    createdAt: r.created_at as string,
  };
}

function mapTrip(r: Row): TripRecord {
  return {
    id: r.id as string,
    driverId: r.driver_id as string,
    tripType: r.trip_type as TripType,
    startedAt: r.started_at as string,
    endedAt: (r.ended_at as string | null) ?? null,
  };
}

function mapEvent(r: Row): EventRecord {
  return {
    id: r.id as string,
    tripId: r.trip_id as string,
    childId: r.child_id as string,
    eventType: r.event_type as EventType,
    createdAt: r.created_at as string,
  };
}

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
    signOut: async (): Promise<void> => {
      await client().auth.signOut();
    },
  };

  async getDriver(id: string) {
    const r = check(await client().from('drivers').select('*').eq('id', id).maybeSingle());
    return r
      ? {
          id: r.id as string,
          name: r.name as string,
          vanSeats: r.van_seats as number,
          baseLat: (r.base_lat as number | null) ?? null,
          baseLng: (r.base_lng as number | null) ?? null,
        }
      : null;
  }

  async saveDriver(d: DriverProfile) {
    check(
      await client()
        .from('drivers')
        .upsert({ id: d.id, name: d.name, van_seats: d.vanSeats, base_lat: d.baseLat, base_lng: d.baseLng }),
    );
  }

  async getParent(id: string) {
    const r = check(await client().from('parents').select('*').eq('id', id).maybeSingle());
    return r ? { id: r.id as string, name: (r.name as string) ?? '', phone: r.phone as string } : null;
  }

  async saveParent(p: ParentProfile) {
    check(await client().from('parents').upsert({ id: p.id, name: p.name, phone: p.phone }));
  }

  async listChildrenForDriver(driverId: string) {
    const rows = check(await client().from('children').select('*').eq('driver_id', driverId));
    return (rows as Row[]).map(mapChild);
  }

  async listChildrenForParent(parentId: string) {
    const rows = check(await client().from('children').select('*').eq('parent_id', parentId));
    return (rows as Row[]).map(mapChild);
  }

  async addChild(c: ChildRecord) {
    check(
      await client().from('children').insert({
        id: c.id,
        parent_id: c.parentId,
        driver_id: c.driverId,
        first_name: c.firstName,
        school_name: c.schoolName,
        school_lat: c.schoolLat,
        school_lng: c.schoolLng,
        pickup_lat: c.pickup.lat,
        pickup_lng: c.pickup.lng,
        pickup_label: c.pickup.label,
        drop_lat: c.drop.lat,
        drop_lng: c.drop.lng,
        drop_label: c.drop.label,
      }),
    );
  }

  async startTrip(driverId: string, tripType: TripType, tripId: string) {
    const now = new Date().toISOString();
    check(
      await client().from('trips').update({ ended_at: now }).eq('driver_id', driverId).is('ended_at', null),
    );
    const row = check(
      await client()
        .from('trips')
        .insert({ id: tripId, driver_id: driverId, trip_type: tripType, started_at: now })
        .select()
        .single(),
    );
    return mapTrip(row as Row);
  }

  async getActiveTrip(driverId: string) {
    const row = check(
      await client().from('trips').select('*').eq('driver_id', driverId).is('ended_at', null).maybeSingle(),
    );
    return row ? mapTrip(row as Row) : null;
  }

  async endTrip(tripId: string) {
    check(await client().from('trips').update({ ended_at: new Date().toISOString() }).eq('id', tripId));
  }

  async addEvent(e: Omit<EventRecord, 'createdAt'>) {
    // Unique (trip, child, event) in the schema makes a repeat tap a no-op.
    const res = await client()
      .from('trip_events')
      .upsert(
        { id: e.id, trip_id: e.tripId, child_id: e.childId, event_type: e.eventType },
        { onConflict: 'trip_id,child_id,event_type', ignoreDuplicates: true },
      );
    check(res);
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
}
