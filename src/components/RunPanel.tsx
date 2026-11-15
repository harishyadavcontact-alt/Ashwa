import { useEffect, useRef, useState } from 'react';
import { store } from '../data';
import { track } from '../lib/analytics';
import type { ChildRecord, EventRecord, RouteRecord, RouteStop, TripRecord } from '../data/types';
import { buildRunStops } from '../logic/routes';
import { getNextTripAction, validateTripEvent, type EventType, type TripLike, type TripType } from '../logic/tripProgression';

const LOCATION_PUSH_MS = 10_000;

export function eventLabel(e: EventType): string {
  switch (e) {
    case 'DRIVER_AT_PICKUP':
      return 'I reached pickup';
    case 'CHILD_BOARDED':
      return 'Child boarded';
    case 'DRIVER_AT_SCHOOL':
      return 'Reached school';
    case 'DRIVER_LEFT_SCHOOL':
      return 'Left school';
    case 'DRIVER_AT_DROP':
      return 'I reached drop';
    case 'CHILD_DROPPED':
      return 'Child dropped';
    default:
      return e;
  }
}

// Runs one trip on a route: start, follow the stops in order, tap each event, publish location, end.
export function RunPanel({
  route,
  stops,
  children,
  driverId,
}: {
  route: RouteRecord;
  stops: RouteStop[];
  children: ChildRecord[];
  driverId: string;
}) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [gps, setGps] = useState('Location off');
  const lastPush = useRef(0);

  // Pick up an in-progress trip on this route (e.g. after a reload).
  useEffect(() => {
    store.getActiveTrip(route.id).then(async (t) => {
      setTrip(t);
      setEvents(t ? await store.listEvents(t.id) : []);
    });
  }, [route.id]);

  // Keep the screen on during a trip (where supported).
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

  // Publish the van's position every 10 seconds while a trip runs.
  useEffect(() => {
    if (!trip || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGps('Location on');
        const now = Date.now();
        if (now - lastPush.current < LOCATION_PUSH_MS) return;
        lastPush.current = now;
        store.setVanLocation(trip.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setGps('Location blocked. Allow it and keep this screen on.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [trip]);

  async function start(tripType: TripType) {
    setMessage(null);
    try {
      const t = await store.startTrip(route.id, driverId, tripType, crypto.randomUUID());
      setTrip(t);
      setEvents([]);
      lastPush.current = 0;
      track('trip_started', { type: tripType, customers: children.length });
      setMessage(`${tripType === 'MORNING' ? 'Morning' : 'Afternoon'} run started.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start the run');
    }
  }

  const tripType: TripType = trip?.tripType ?? 'MORNING';
  const run = trip ? buildRunStops(route, stops, children, tripType) : [];
  const logicTrip: TripLike = {
    tripType,
    stops: run,
    events: events.map((e) => ({ childId: e.childId, eventType: e.eventType })),
  };
  const next = trip ? getNextTripAction(logicTrip) : null;
  const nextEvent: EventType | null = next?.allowedEvents[0] ?? null;
  const nextChild = next?.childId ? children.find((c) => c.id === next.childId) : null;

  async function tap() {
    if (!trip || !next || !nextEvent || !next.childId) return;
    const check = validateTripEvent(logicTrip, next.childId, nextEvent);
    if (!check.ok) {
      setMessage(check.reason);
      return;
    }
    try {
      await store.addEvent({ id: crypto.randomUUID(), tripId: trip.id, childId: next.childId, eventType: nextEvent });
      track('stop_tapped', { event: nextEvent });
      setEvents(await store.listEvents(trip.id));
      setMessage(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save that tap. Try again.');
    }
  }

  async function end() {
    if (!trip) return;
    await store.endTrip(trip.id);
    setTrip(null);
    setEvents([]);
    setMessage('Run ended.');
  }

  if (!trip) {
    return (
      <section className="card">
        <h2>Start a run</h2>
        {children.length === 0 && <p>Add customers on the Customers tab first.</p>}
        <div className="row">
          <button type="button" onClick={() => start('MORNING')} disabled={children.length === 0}>
            Morning: to school
          </button>
          <button type="button" onClick={() => start('AFTERNOON')} disabled={children.length === 0}>
            Afternoon: to home
          </button>
        </div>
        {message && <p role="status" className="status">{message}</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{tripType === 'MORNING' ? 'Morning run' : 'Afternoon run'}</h2>
      <p className="muted">GPS: {gps}</p>
      {message && <p role="status" className="status">{message}</p>}
      {next?.nextStop ? (
        <>
          <p className="next">{next.label}</p>
          {nextEvent && (
            <button type="button" className="big" onClick={tap}>
              {eventLabel(nextEvent)}
              {nextChild ? ` · ${nextChild.firstName}` : ''}
            </button>
          )}
        </>
      ) : (
        <p className="next">Run complete.</p>
      )}
      <ol className="timeline">
        {run.map((s) => {
          const done = next?.nextStop ? s.sequenceIndex < next.nextStop.sequenceIndex : true;
          return (
            <li key={s.id} className={done ? 'done' : ''}>
              {s.stopType === 'SCHOOL'
                ? `School: ${s.address}`
                : `${s.stopType === 'PICKUP' ? 'Pick up' : 'Drop'} ${s.childName} at ${s.address}`}
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={end}>
        End run
      </button>
    </section>
  );
}
