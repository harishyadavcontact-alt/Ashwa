import { parentMessage, unseenFor, type TripEventLike } from '../logic/alerts';
import type { EventType } from '../logic/tripProgression';

// Notifies a parent once per new trip update, per device. The first visit marks history as seen silently.

interface ChildCopy {
  firstName: string;
  schoolName: string;
  pickupLabel: string;
  dropLabel: string;
}

const KEY = (childId: string) => `ashwa.seen.${childId}`;

function load(childId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(KEY(childId));
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function save(childId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(KEY(childId), JSON.stringify([...ids].slice(-500)));
  } catch {
    // Storage blocked: the same updates may notify again on reload.
  }
}

export function notifyNewUpdates<T extends TripEventLike & { id: string }>(childId: string, events: T[], copy: ChildCopy): void {
  const seen = load(childId);
  if (!seen) {
    save(childId, new Set(events.filter((e) => e.childId === childId || isShared(e.eventType)).map((e) => e.id)));
    return;
  }
  const fresh = unseenFor(events, childId, seen);
  if (fresh.length === 0) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    for (const e of fresh.slice(0, 3)) {
      new Notification(parentMessage(e.eventType, copy));
    }
  }
  save(childId, new Set([...seen, ...fresh.map((e) => e.id)]));
}

function isShared(e: EventType): boolean {
  return e === 'DRIVER_AT_SCHOOL' || e === 'DRIVER_LEFT_SCHOOL';
}
