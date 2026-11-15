import { useCallback, useEffect, useState } from 'react';
import { Consent } from '../components/Consent';
import { SharedIcon } from '../components/Icons';
import Login from '../components/Login';
import { MapView } from '../components/MapView';
import { RouteView } from '../components/RouteView';
import { store } from '../data';
import type { DriverProfile, Point, RouteRecord, VerificationStatus } from '../data/types';
import { track } from '../lib/analytics';

export default function DriverHome() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [driver, setDriver] = useState<DriverProfile | null | undefined>(undefined);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [open, setOpen] = useState<RouteRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
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

  if (userId === undefined || (userId && driver === undefined)) return <div className="auth">Loading…</div>;
  if (userId === null) return <Login title="Driver sign-in" onSignedIn={setUserId} />;
  if (driver === null) return <DriverSetup userId={userId} onSaved={() => load(userId)} />;
  if (!driver) return null;

  if (open) {
    return (
      <RouteView
        route={open}
        driverId={userId!}
        driverName={driver.name}
        onBack={() => {
          setOpen(null);
          load(userId!);
        }}
      />
    );
  }

  if (creating) {
    return (
      <CreateRoute
        ownerId={userId!}
        seats={driver.vanSeats}
        onCancel={() => setCreating(false)}
        onCreated={(r) => {
          setCreating(false);
          setOpen(r);
          load(userId!);
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="title">Hi {driver.name}</span>
        {driver.verificationStatus !== 'VERIFIED' && <span className={`chip ${driver.verificationStatus === 'PENDING' ? 'warn' : 'bad'}`}>{statusText(driver.verificationStatus)}</span>}
      </header>

      <main className="screen stack">
        {message && <p className="error">{message}</p>}

        {routes.map((r) => (
          <button key={r.id} type="button" className="card route-card" onClick={() => setOpen(r)}>
            <div className="row between">
              <strong>{r.name}</strong>
              {r.ownerId !== userId && <span className="chip">Joined</span>}
            </div>
            <div className="muted">{r.schoolName} · {r.vanSeats} seats</div>
          </button>
        ))}

        {routes.length === 0 && <p className="muted">No routes yet.</p>}

        <button type="button" className="btn primary full" onClick={() => setCreating(true)}>
          <SharedIcon name="plus" /> New route
        </button>

        {!joining ? (
          <button type="button" className="btn ghost full" onClick={() => setJoining(true)}>
            Join with code
          </button>
        ) : (
          <JoinRoute
            onJoined={(r) => {
              setJoining(false);
              setOpen(r);
              load(userId!);
            }}
            onError={setMessage}
          />
        )}
      </main>

      <nav className="tabbar" aria-label="Main">
        <button type="button" aria-current="page">
          <SharedIcon name="route" />
          Routes
        </button>
      </nav>
    </div>
  );
}

function statusText(s: VerificationStatus): string {
  return s === 'PENDING' ? 'Verification pending' : s === 'REJECTED' ? 'Not approved' : 'Paused';
}

// Pin the school and the van's start on the map, then name the route.
function CreateRoute({ ownerId, seats, onCreated, onCancel }: { ownerId: string; seats: number; onCreated: (r: RouteRecord) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [target, setTarget] = useState<'school' | 'start'>('school');
  const [school, setSchool] = useState<Point | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim() && schoolName.trim() && school && start;

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="btn small ghost" onClick={onCancel} aria-label="Back">
          <SharedIcon name="back" />
        </button>
        <span className="title">New route</span>
      </header>
      <div className="stage">
        <MapView
          stops={[]}
          pick={target === 'school' ? school : start}
          pickMode
          onPick={(p) => (target === 'school' ? setSchool({ ...p, label: schoolName || 'School' }) : setStart({ ...p, label: 'Van base' }))}
        />
        <section className="sheet stack">
          <div className="seg">
            <button type="button" aria-pressed={target === 'school'} onClick={() => setTarget('school')}>
              {school ? 'School ✓' : 'Tap school'}
            </button>
            <button type="button" aria-pressed={target === 'start'} onClick={() => setTarget('start')}>
              {start ? 'Van start ✓' : 'Tap van start'}
            </button>
          </div>
          <input placeholder="School name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          <input placeholder="Route name, e.g. Morning run" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button
            type="button"
            className="btn primary full"
            disabled={!ready || busy}
            onClick={async () => {
              if (!school || !start) return;
              setBusy(true);
              try {
                const route = await store.createRoute({
                  ownerId,
                  name: name.trim(),
                  schoolName: schoolName.trim(),
                  school: { ...school, label: schoolName.trim() },
                  start,
                  vanSeats: seats,
                });
                track('route_created', { seats });
                onCreated(route);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not create route');
              } finally {
                setBusy(false);
              }
            }}
          >
            Create route
          </button>
        </section>
      </div>
    </div>
  );
}

function JoinRoute({ onJoined, onError }: { onJoined: (r: RouteRecord) => void; onError: (m: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <div className="card stack">
      <input placeholder="Route code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" />
      <button
        type="button"
        className="btn primary full"
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
    </div>
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
    if (!consent) return setError('Tick the box to continue');
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
    <div className="auth">
      <div className="brand-mark">ASHWA</div>
      <div className="card stack">
        <h2>Your van</h2>
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <label className="field" style={{ margin: 0 }}>
          <span>Seats</span>
          <input type="number" min={1} max={15} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
        </label>
        <Consent checked={consent} onChange={setConsent} role="driver" />
        <button type="button" className="btn primary full" onClick={save}>
          Continue
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
