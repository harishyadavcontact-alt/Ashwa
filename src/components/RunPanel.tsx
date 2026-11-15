import { useEffect, useRef, useState } from 'react';
import { store } from '../data';
import type { ChildRecord, EventRecord, RouteRecord, RouteStop, TripRecord } from '../data/types';
import { track } from '../lib/analytics';
import { buildRunStops } from '../logic/routes';
import { getNextTripAction, validateTripEvent, type EventType, type TripLike, type TripType } from '../logic/tripProgression';

const LOCATION_PUSH_MS = 10_000;

// Button text for the next thing the driver does. Short, in the driver's words.
export function nextLabel(e: EventType): string {
  switch (e) {
    case 'DRIVER_AT_PICKUP':
      return 'Reached pickup';
    case 'CHILD_BOARDED':
      return 'Picked up';
    case 'DRIVER_AT_SCHOOL':
      return 'Reached school';
    case 'DRIVER_LEFT_SCHOOL':
      return 'Left school';
    case 'DRIVER_AT_DROP':
      return 'Reached drop';
    case 'CHILD_DROPPED':
      return 'Dropped';
    default:
      return e;
  }
}

export function RunPanel({ route, stops, children, driverId }: { route: RouteRecord; stops: RouteStop[]; children: ChildRecord[]; driverId: string }) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [gps, setGps] = useState(true);
  const lastPush = useRef(0);

  useEffect(() => {
    store.getActiveTrip(route.id).then(async (t) => {
      setTrip(t);
      setEvents(t ? await store.listEvents(t.id) : []);
    });
  }, [route.id]);

  // Keep the screen on during a run where supported.
  useEffect(() => {
    if (!trip) return;
    let lock: { release: () => Promise<void> } | null = null;
    navigator.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [trip]);

  // Publish the van's position every 10 seconds during a run.
  useEffect(() => {
    if (!trip || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGps(true);
        const now = Date.now();
        if (now - lastPush.current < LOCATION_PUSH_MS) return;
        lastPush.current = now;
        store.setVanLocation(trip.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setGps(false),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [trip]);

  async function start(tripType: TripType) {
    setMessage(null);
    try {
      const t = await store.startTrip(route.id, driverId, tripType, crypto.randomUUID());
      track('trip_started', { type: tripType, customers: children.length });
      setTrip(t);
      setEvents([]);
      lastPush.current = 0;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start');
    }
  }

  const tripType: TripType = trip?.tripType ?? 'MORNING';
  const run = trip ? buildRunStops(route, stops, children, tripType) : [];
  const logicTrip: TripLike = { tripType, stops: run, events: events.map((e) => ({ childId: e.childId, eventType: e.eventType })) };
  const next = trip ? getNextTripAction(logicTrip) : null;
  const nextEvent: EventType | null = next?.allowedEvents[0] ?? null;
  const nextChild = next?.childId ? children.find((c) => c.id === next.childId) : null;
  const done = run.filter((r) => next?.nextStop && r.sequenceIndex < next.nextStop.sequenceIndex).length;

  async function tap() {
    if (!trip || !next || !nextEvent || !next.childId) return;
    const check = validateTripEvent(logicTrip, next.childId, nextEvent);
    if (!check.ok) return setMessage(check.reason);
    try {
      await store.addEvent({ id: crypto.randomUUID(), tripId: trip.id, childId: next.childId, eventType: nextEvent });
      track('stop_tapped', { event: nextEvent });
      setEvents(await store.listEvents(trip.id));
      setMessage(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Try again');
    }
  }

  if (!trip) {
    return (
      <div className="stack">
        <button type="button" className="btn primary big full" onClick={() => start('MORNING')} disabled={children.length === 0}>
          Morning run
        </button>
        <button type="button" className="btn ghost big full" onClick={() => start('AFTERNOON')} disabled={children.length === 0}>
          Afternoon run
        </button>
        {children.length === 0 && <p className="muted">Add customers first.</p>}
        {message && <p className="error">{message}</p>}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row between">
        <span className="chip brand">{tripType === 'MORNING' ? 'Morning' : 'Afternoon'} run</span>
        <span className="muted">
          {done}/{run.length}
        </span>
      </div>
      <div className="progress">
        <span style={{ width: `${run.length ? (done / run.length) * 100 : 0}%` }} />
      </div>

      {next?.nextStop && nextEvent ? (
        <>
          <p className="run-next">
            {nextChild ? nextChild.firstName : next.nextStop.stopType === 'SCHOOL' ? 'School' : 'Next'} · {next.nextStop.address}
          </p>
          <button type="button" className="btn primary big full" onClick={tap}>
            {nextLabel(nextEvent)}
          </button>
        </>
      ) : (
        <p className="run-next">Run complete</p>
      )}

      {!gps && <p className="notice">Location is off. Allow it and keep this screen on.</p>}
      {message && <p className="error">{message}</p>}
      <button type="button" className="btn ghost full" onClick={async () => {
        await store.endTrip(trip.id);
        setTrip(null);
        setEvents([]);
      }}>
        End run
      </button>
    </div>
  );
}

