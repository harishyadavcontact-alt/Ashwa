import { useCallback, useEffect, useRef, useState } from 'react';
import Login from '../components/Login';
import { store } from '../data';
import type { ChildRecord, DriverProfile, EventRecord, TripRecord } from '../data/types';
import { buildTripStops } from '../logic/stops';
import {
  getNextTripAction,
  validateTripEvent,
  type EventType,
  type TripLike,
  type TripType,
} from '../logic/tripProgression';

const LOCATION_PUSH_MS = 10_000;

export default function DriverHome() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('Location off');

  // Restore the session on load.
  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  const loadAll = useCallback(async (id: string) => {
    const [d, kids, active] = await Promise.all([
      store.getDriver(id),
      store.listChildrenForDriver(id),
      store.getActiveTrip(id),
    ]);
    setDriver(d);
    setChildren(kids);
    setTrip(active);
    setEvents(active ? await store.listEvents(active.id) : []);
  }, []);

  useEffect(() => {
    if (userId) loadAll(userId).catch((e: unknown) => setMessage(String(e)));
  }, [userId, loadAll]);

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

  // Publish the van's position every 10 seconds while a trip is active.
  const lastPush = useRef(0);
  useEffect(() => {
    if (!trip || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('Location on');
        const now = Date.now();
        if (now - lastPush.current < LOCATION_PUSH_MS) return;
        lastPush.current = now;
        store.setVanLocation(trip.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setGpsStatus('Location blocked. Allow it, and keep this screen on.'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [trip]);

  if (userId === undefined) return <main className="shell">Loading…</main>;

  if (userId === null) {
    return (
      <main className="shell">
        <h1>Driver sign-in</h1>
        <Login onSignedIn={setUserId} />
      </main>
    );
  }

  if (driver === null) {
    return <DriverSetup userId={userId} onSaved={() => loadAll(userId)} />;
  }

  const inviteLink = `${window.location.origin}/parent?driver=${driver.id}`;
  const shareText = encodeURIComponent(
    `Hi, I'm ${driver.name}, your school van driver. Tap to see your child's van live and get alerts. Free: ${inviteLink}`,
  );

  async function startTrip(tripType: TripType) {
    if (!userId || !driver) return;
    setMessage(null);
    try {
      const t = await store.startTrip(userId, tripType, crypto.randomUUID());
      setTrip(t);
      setEvents([]);
      lastPush.current = 0;
      setMessage(`${tripType === 'MORNING' ? 'Morning' : 'Afternoon'} trip started with ${children.length} children.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start trip');
    }
  }

  // Rebuild the stop order from the same inputs every time, so it matches what was tapped earlier.
  const tripType: TripType = trip?.tripType ?? 'MORNING';
  const stops = trip
    ? buildTripStops(children, tripType, {
        lat: driver.baseLat ?? children[0]?.schoolLat ?? 0,
        lng: driver.baseLng ?? children[0]?.schoolLng ?? 0,
        label: 'Van base',
      })
    : [];
  const logicTrip: TripLike = {
    tripType,
    stops,
    events: events.map((e) => ({ childId: e.childId, eventType: e.eventType })),
  };
  const next = trip ? getNextTripAction(logicTrip) : null;
  const nextChild = next?.childId ? children.find((c) => c.id === next.childId) : null;
  const nextEvent: EventType | null = next?.allowedEvents[0] ?? null;

  async function tap() {
    if (!trip || !next || !nextEvent || !next.childId) return;
    const check = validateTripEvent(logicTrip, next.childId, nextEvent);
    if (!check.ok) {
      setMessage(check.reason);
      return;
    }
    try {
      await store.addEvent({ id: crypto.randomUUID(), tripId: trip.id, childId: next.childId, eventType: nextEvent });
      await loadAll(userId!);
      setMessage(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save that tap. Try again.');
    }
  }

  async function endTrip() {
    if (!trip) return;
    await store.endTrip(trip.id);
    setTrip(null);
    setEvents([]);
    setMessage('Trip ended.');
  }

  return (
    <main className="shell">
      <h1>{driver.name}</h1>
      {message && <p role="status" className="status">{message}</p>}

      <section>
        <h2>Invite parents</h2>
        <p>Send this to your parent group. They tap it, sign in and add their child.</p>
        <p>
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
        </p>
        <p className="muted">{inviteLink}</p>
      </section>

      <section>
        <h2>Children ({children.length})</h2>
        {children.length === 0 && <p>No children yet. They appear here when parents join with your link.</p>}
        <ul>
          {children.map((c) => (
            <li key={c.id}>
              {c.firstName} · {c.schoolName}
            </li>
          ))}
        </ul>
      </section>

      {!trip && (
        <section>
          <h2>Start a trip</h2>
          <div className="row">
            <button type="button" onClick={() => startTrip('MORNING')} disabled={children.length === 0}>
              Morning trip
            </button>
            <button type="button" onClick={() => startTrip('AFTERNOON')} disabled={children.length === 0}>
              Afternoon trip
            </button>
          </div>
        </section>
      )}

      {trip && (
        <section>
          <h2>{trip.tripType === 'MORNING' ? 'Morning' : 'Afternoon'} trip</h2>
          <p className="muted">GPS: {gpsStatus}</p>
          {next?.nextStop ? (
            <>
              <p className="next">{next.label}</p>
              {nextEvent && (
                <button type="button" className="big" onClick={tap}>
                  {labelFor(nextEvent)}
                  {nextChild ? ` · ${nextChild.firstName}` : ''}
                </button>
              )}
            </>
          ) : (
            <p className="next">Trip complete.</p>
          )}
          <ol className="timeline">
            {stops.map((s) => {
              const done = next?.nextStop ? s.sequenceIndex < next.nextStop.sequenceIndex : true;
              return (
                <li key={s.id} className={done ? 'done' : ''}>
                  {s.stopType === 'SCHOOL' ? `School: ${s.address}` : `${s.stopType === 'PICKUP' ? 'Pick up' : 'Drop'} ${s.childName}`}
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={endTrip}>
            End trip
          </button>
        </section>
      )}
    </main>
  );
}

function labelFor(e: EventType): string {
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

// First-time setup: name, seats and van base. Saved once, reused for every trip.
function DriverSetup({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(8);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState<string | null>(null);

  function useLocation() {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(6));
        setLng(p.coords.longitude.toFixed(6));
      },
      () => setError('Location blocked. Type the van base coordinates, or allow location.'),
    );
  }

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Enter your name');
    try {
      await store.saveDriver({
        id: userId,
        name: name.trim(),
        vanSeats: seats,
        baseLat: lat ? Number(lat) : null,
        baseLng: lng ? Number(lng) : null,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <main className="shell">
      <h1>Set up your van</h1>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label>
        Seats in the van
        <input type="number" min={1} max={15} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
      </label>
      <p className="muted">Van base: where the van starts in the morning (home or garage).</p>
      <div className="row">
        <input aria-label="Base latitude" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
        <input aria-label="Base longitude" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
      </div>
      <button type="button" onClick={useLocation}>
        Use my location
      </button>
      <button type="button" onClick={save}>
        Save
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </main>
  );
}
