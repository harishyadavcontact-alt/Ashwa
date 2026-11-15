import type { TripType } from '../logic/tripProgression';
import type {
  ChildRecord,
  DriverProfile,
  EventRecord,
  ParentProfile,
  TripRecord,
  VanLocation,
} from './types';

// One interface, two implementations: LocalStore (demo, no backend) and SupabaseStore (pilot).
// The UI only talks to this interface.
export interface AppStore {
  auth: {
    sendCode(phone: string): Promise<void>;
    verifyCode(phone: string, code: string): Promise<string>;
    currentUserId(): Promise<string | null>;
    signOut(): Promise<void>;
  };
  getDriver(id: string): Promise<DriverProfile | null>;
  saveDriver(driver: DriverProfile): Promise<void>;
  getParent(id: string): Promise<ParentProfile | null>;
  saveParent(parent: ParentProfile): Promise<void>;
  listChildrenForDriver(driverId: string): Promise<ChildRecord[]>;
  listChildrenForParent(parentId: string): Promise<ChildRecord[]>;
  addChild(child: ChildRecord): Promise<void>;
  startTrip(driverId: string, tripType: TripType, tripId: string): Promise<TripRecord>;
  getActiveTrip(driverId: string): Promise<TripRecord | null>;
  endTrip(tripId: string): Promise<void>;
  addEvent(event: Omit<EventRecord, 'createdAt'>): Promise<void>;
  listEvents(tripId: string): Promise<EventRecord[]>;
  setVanLocation(tripId: string, lat: number, lng: number): Promise<void>;
  getVanLocation(tripId: string): Promise<VanLocation | null>;
}
