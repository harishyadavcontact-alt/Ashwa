import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Login from '../components/Login';
import { PointInput } from '../components/PointInput';
import { RouteView } from '../components/RouteView';
import { store } from '../data';
import type { DriverProfile, Point, RouteRecord, VerificationStatus } from '../data/types';
import { track } from '../lib/analytics';

export default function DriverHome() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [driver, setDriver] = useState<DriverProfile | null | undefined>(undefined);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [open, setOpen] = useState<RouteRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  const load = useCallback(async (id: string) => {
    const [d, rs] = await Promise.all([store.getDriver(id), store.listRoutesForDriver(id)]);
    setDriver(d);
    setRoutes(rs);
  }, []);

  useEffect(() => {
    if (userId) load(userId).catch((e: unknown) => setMessage(String(e)));
  }, [userId, load]);

  if (userId === undefined || (userId && driver === undefined)) return <main className="shell">Loading…</main>;

  if (userId === null) {
    return (
      <main className="shell">
        <h1>Driver sign-in</h1>
        <Login onSignedIn={setUserId} />
      </main>
    );
  }

  if (driver === null) {
    return <DriverSetup userId={userId} onSaved={() => load(userId)} />;
  }

  if (open && driver) {
    return <RouteView route={open} driverId={userId!} driverName={driver!.name} onBack={() => { setOpen(null); load(userId!); }} />;
  }

  return (
    <main className="shell">
      <h1>Hi {driver?.name}</h1>
      {driver && driver.verificationStatus !== 'VERIFIED' && <VerificationBanner status={driver.verificationStatus} />}
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}

      <section className="card">
        <h2>Your routes</h2>
        {routes.length === 0 && <p>No routes yet. Create one for your van, or join a route with a code.</p>}
        <ul className="routes">
          {routes.map((r) => (
            <li key={r.id}>
              <button type="button" className="route-link" onClick={() => setOpen(r)}>
                <strong>{r.name}</strong>
                <span className="muted"> · {r.schoolName}{r.ownerId === userId ? '' : ' · joined'}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <CreateRoute ownerId={userId!} seats={driver?.vanSeats ?? 8} onCreated={(r) => { setOpen(r); load(userId!); }} onError={setMessage} />
      <JoinRoute onJoined={(r) => { setOpen(r); load(userId!); }} onError={setMessage} />
    </main>
  );
}

function CreateRoute({ ownerId, seats, onCreated, onError }: { ownerId: string; seats: number; onCreated: (r: RouteRecord) => void; onError: (m: string) => void }) {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [schoolPoint, setSchoolPoint] = useState<Point | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !school.trim() || !schoolPoint || !start) {
      onError('Give the route a name, the school name, the school location and where the van starts.');
      return;
    }
    setSaving(true);
    try {
      const route = await store.createRoute({
        ownerId,
        name: name.trim(),
        schoolName: school.trim(),
        school: { ...schoolPoint, label: school.trim() },
        start: { ...start, label: start.label || 'Van base' },
        vanSeats: seats,
      });
      track('route_created', { seats: seats });
      onCreated(route);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create the route');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2>Create a route</h2>
      <p className="muted">One route is one van going to one school. Add a second route if you run a second school.</p>
      <label>
        Route name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise morning" />
      </label>
      <label>
        School name
        <input value={school} onChange={(e) => setSchool(e.target.value)} />
      </label>
      <PointInput label="School location (stand at the gate)" value={schoolPoint} onChange={setSchoolPoint} namePlaceholder="School gate" defaultName="School" />
      <PointInput label="Where the van starts (where you park)" value={start} onChange={setStart} namePlaceholder="Parking spot" defaultName="Van base" />
      <button type="button" onClick={save} disabled={saving}>
        Create route
      </button>
    </section>
  );
}

function JoinRoute({ onJoined, onError }: { onJoined: (r: RouteRecord) => void; onError: (m: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <section className="card">
      <h2>Join a route</h2>
      <p className="muted">Replacement driver? Ask the van owner for the route code.</p>
      <label>
        Route code
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" />
      </label>
      <button
        type="button"
        disabled={code.trim().length < 6}
        onClick={async () => {
          try {
            const joined = await store.joinRouteByCode(code.trim());
            track('route_joined');
            onJoined(joined);
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Could not join');
          }
        }}
      >
        Join
      </button>
    </section>
  );
}

function DriverSetup({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(8);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Enter your name');
    if (!consent) return setError('Please tick the consent box to continue.');
    try {
      await store.saveDriver({ id: userId, name: name.trim(), vanSeats: seats });
      track('driver_profile_created');
      track('consent_given', { role: 'driver' });
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
      <label className="check consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I will only use Ashwa to run my van for the families who choose me. I will keep their children’s details private and I
          will not share them. <Link to="/privacy">Read the privacy notice</Link>.
        </span>
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

function VerificationBanner({ status }: { status: VerificationStatus }) {
  const text =
    status === 'PENDING'
      ? 'Waiting for Ashwa verification. You can set up your route and invite your own families now. Parents who search for a van will see you once you are verified.'
      : status === 'REJECTED'
        ? 'Verification was not approved. Please contact the Ashwa team.'
        : 'Your listing is paused. Please contact the Ashwa team.';
  return (
    <p role="status" className="status">
      {text}
    </p>
  );
}
