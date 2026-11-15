import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Consent } from '../components/Consent';
import { SharedIcon } from '../components/Icons';
import { MapView } from '../components/MapView';
import Login from '../components/Login';
import { store } from '../data';
import type { ChildRecord, EventRecord, MapStop, ParentProfile, PaymentRecord, Point, RouteSearchResult, TripRecord, VanLocation } from '../data/types';
import { track } from '../lib/analytics';
import { notifyNewUpdates } from '../lib/updates';
import { parentMessage, timelineFor } from '../logic/alerts';
import { etaMinutes, haversineMeters, isApproaching } from '../logic/eta';
import { currentMonth, feeState, formatMonth } from '../logic/routes';

const POLL_MS = 10_000;
const METHODS = ['UPI', 'Cash', 'Bank'];

interface ChildView {
  child: ChildRecord;
  driverName: string;
  trip: TripRecord | null;
  events: EventRecord[];
  van: VanLocation | null;
  pickup: Point | null;
  drop: Point | null;
  payment: PaymentRecord | null;
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
                onChanged={() => load(userId!)}
                onError={setMessage}
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

function ChildCard({
  view,
  focused,
  onFocus,
  onChanged,
  onError,
}: {
  view: ChildView;
  focused: boolean;
  onFocus: () => void;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const { child, trip, events, van, pickup, drop, payment } = view;
  const mine = events.filter((e) => e.childId === child.id).map((e) => e.eventType);
  const boarded = mine.includes('CHILD_BOARDED');
  const dropped = mine.includes('CHILD_DROPPED');
  const target = trip?.tripType === 'MORNING' ? pickup : trip?.tripType === 'AFTERNOON' ? drop : null;
  const distance = van && target ? haversineMeters({ lat: van.lat, lng: van.lng }, target) : null;
  const minutes = distance !== null ? Math.max(1, Math.round(etaMinutes(distance))) : null;
  const approaching = distance !== null && isApproaching(distance);

  const status = !trip
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
      <div className="row between" style={{ marginTop: 10 }}>
        <span className="muted">₹{child.monthlyFee} / month</span>
        {fee === 'PAID' && <span className="chip ok">Paid</span>}
        {fee === 'REPORTED' && <span className="chip warn">Sent to driver</span>}
        {fee === 'DUE' && <PayButton child={child} onChanged={onChanged} onError={onError} />}
      </div>
    </article>
  );
}

function PayButton({ child, onChanged, onError }: { child: ChildRecord; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const month = currentMonth();

  if (!open) {
    return (
      <button
        type="button"
        className="btn primary small"
        disabled={child.monthlyFee <= 0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Pay ₹{child.monthlyFee}
      </button>
    );
  }

  return (
    <div className="stack" style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
      <div className="seg">
        {METHODS.map((m) => (
          <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)}>
            {m}
          </button>
        ))}
      </div>
      {method !== 'Cash' && <input placeholder="UPI ref (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />}
      <div className="row">
        <button
          type="button"
          className="btn primary grow"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await store.reportPayment({ childId: child.id, month, amount: child.monthlyFee, method, reference: reference.trim() });
              track('payment_reported', { method });
              setOpen(false);
              await onChanged();
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Could not save');
            } finally {
              setBusy(false);
            }
          }}
        >
          I paid {formatMonth(month)}
        </button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
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
          {message && <p className="error">{message}</p>}
          <button type="button" className="btn primary full" onClick={search} disabled={busy}>
            Find vans
          </button>
        </main>
      )}

      {step === 'vans' && (
        <main className="screen">
          {results.length === 0 && <p className="notice">No van with free seats for this school yet.</p>}
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
              <button
                type="button"
                className="btn ghost full"
                onClick={async () => setPick(await locate())}
              >
                Use my location
              </button>
              <button type="button" className="btn primary full" disabled={!pick || busy} onClick={save}>
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
