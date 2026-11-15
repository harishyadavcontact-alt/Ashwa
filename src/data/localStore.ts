import type { TripType } from '../logic/tripProgression';
import type { AppStore } from './store';
import type {
  ChildRecord,
  DriverProfile,
  EventRecord,
  ParentProfile,
  TripRecord,
  VanLocation,
} from './types';

// Demo store: everything lives in this browser's localStorage. Good for trying the flows, never for real families.
// Fake login: any phone with code 000000 signs in.

const KEY = 'ashwa.local.v1';
const USER_KEY = 'ashwa.local.user';
const DEMO_CODE = '000000';

interface State {
  drivers: Record<string, DriverProfile>;
  parents: Record<string, ParentProfile>;
  children: ChildRecord[];
  trips: TripRecord[];
  events: EventRecord[];
  locations: Record<string, VanLocation>;
}

const empty: State = { drivers: {}, parents: {}, children: [], trips: [], events: [], locations: {} };

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
    // Storage full or blocked: the in-memory run continues; the user sees stale data on reload.
  }
}

function readUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export class LocalStore implements AppStore {
  auth = {
    sendCode: async (_phone: string): Promise<void> => {},
    verifyCode: async (phone: string, code: string): Promise<string> => {
      if (code !== DEMO_CODE) throw new Error(`Demo mode: use code ${DEMO_CODE}`);
      const id = `local-${phone.replace(/\D/g, '')}`;
      try {
        localStorage.setItem(USER_KEY, id);
      } catch {
        // Session will not persist across reloads.
      }
      return id;
    },
    currentUserId: async (): Promise<string | null> => readUser(),
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

  async saveDriver(driver: DriverProfile) {
    const s = read();
    s.drivers[driver.id] = driver;
    write(s);
  }

  async getParent(id: string) {
    return read().parents[id] ?? null;
  }

  async saveParent(parent: ParentProfile) {
    const s = read();
    s.parents[parent.id] = parent;
    write(s);
  }

  async listChildrenForDriver(driverId: string) {
    return read().children.filter((c) => c.driverId === driverId);
  }

  async listChildrenForParent(parentId: string) {
    return read().children.filter((c) => c.parentId === parentId);
  }

  async addChild(child: ChildRecord) {
    const s = read();
    s.children.push(child);
    write(s);
  }

  async startTrip(driverId: string, tripType: TripType, tripId: string) {
    const s = read();
    const now = new Date().toISOString();
    s.trips = s.trips.map((t) => (t.driverId === driverId && !t.endedAt ? { ...t, endedAt: now } : t));
    const trip: TripRecord = { id: tripId, driverId, tripType, startedAt: now, endedAt: null };
    s.trips.push(trip);
    write(s);
    return trip;
  }

  async getActiveTrip(driverId: string) {
    return read().trips.find((t) => t.driverId === driverId && !t.endedAt) ?? null;
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
}
