import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Consent } from '../components/Consent';
import { SharedIcon } from '../components/Icons';
import { MapView } from '../components/MapView';
import Login from '../components/Login';
import { store } from '../data';
import type { ChildRecord, EventRecord, MapStop, ParentProfile, PaymentRecord, Point, RouteSearchResult, TripRecord, VanLocation } from '../data/types';
import { track } from '../lib/analytics';
import { applyPendingReferral } from '../lib/referral';
import { extras, todayKey } from '../data/extras';
import { notifyNewUpdates } from '../lib/updates';
import { parentMessage, timelineFor } from '../logic/alerts';
import { etaMinutes, haversineMeters, isApproaching } from '../logic/eta';
import { currentMonth, feeState } from '../logic/routes';

const POLL_MS = 10_000;

interface ChildView {
  child: ChildRecord;
  driverName: string;
  trip: TripRecord | null;
  events: EventRecord[];
  van: VanLocation | null;
  pickup: Point | null;
  drop: Point | null;
  payment: PaymentRecord | null;
  absentToday: boolean;
  driverPhone: string | null;
}

type Tab = 'map' | 'account' | 'add';

export default function ParentHome() {
  const params = new URLSearchParams(window.location.search);
  const inviteRouteId = params.get('route');
  const referralCode = params.get('ref');

  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentProfile | null | undefined>(undefined);
  const [views, setViews] = useState<ChildView[]>([]);
  const [focusRouteId, setFocusRouteId] = useState<string | null>(null);
  const [stops, setStops] = useState<MapStop[]>([]);
  const [tab, setTab] = useState<Tab>('map');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    store.auth.currentPhone().then(setPhone);
    store.getParent(userId).then(setParent);
  }, [userId]);

  const load = useCallback(async (id: string) => {
    const kids = await store.listChildrenForParent(id);
    const payments = await store.listPayments(
      kids.map((c) => c.id),
      currentMonth(),
    );
    const absentIds = await extras.absentChildIds(kids.map((c) => c.id), todayKey()).catch(() => [] as string[]);
    const phones = await Promise.all(kids.map((c) => extras.driverPhoneForRoute(c.routeId).catch(() => null)));
    const next: ChildView[] = [];
    for (const child of kids) {
      const [driverName, trip, mapStops] = await Promise.all([
        store.routeDriverName(child.routeId),
        store.getActiveTrip(child.routeId),
        store.routeMap(child.routeId).catch(() => [] as MapStop[]),
      ]);
      const [events, van] = trip ? await Promise.all([store.listEvents(trip.id), store.getVanLocation(trip.id)]) : [[], null];
      const pickup = mapStops.find((s) => s.kind === 'STOP' && s.direction === 'TO_SCHOOL' && s.names.includes(child.firstName));
      const drop = mapStops.find((s) => s.kind === 'STOP' && s.direction === 'TO_HOME' && s.names.includes(child.firstName));
      next.push({
        child,
        driverName,
        trip,
        events,
        van,
        pickup: pickup?.point ?? null,
        drop: drop?.point ?? null,
        payment: payments.find((p) => p.childId === child.id) ?? null,
        absentToday: absentIds.includes(child.id),
        driverPhone: phones[kids.indexOf(child)] ?? null,
      });
    }
    setViews(next);
    setFocusRouteId((cur) => cur ?? next[0]?.child.routeId ?? null);
  }, []);

  useEffect(() => {
    if (!userId || !parent) return;
    load(userId).catch((e: unknown) => setMessage(String(e)));
    const t = setInterval(() => load(userId).catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [userId, parent, load]);

  // Link children a driver added under this phone number.
  useEffect(() => {
    if (!userId || !parent || !phone) return;
    store
      .claimChildrenForPhone(userId, phone)
      .then(() => load(userId))
      .catch(() => {});
    // runs once the parent profile is known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, parent?.id, phone]);

  // Map for the focused route. The server returns only this parent's own names.
  useEffect(() => {
    if (!focusRouteId || !parent) return;
    store.routeMap(focusRouteId).then(setStops).catch(() => setStops([]));
  }, [focusRouteId, parent, views]);

  // Browser alerts for new trip updates, per child.
  useEffect(() => {
    for (const v of views) {
      notifyNewUpdates(v.child.id, v.events, {
        firstName: v.child.firstName,
        schoolName: v.child.schoolName,
        pickupLabel: v.pickup?.label || 'pickup point',
        dropLabel: v.drop?.label || 'drop point',
      });
    }
  }, [views]);

  if (userId === undefined || (userId && parent === undefined)) return <div className="auth">Loading…</div>;
  if (userId === null) return <Login title="Track your child’s van" onSignedIn={setUserId} />;
  if (parent === null) return <ParentSetup userId={userId} phone={phone} referredBy={referralCode} onSaved={setParent} />;
  if (!parent) return null;

  const focusView = views.find((v) => v.child.routeId === focusRouteId) ?? views[0] ?? null;
  const presetRouteId = inviteRouteId && !views.some((v) => v.child.routeId === inviteRouteId) ? inviteRouteId : null;

  if (tab === 'add') {
    return (
      <AddChild
        parentId={userId!}
        phone={phone ?? ''}
        presetRouteId={presetRouteId}
        onDone={async () => {
          setTab('map');
          await load(userId!);
        }}
        onCancel={() => setTab('map')}
      />
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="title">{focusView ? focusView.child.schoolName : 'Ashwa'}</span>
        {focusView && <span className="chip">{focusView.driverName}</span>}
      </header>

      {tab === 'map' && (
        <div className="stage">
          <MapView stops={stops} van={focusView?.van ? { lat: focusView.van.lat, lng: focusView.van.lng, label: '' } : null} />
          <section className="sheet" aria-label="Your children">
            {message && <p className="error">{message}</p>}
            {views.length === 0 && (
              <div className="stack">
                <p>No child linked yet.</p>
                <button type="button" className="btn primary full" onClick={() => setTab('add')}>
                  Add my child
                </button>
              </div>
            )}
            {views.map((v) => (
              <ChildCard
                key={v.child.id}
                view={v}
                focused={v.child.routeId === focusRouteId}
                onFocus={() => setFocusRouteId(v.child.routeId)}
              />
            ))}
            {views.length > 0 && (
              <button type="button" className="btn ghost full" onClick={() => setTab('add')}>
                <SharedIcon name="plus" /> Add a child
              </button>
            )}
          </section>
        </div>
      )}

      {tab === 'account' && (
        <main className="screen">
          <AccountPanel parent={parent} onSignedOut={() => setUserId(null)} />
        </main>
      )}

      <nav className="tabbar" aria-label="Main">
        <button type="button" aria-current={tab === 'map' ? 'page' : undefined} onClick={() => setTab('map')}>
          <SharedIcon name="map" />
          Map
        </button>
        <button type="button" aria-current={tab === 'account' ? 'page' : undefined} onClick={() => setTab('account')}>
          <SharedIcon name="user" />
          Account
        </button>
      </nav>
    </div>
  );
}

function ChildCard({ view, focused, onFocus }: { view: ChildView; focused: boolean; onFocus: () => void }) {
  const { child, trip, events, van, pickup, drop, payment, absentToday, driverPhone } = view;
  const mine = events.filter((e) => e.childId === child.id).map((e) => e.eventType);
  const boarded = mine.includes('CHILD_BOARDED');
  const dropped = mine.includes('CHILD_DROPPED');
  const target = trip?.tripType === 'MORNING' ? pickup : trip?.tripType === 'AFTERNOON' ? drop : null;
  const distance = van && target ? haversineMeters({ lat: van.lat, lng: van.lng }, target) : null;
  const minutes = distance !== null ? Math.max(1, Math.round(etaMinutes(distance))) : null;
  const approaching = distance !== null && isApproaching(distance);

  const status = absentToday
    ? { text: 'Not coming today', tone: 'warn' }
    : !trip
    ? { text: 'No run', tone: '' }
    : dropped
      ? { text: 'Home', tone: 'ok' }
      : boarded
        ? { text: 'On the van', tone: 'brand' }
        : { text: 'Van coming', tone: 'warn' };

  const last = timelineFor(events, child.id).slice(-1)[0];
  const fee = feeState(payment);

  return (
    <article className="card" onClick={onFocus} style={{ borderColor: focused ? '#1a1a1a' : undefined }}>
      <div className="row between">
        <strong>{child.firstName}</strong>
        <span className={`chip ${status.tone}`}>{status.text}</span>
      </div>
      {approaching && minutes !== null && <p className="big-num" style={{ marginTop: 6 }}>{minutes} min away</p>}
      {last && (
        <p className="muted" style={{ marginTop: 4 }}>
          {parentMessage(last.eventType, {
            firstName: child.firstName,
            schoolName: child.schoolName,
            pickupLabel: pickup?.label || 'pickup',
            dropLabel: drop?.label || 'drop',
          })}
        </p>
      )}
      {driverPhone && (
        <a className="btn small ghost" style={{ marginTop: 10 }} href={`https://wa.me/91${driverPhone}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          WhatsApp driver
        </a>
      )}
      <div className="row between" style={{ marginTop: 10 }}>
        <span className="muted">₹{child.monthlyFee} / month</span>
        {fee === 'PAID' ? <span className="chip ok">Paid this month</span> : <span className="chip">Due this month</span>}
      </div>
    </article>
  );
}

// Add a child in three steps: name and school, pick a van, tap home on the map.
function AddChild({
  parentId,
  phone,
  presetRouteId,
  onDone,
  onCancel,
}: {
  parentId: string;
  phone: string;
  presetRouteId: string | null;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'details' | 'vans' | 'pin'>(presetRouteId ? 'pin' : 'details');
  const [schools, setSchools] = useState<string[]>([]);
  useEffect(() => {
    store.knownSchools().then(setSchools).catch(() => setSchools([]));
  }, []);
  const suggestions = schools.filter((n) => school.trim() && n.toLowerCase().includes(school.trim().toLowerCase()) && n.toLowerCase() !== school.trim().toLowerCase()).slice(0, 5);
  const [firstName, setFirstName] = useState('');
  const [school, setSchool] = useState('');
  const [results, setResults] = useState<RouteSearchResult[]>([]);
  const [routeId, setRouteId] = useState<string | null>(presetRouteId);
  const [pick, setPick] = useState<Point | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (!firstName.trim() || !school.trim()) return setMessage('Enter your child’s name and school.');
    setMessage(null);
    setBusy(true);
    try {
      const found = await store.searchRoutes(school, await locate());
      track('van_search', { results: found.length });
      setResults(found);
      setStep('vans');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!routeId || !pick) return;
    setBusy(true);
    setMessage(null);
    try {
      await store.enrolChild({ routeId, parentId, parentPhone: phone, firstName: firstName.trim() || 'Child', pickup: { ...pick, label: 'Home' } });
      track('child_added', { via: presetRouteId ? 'invite' : 'search' });
      await onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not add your child');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="btn small ghost" onClick={onCancel} aria-label="Back">
          <SharedIcon name="back" />
        </button>
        <span className="title">Add child</span>
      </header>

      {step === 'details' && (
        <main className="screen stack">
          <label className="field">
            <span>Child’s first name</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </label>
          <label className="field">
            <span>School</span>
            <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Sunrise School" />
          </label>
          {suggestions.length > 0 && (
            <div className="seg">
              {suggestions.map((n) => (
                <button key={n} type="button" onClick={() => setSchool(n)}>
                  {n}
                </button>
              ))}
            </div>
          )}
          {message && <p className="error">{message}</p>}
          <button type="button" className="btn primary full" onClick={search} disabled={busy}>
            Find vans
          </button>
        </main>
      )}

      {step === 'vans' && (
        <main className="screen">
          {results.length === 0 && (
            <div className="stack">
              <p className="notice">No van with free seats for this school yet.</p>
              <button
                type="button"
                className="btn primary full"
                onClick={async () => {
                  try {
                    await extras.joinWaitlist({ firstName: firstName || 'Child', school, pickup: await locate() });
                    setMessage('Saved. We will tell you when a van is free.');
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : 'Could not save');
                  }
                }}
              >
                Tell me when a van is free
              </button>
            </div>
          )}
          <ul className="list">
            {results.map((r) => (
              <li key={r.routeId} className="row between">
                <div className="grow">
                  <strong>{r.driverName}</strong>
                  <div className="muted">
                    {formatDistance(r.distanceM)} away · {r.seatsLeft} seats
                  </div>
                </div>
                <button
                  type="button"
                  className="btn primary small"
                  onClick={() => {
                    setRouteId(r.routeId);
                    setStep('pin');
                  }}
                >
                  Choose
                </button>
              </li>
            ))}
          </ul>
        </main>
      )}

      {step === 'pin' && (
        <div className="stage">
          <MapView stops={[]} pick={pick} pickMode onPick={setPick} />
          <section className="sheet">
            <p className="run-next">Tap your home</p>
            {message && <p className="error">{message}</p>}
            <div className="stack">
              <button type="button" className="btn primary full" onClick={async () => setPick(await locate())}>
                Use my location
              </button>
              <button type="button" className="btn ghost full" disabled={!pick || busy} onClick={save}>
                Confirm home
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AccountPanel({ parent, onSignedOut }: { parent: ParentProfile; onSignedOut: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ opens: number; joins: number } | null>(null);
  useEffect(() => {
    extras.myReferralStats().then(setStats).catch(() => {});
  }, []);
  const navigate = useNavigate();
  useEffect(() => {
    store.getDriver(parent.id).then((d) => setIsDriver(!!d));
  }, [parent.id]);
  const [confirming, setConfirming] = useState(false);
  const link = `${window.location.origin}/parent?ref=${parent.referralCode}`;
  return (
    <div className="stack">
      <section className="card stack">
        <h2>Hi {parent.name}</h2>
        <a
          className="btn primary full"
          href={`https://wa.me/?text=${encodeURIComponent(`Track my child's school van live on Ashwa: ${link}`)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('invite_shared', { role: 'parent' })}
        >
          Invite a parent
        </a>
      </section>

      {stats && (
        <section className="card">
          <p className="muted">
            Opened your link: <strong>{stats.opens}</strong> · Joined: <strong>{stats.joins}</strong>
          </p>
        </section>
      )}

      <PushToggle />

      {isDriver && (
        <button type="button" className="btn ghost full" onClick={() => navigate('/driver')}>
          Switch to driver
        </button>
      )}

      <AskDriver parentCode={parent.referralCode} parentName={parent.name} />

      <section className="card">
        <Link to="/privacy">Privacy</Link>
      </section>

      <section className="card stack">
        {!confirming ? (
          <button type="button" className="btn danger full" onClick={() => setConfirming(true)}>
            Delete my data
          </button>
        ) : (
          <>
            <p className="muted">Your name and number are removed. Your child stays on the driver’s list as “Deleted”.</p>
            <button
              type="button"
              className="btn danger full"
              onClick={async () => {
                try {
                  await store.deleteMyData();
                  await store.auth.signOut();
                  onSignedOut();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not delete');
                }
              }}
            >
              Yes, delete
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </section>

      <button
        type="button"
        className="btn ghost full"
        onClick={async () => {
          await store.auth.signOut();
          onSignedOut();
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function ParentSetup({
  userId,
  phone,
  referredBy,
  onSaved,
}: {
  userId: string;
  phone: string | null;
  referredBy: string | null;
  onSaved: (p: ParentProfile) => void;
}) {
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Enter your name');
    if (!phone) return setError('This sign-in has no phone number.');
    if (!consent) return setError('Tick the box to continue');
    try {
      const p = await store.saveParent({
        id: userId,
        name: name.trim(),
        phone,
        referredBy: referredBy || null,
        consentAt: new Date().toISOString(),
      });
      await applyPendingReferral();
      track('parent_profile_created', { via: referredBy ? 'referral' : 'direct' });
      track('consent_given', { role: 'parent' });
      onSaved(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <div className="auth">
      <div className="brand-mark">ASHWA</div>
      <div className="card stack">
        <h2>Your name</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Consent checked={consent} onChange={setConsent} role="parent" />
        <button type="button" className="btn primary full" onClick={save}>
          Continue
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

// Current position, or central Bangalore if the phone won't share it.
function locate(): Promise<Point> {
  const fallback: Point = { lat: 12.95, lng: 77.6, label: '' };
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(fallback);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label: '' }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function urlBase64ToBytes(b64: string): BufferSource {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out as BufferSource;
}

// Web push: needs a VAPID public key in the build (VITE_VAPID_PUBLIC_KEY). Hidden until it is set.
function PushToggle() {
  const [state, setState] = useState<'idle' | 'on' | 'blocked' | 'error'>('idle');
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!key || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  return (
    <button
      type="button"
      className="btn ghost full"
      onClick={async () => {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return setState('blocked');
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(key) });
          await extras.savePushSubscription(sub.toJSON());
          setState('on');
        } catch {
          setState('error');
        }
      }}
    >
      {state === 'on' ? 'Alerts are on' : state === 'blocked' ? 'Alerts blocked in this browser' : state === 'error' ? 'Could not turn on alerts' : 'Turn on alerts'}
    </button>
  );
}

// Parent asks their driver to join Ashwa. Opens WhatsApp to the driver with the parent's referral link.
function AskDriver({ parentCode, parentName }: { parentCode: string; parentName: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (sent) {
    return (
      <section className="card">
        <p className="muted">Sent. Thank you.</p>
      </section>
    );
  }
  return (
    <section className="card stack">
      <strong>Ask your driver to join</strong>
      <input placeholder="Driver's name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="tel" inputMode="tel" placeholder="Driver's mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button
        type="button"
        className="btn ghost full"
        disabled={!name.trim() || digits.length !== 10}
        onClick={() => {
          const link = window.location.origin + '/driver?ref=' + parentCode;
          const text = 'Hi ' + name.trim() + ", it's " + parentName + ". Please join Ashwa so I can track my child's van. It takes one minute: " + link;
          window.open('https://wa.me/91' + digits + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
          track('invite_shared', { role: 'parent', kind: 'driver_request' });
          setSent(true);
        }}
      >
        Send on WhatsApp
      </button>
    </section>
  );
}
