import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Consent } from '../components/Consent';
import { SharedIcon } from '../components/Icons';
import Login from '../components/Login';
import { MapView } from '../components/MapView';
import { RouteView } from '../components/RouteView';
import { store } from '../data';
import type { DriverProfile, Point, RouteRecord, VerificationStatus } from '../data/types';
import { track } from '../lib/analytics';
import { extras, type BackupRecord } from '../data/extras';
import { applyPendingReferral } from '../lib/referral';

export default function DriverHome() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [driver, setDriver] = useState<DriverProfile | null | undefined>(undefined);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [open, setOpen] = useState<RouteRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasParent, setHasParent] = useState(false);
  const [week, setWeek] = useState<{ runs: number; families: number } | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [refStats, setRefStats] = useState<{ opens: number; joins: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  const load = useCallback(async (id: string) => {
    const [d, rs, p] = await Promise.all([store.getDriver(id), store.listRoutesForDriver(id), store.getParent(id)]);
    setDriver(d);
    setRoutes(rs);
    setHasParent(!!p);
    extras.myWeekStats().then(setWeek).catch(() => {});
    extras.openBackups().then(setBackups).catch(() => setBackups([]));
    extras.myReferralStats().then(setRefStats).catch(() => {});
    extras.syncMyPhone().catch(() => {});
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

        {week && (
          <section className="card">
            <div className="row between">
              <span>This week</span>
              <span className="big-num">{week.runs} runs</span>
            </div>
            <p className="muted">{week.families} families on your routes</p>
            {refStats && (
              <p className="muted">Drivers you invited: opened {refStats.opens} · joined {refStats.joins}</p>
            )}
          </section>
        )}

        {backups.length > 0 && (
          <section className="card stack">
            <strong>Backup needed nearby</strong>
            {backups.map((b) => (
              <div key={b.id} className="row between">
                <div className="grow">
                  <div>{b.schoolName || b.routeName}</div>
                  <div className="muted">{b.day} · {b.ownerName}</div>
                </div>
                <button
                  type="button"
                  className="btn small primary"
                  onClick={async () => {
                    try {
                      await extras.coverBackup(b.id);
                      setBackups((xs) => xs.filter((x) => x.id !== b.id));
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : 'Could not cover');
                    }
                  }}
                >
                  I can cover
                </button>
              </div>
            ))}
          </section>
        )}

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

        <button
          type="button"
          className="btn ghost full"
          onClick={async () => {
            await store.auth.signOut();
            setUserId(null);
          }}
        >
          Sign out
        </button>

        <button type="button" className="btn primary full" onClick={() => setCreating(true)}>
          <SharedIcon name="plus" /> New route
        </button>

        <a
          className="btn ghost full"
          href={`https://wa.me/?text=${encodeURIComponent(`Join me on Ashwa, the school van app. It takes one minute: ${window.location.origin}/driver?ref=${driver.referralCode}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Invite a driver
        </a>

        {hasParent && (
          <button type="button" className="btn ghost full" onClick={() => navigate('/parent')}>
            Switch to parent
          </button>
        )}

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

// One-tap location for the van start and the school gate. The map is the fallback.
function locate(): Promise<Point | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label: '' }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

function CreateRoute({ ownerId, seats, onCreated, onCancel }: { ownerId: string; seats: number; onCreated: (r: RouteRecord) => void; onCancel: () => void }) {
  const [schoolName, setSchoolName] = useState('');
  const [school, setSchool] = useState<Point | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [target, setTarget] = useState<'school' | 'start'>('start');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = schoolName.trim() && school && start;

  async function useHere(what: 'school' | 'start') {
    setError(null);
    const here = await locate();
    if (!here) return setError('Location is off. Tap the map instead.');
    if (what === 'school') setSchool({ ...here, label: schoolName.trim() || 'School' });
    else setStart({ ...here, label: 'Van base' });
  }

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
          onPick={(p) => (target === 'school' ? setSchool({ ...p, label: schoolName.trim() || 'School' }) : setStart({ ...p, label: 'Van base' }))}
        />
        <section className="sheet stack">
          <button type="button" className={`btn ${start ? 'ghost' : 'primary'} full`} onClick={() => useHere('start')}>
            {start ? 'Van start set ✓ · change' : 'Use my location: van start'}
          </button>
          <input placeholder="School name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          <button type="button" className={`btn ${school ? 'ghost' : 'primary'} full`} onClick={() => useHere('school')}>
            {school ? 'School gate set ✓ · change' : 'Use my location: school gate'}
          </button>
          <div className="seg">
            <button type="button" aria-pressed={target === 'start'} onClick={() => setTarget('start')}>
              Pin van start on map
            </button>
            <button type="button" aria-pressed={target === 'school'} onClick={() => setTarget('school')}>
              Pin school on map
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="button"
            className="btn primary full"
            disabled={!ready || busy}
            onClick={async () => {
              if (!school || !start) return;
              setBusy(true);
              try {
                const name = `${schoolName.trim()} run`;
                const route = await store.createRoute({
                  ownerId,
                  name,
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

// Name and consent. Seats default to 8 and can be changed later. Invited drivers keep their referrer.
function DriverSetup({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const referredBy = new URLSearchParams(window.location.search).get('ref');

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Enter your name');
    if (!consent) return setError('Tick the box to continue');
    try {
      await store.saveDriver({ id: userId, name: name.trim(), vanSeats: 8, referredBy: referredBy || null });
      await applyPendingReferral();
      track('driver_profile_created', { via: referredBy ? 'referral' : 'direct' });
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
        <h2>Your name</h2>
        <input placeholder="e.g. Ramesh" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
        <Consent checked={consent} onChange={setConsent} role="driver" />
        <button type="button" className="btn primary full" onClick={save}>
          Start
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
