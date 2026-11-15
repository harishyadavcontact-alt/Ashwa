import { useCallback, useEffect, useRef, useState } from 'react';
import Login from '../components/Login';
import { store } from '../data';
import type { ChildRecord, DriverProfile, EventRecord, ParentProfile, Point, TripRecord, VanLocation } from '../data/types';
import { haversineMeters, isApproaching, etaMinutes } from '../logic/eta';

const POLL_MS = 10_000;

interface ChildStatus {
  child: ChildRecord;
  driverName: string;
  trip: TripRecord | null;
  events: EventRecord[];
  van: VanLocation | null;
}

export default function ParentHome() {
  // A driver invite link looks like /parent?driver=<id>. Children are linked to that driver.
  const inviteDriverId = new URLSearchParams(window.location.search).get('driver');

  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [statuses, setStatuses] = useState<ChildStatus[]>([]);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  const load = useCallback(async (id: string) => {
    setParent(await store.getParent(id));
    const kids = await store.listChildrenForParent(id);
    const items: ChildStatus[] = [];
    for (const child of kids) {
      const [driver, trip] = await Promise.all([store.getDriver(child.driverId), store.getActiveTrip(child.driverId)]);
      const [events, van] = trip
        ? await Promise.all([store.listEvents(trip.id), store.getVanLocation(trip.id)])
        : [[], null];
      items.push({
        child,
        driverName: (driver as DriverProfile | null)?.name ?? 'Your driver',
        trip,
        events,
        van,
      });
    }
    setStatuses(items);
  }, []);

  useEffect(() => {
    if (!userId || !parent) return;
    load(userId).catch((e: unknown) => setMessage(String(e)));
    const t = setInterval(() => load(userId).catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [userId, parent, load]);

  // Create the parent profile on first visit.
  useEffect(() => {
    if (userId && parent === null) {
      store.getParent(userId).then((p) => {
        if (p) setParent(p);
      });
    }
  }, [userId, parent]);

  if (userId === undefined) return <main className="shell">Loading…</main>;

  if (userId === null) {
    return (
      <main className="shell">
        <h1>Track your child's van</h1>
        <Login onSignedIn={setUserId} />
      </main>
    );
  }

  if (!parent) {
    return <ParentSetup userId={userId} onSaved={(p) => setParent(p)} />;
  }

  const existingDriverId = statuses[0]?.child.driverId ?? null;
  const driverId = inviteDriverId ?? existingDriverId;

  return (
    <main className="shell">
      <h1>Hi {parent.name || 'there'}</h1>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}

      {statuses.length === 0 && !adding && (
        <p>
          {driverId
            ? 'Add your child to start tracking their van.'
            : 'Ask your van driver for their invite link, then open it here.'}
        </p>
      )}

      {statuses.map((s) => (
        <ChildCard key={s.child.id} status={s} />
      ))}

      {!adding && driverId && (
        <button type="button" onClick={() => setAdding(true)}>
          Add a child
        </button>
      )}

      {adding && driverId && (
        <AddChild
          parentId={userId}
          driverId={driverId}
          onDone={async () => {
            setAdding(false);
            await load(userId);
          }}
        />
      )}
    </main>
  );
}

function ChildCard({ status }: { status: ChildStatus }) {
  const { child, driverName, trip, events, van } = status;
  const mine = events.filter((e) => e.childId === child.id).map((e) => e.eventType);
  const schoolReached = events.some((e) => e.eventType === 'DRIVER_AT_SCHOOL');
  const leftSchool = events.some((e) => e.eventType === 'DRIVER_LEFT_SCHOOL');

  let headline = 'Van is not on a trip right now.';
  let target: Point | null = null;

  if (trip?.tripType === 'MORNING') {
    if (mine.includes('CHILD_BOARDED')) {
      headline = schoolReached ? `${child.firstName} reached ${child.schoolName}.` : `${child.firstName} is on the van to school.`;
    } else {
      headline = `Waiting for the van at ${child.pickup.label || 'pickup point'}.`;
      target = child.pickup;
    }
  } else if (trip?.tripType === 'AFTERNOON') {
    if (mine.includes('CHILD_DROPPED')) {
      headline = `${child.firstName} is home.`;
    } else if (leftSchool) {
      headline = `${child.firstName} is on the van home.`;
      target = child.drop;
    } else {
      headline = `Waiting at ${child.schoolName}.`;
    }
  }

  const distance = van && target ? haversineMeters({ lat: van.lat, lng: van.lng }, target) : null;
  const approaching = distance !== null && isApproaching(distance);
  const minutes = distance !== null ? Math.max(1, Math.round(etaMinutes(distance))) : null;

  // One browser alert per child per approach, if the parent allowed notifications.
  const alertedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!approaching || !trip || !target) return;
    const key = `${trip.id}-${child.id}-${trip.tripType}`;
    if (alertedFor.current === key) return;
    alertedFor.current = key;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${child.firstName}'s van is about 5 minutes away`);
    }
  }, [approaching, trip, target, child.id, child.firstName]);

  return (
    <section className="card">
      <h2>{child.firstName}</h2>
      <p className="muted">
        {child.schoolName} · {driverName}
      </p>
      <p className="next">{headline}</p>
      {approaching && minutes !== null && (
        <p role="status" className="alert">
          Van is about {minutes} min away.
        </p>
      )}
      {trip && van && <p className="muted">Van location updated {new Date(van.updatedAt).toLocaleTimeString()}</p>}
      {trip && !van && <p className="muted">Waiting for the van's location…</p>}
      {'Notification' in window && Notification.permission === 'default' && (
        <button type="button" onClick={() => Notification.requestPermission()}>
          Turn on alerts
        </button>
      )}
    </section>
  );
}

function ParentSetup({ userId, onSaved }: { userId: string; onSaved: (p: ParentProfile) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Enter your name');
    const p = { id: userId, name: name.trim(), phone: phone.replace(/\s/g, '') };
    try {
      await store.saveParent(p);
      onSaved(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <main className="shell">
      <h1>Your details</h1>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label>
        Mobile number (for your driver to call)
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button type="button" onClick={save}>
        Continue
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </main>
  );
}

function useGeo() {
  const [error, setError] = useState<string | null>(null);
  function get(set: (lat: number, lng: number) => void) {
    setError(null);
    navigator.geolocation?.getCurrentPosition(
      (p) => set(p.coords.latitude, p.coords.longitude),
      () => setError('Location blocked. Type the coordinates instead.'),
    );
  }
  return { get, error };
}

function AddChild({ parentId, driverId, onDone }: { parentId: string; driverId: string; onDone: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLat, setSchoolLat] = useState('');
  const [schoolLng, setSchoolLng] = useState('');
  const [pickupLabel, setPickupLabel] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [sameDrop, setSameDrop] = useState(true);
  const [dropLabel, setDropLabel] = useState('');
  const [dropLat, setDropLat] = useState('');
  const [dropLng, setDropLng] = useState('');
  const [error, setError] = useState<string | null>(null);
  const geo = useGeo();

  async function save() {
    setError(null);
    const pLat = Number(pickupLat);
    const pLng = Number(pickupLng);
    const dLat = sameDrop ? pLat : Number(dropLat);
    const dLng = sameDrop ? pLng : Number(dropLng);
    if (!firstName.trim() || !schoolName.trim()) return setError('Enter the child’s first name and school');
    if (!pickupLat || !pickupLng || Number.isNaN(pLat) || Number.isNaN(pLng)) return setError('Set the pickup point');
    if (!sameDrop && (!dropLat || !dropLng || Number.isNaN(dLat) || Number.isNaN(dLng)))
      return setError('Set the drop point');
    try {
      await store.addChild({
        id: crypto.randomUUID(),
        parentId,
        driverId,
        firstName: firstName.trim(),
        schoolName: schoolName.trim(),
        schoolLat: schoolLat ? Number(schoolLat) : null,
        schoolLng: schoolLng ? Number(schoolLng) : null,
        pickup: { lat: pLat, lng: pLng, label: pickupLabel.trim() || 'Pickup' },
        drop: { lat: dLat, lng: dLng, label: sameDrop ? pickupLabel.trim() || 'Drop' : dropLabel.trim() || 'Drop' },
        createdAt: new Date().toISOString(),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <section className="card">
      <h2>Add a child</h2>
      <label>
        Child’s first name
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <label>
        School
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
      </label>
      <div className="row">
        <input aria-label="School latitude" placeholder="School lat" value={schoolLat} onChange={(e) => setSchoolLat(e.target.value)} />
        <input aria-label="School longitude" placeholder="School lng" value={schoolLng} onChange={(e) => setSchoolLng(e.target.value)} />
      </div>

      <h3>Pickup point</h3>
      <label>
        Name it (e.g. Gate 2, outside our flats)
        <input value={pickupLabel} onChange={(e) => setPickupLabel(e.target.value)} />
      </label>
      <div className="row">
        <input aria-label="Pickup latitude" placeholder="Lat" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} />
        <input aria-label="Pickup longitude" placeholder="Lng" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} />
      </div>
      <button type="button" onClick={() => geo.get((lat, lng) => { setPickupLat(lat.toFixed(6)); setPickupLng(lng.toFixed(6)); })}>
        Use my location
      </button>

      <label className="check">
        <input type="checkbox" checked={sameDrop} onChange={(e) => setSameDrop(e.target.checked)} />
        Drop-off is the same as pickup
      </label>
      {!sameDrop && (
        <>
          <h3>Drop point</h3>
          <label>
            Name it
            <input value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} />
          </label>
          <div className="row">
            <input aria-label="Drop latitude" placeholder="Lat" value={dropLat} onChange={(e) => setDropLat(e.target.value)} />
            <input aria-label="Drop longitude" placeholder="Lng" value={dropLng} onChange={(e) => setDropLng(e.target.value)} />
          </div>
          <button type="button" onClick={() => geo.get((lat, lng) => { setDropLat(lat.toFixed(6)); setDropLng(lng.toFixed(6)); })}>
            Use my location
          </button>
        </>
      )}

      <div className="row">
        <button type="button" onClick={save}>
          Save child
        </button>
      </div>
      {(error || geo.error) && (
        <p role="alert" className="error">
          {error ?? geo.error}
        </p>
      )}
    </section>
  );
}
