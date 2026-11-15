import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Consent } from '../components/Consent';
import { track } from '../lib/analytics';
import { parentMessage, timelineFor, unseenFor } from '../logic/alerts';
import Login from '../components/Login';
import { PointInput } from '../components/PointInput';
import { store } from '../data';
import type { ChildRecord, EventRecord, ParentProfile, PaymentRecord, Point, RouteSearchResult, RouteStop, TripRecord, VanLocation } from '../data/types';
import { etaMinutes, haversineMeters, isApproaching } from '../logic/eta';
import { currentMonth, feeState, formatMonth } from '../logic/routes';

const POLL_MS = 10_000;
const PAY_METHODS = ['UPI', 'Cash', 'Bank transfer', 'Other'];

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

export default function ParentHome() {
  const params = new URLSearchParams(window.location.search);
  const inviteRouteId = params.get('route');
  const referralCode = params.get('ref');

  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentProfile | null | undefined>(undefined);
  const [views, setViews] = useState<ChildView[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      store.auth.currentPhone().then(setPhone);
      store.getParent(userId).then(setParent);
    }
  }, [userId]);

  const load = useCallback(
    async (id: string) => {
      const kids = await store.listChildrenForParent(id);
      const month = currentMonth();
      const payments = await store.listPayments(
        kids.map((c) => c.id),
        month,
      );
      const next: ChildView[] = [];
      for (const child of kids) {
        const [driverName, trip, stops] = await Promise.all([
          store.routeDriverName(child.routeId),
          store.getActiveTrip(child.routeId),
          store.listStops(child.routeId),
        ]);
        const [events, van] = trip ? await Promise.all([store.listEvents(trip.id), store.getVanLocation(trip.id)]) : [[], null];
        next.push({
          child,
          driverName,
          trip,
          events,
          van,
          pickup: pointOf(stops as RouteStop[], child.toSchoolStopId),
          drop: pointOf(stops as RouteStop[], child.toHomeStopId),
          payment: payments.find((p) => p.childId === child.id) ?? null,
        });
      }
      setViews(next);
    },
    [],
  );

  // Link children a driver added under this phone number, once per visit.
  useEffect(() => {
    if (!userId || !parent || !phone || claimed) return;
    setClaimed(true);
    store
      .claimChildrenForPhone(userId, phone)
      .then(() => load(userId))
      .catch((e: unknown) => setMessage(String(e)));
  }, [userId, parent, phone, claimed, load]);

  useEffect(() => {
    if (!userId || !parent) return;
    load(userId).catch((e: unknown) => setMessage(String(e)));
    const t = setInterval(() => load(userId).catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [userId, parent, load]);

  if (userId === undefined || (userId && parent === undefined)) return <main className="shell">Loading…</main>;

  if (userId === null) {
    return (
      <main className="shell">
        <h1>Track your child’s van</h1>
        <Login onSignedIn={setUserId} />
      </main>
    );
  }

  if (parent === null) {
    return <ParentSetup userId={userId} phone={phone} referredBy={referralCode} onSaved={setParent} />;
  }

  const myCode = parent?.referralCode ?? '';
  const inviteLink = `${window.location.origin}/parent?ref=${myCode}`;

  return (
    <main className="shell">
      <h1>Hi {parent?.name || 'there'}</h1>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}

      {views.length === 0 && <p>No children linked yet. If your driver added your child, they will appear here after sign-in. Otherwise, find a van below.</p>}

      {views.map((v) => (
        <ChildCard key={v.child.id} view={v} onChanged={() => load(userId!)} onError={setMessage} />
      ))}

      {inviteRouteId && !views.some((v) => v.child.routeId === inviteRouteId) && (
        <AddToRoute routeId={inviteRouteId} parentId={userId!} phone={phone ?? ''} onDone={() => load(userId!)} onError={setMessage} />
      )}

      <FindVan parentId={userId!} phone={phone ?? ''} onDone={() => load(userId!)} onError={setMessage} />

      <section className="card">
        <h2>Share with other parents</h2>
        <p>Know another parent who is looking for a van? Send them Ashwa.</p>
        <p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`I track my child's school van live on Ashwa. It's free: ${inviteLink}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('invite_shared', { role: 'parent' })}
          >
            Share on WhatsApp
          </a>
        </p>
      </section>

      <DeleteData />
      <p className="muted footer">
        <Link to="/privacy">Privacy notice</Link>
      </p>
    </main>
  );
}

function pointOf(stops: RouteStop[], id: string): Point | null {
  const s = stops.find((x) => x.id === id);
  return s ? s.point : null;
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
    if (!phone) return setError('This sign-in has no phone number. Sign out and sign in with your mobile.');
    try {
      if (!consent) return setError('Please tick the consent box to continue.');
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
    <main className="shell">
      <h1>Your details</h1>
      {referredBy && <p className="muted">Invited by a parent. Welcome.</p>}
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <Consent checked={consent} onChange={setConsent} />
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

function ChildCard({ view, onChanged, onError }: { view: ChildView; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  const { child, driverName, trip, events, van, pickup, drop, payment } = view;
  const mine = events.filter((e) => e.childId === child.id).map((e) => e.eventType);
  const schoolReached = events.some((e) => e.eventType === 'DRIVER_AT_SCHOOL');
  const leftSchool = events.some((e) => e.eventType === 'DRIVER_LEFT_SCHOOL');

  let headline = 'Van is not on a run right now.';
  let target: Point | null = null;
  if (trip?.tripType === 'MORNING') {
    if (mine.includes('CHILD_BOARDED')) {
      headline = schoolReached ? `${child.firstName} reached ${child.schoolName}.` : `${child.firstName} is on the van to school.`;
    } else {
      headline = `Waiting for the van at ${pickup?.label || 'pickup point'}.`;
      target = pickup;
    }
  } else if (trip?.tripType === 'AFTERNOON') {
    if (mine.includes('CHILD_DROPPED')) headline = `${child.firstName} is home.`;
    else if (leftSchool) {
      headline = `${child.firstName} is on the van home.`;
      target = drop;
    } else headline = `Waiting at ${child.schoolName}.`;
  }

  const distance = van && target ? haversineMeters({ lat: van.lat, lng: van.lng }, target) : null;
  const approaching = distance !== null && isApproaching(distance);
  const minutes = distance !== null ? Math.max(1, Math.round(etaMinutes(distance))) : null;

  const alerted = useRef<string | null>(null);
  useEffect(() => {
    if (!approaching || !trip) return;
    const key = `${trip.id}-${child.id}`;
    if (alerted.current === key) return;
    alerted.current = key;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${child.firstName}'s van is about 5 minutes away`);
    }
  }, [approaching, trip, child.id, child.firstName]);

  return (
    <section className="card">
      <h2>{child.firstName}</h2>
      <p className="muted">
        {child.schoolName} · {driverName} · ₹{child.monthlyFee}/month
      </p>
      <p className="next">{headline}</p>
      <Timeline
        events={events}
        childId={child.id}
        firstName={child.firstName}
        schoolName={child.schoolName}
        pickupLabel={pickup?.label || 'pickup point'}
        dropLabel={drop?.label || 'drop point'}
      />
      {approaching && minutes !== null && (
        <p role="status" className="alert">
          Van is about {minutes} min away.
        </p>
      )}
      {trip && van && <p className="muted">Van location updated {new Date(van.updatedAt).toLocaleTimeString()}</p>}
      {trip && !van && <p className="muted">Waiting for the van’s location…</p>}
      {'Notification' in window && Notification.permission === 'default' && (
        <button type="button" onClick={() => Notification.requestPermission()}>
          Turn on alerts
        </button>
      )}
      <FeeBox child={child} payment={payment} onChanged={onChanged} onError={onError} />
    </section>
  );
}

function FeeBox({
  child,
  payment,
  onChanged,
  onError,
}: {
  child: ChildRecord;
  payment: PaymentRecord | null;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const month = currentMonth();
  const state = feeState(payment);
  const [method, setMethod] = useState(PAY_METHODS[0]);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  if (state === 'PAID') {
    return <p className="badge ok">{formatMonth(month)} fee paid · {payment?.method}</p>;
  }
  if (state === 'REPORTED') {
    return <p className="badge">You told your driver you paid {formatMonth(month)}. Waiting for their confirmation.</p>;
  }
  return (
    <details className="fee-box">
      <summary>Pay {formatMonth(month)} · ₹{child.monthlyFee}</summary>
      <p className="muted">Pay your driver by UPI, cash or bank, then tell the app here so the driver can confirm.</p>
      <label>
        How did you pay?
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAY_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        UPI transaction ID or note (optional)
        <input value={reference} onChange={(e) => setReference(e.target.value)} />
      </label>
      <button
        type="button"
        disabled={busy || child.monthlyFee <= 0}
        onClick={async () => {
          setBusy(true);
          try {
            await store.reportPayment({ childId: child.id, month, amount: child.monthlyFee, method, reference: reference.trim() });
            track('payment_reported', { method });
            await onChanged();
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Could not save');
          } finally {
            setBusy(false);
          }
        }}
      >
        I’ve paid
      </button>
      {child.monthlyFee <= 0 && <p className="muted">Your driver hasn’t set the fee yet.</p>}
    </details>
  );
}

function AddToRoute({
  routeId,
  parentId,
  phone,
  onDone,
  onError,
}: {
  routeId: string;
  parentId: string;
  phone: string;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [pickup, setPickup] = useState<Point | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className="card">
      <h2>Add your child to this van</h2>
      <label>
        Child’s first name
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <PointInput label="Pickup point (home)" value={pickup} onChange={setPickup} defaultName="Home" />
      <button
        type="button"
        disabled={busy || !firstName.trim() || !pickup}
        onClick={async () => {
          if (!pickup) return;
          setBusy(true);
          try {
            await store.enrolChild({ routeId, parentId, parentPhone: phone, firstName, pickup });
            track('child_added', { via: 'invite' });
            onDone();
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Could not add your child');
          } finally {
            setBusy(false);
          }
        }}
      >
        Add child
      </button>
    </section>
  );
}

function FindVan({
  parentId,
  phone,
  onDone,
  onError,
}: {
  parentId: string;
  phone: string;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [school, setSchool] = useState('');
  const [firstName, setFirstName] = useState('');
  const [pickup, setPickup] = useState<Point | null>(null);
  const [results, setResults] = useState<RouteSearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (!school.trim() || !pickup) {
      onError('Enter the school name and your pickup point.');
      return;
    }
    setBusy(true);
    try {
      const found = await store.searchRoutes(school, pickup);
      track('van_search', { results: found.length });
      setResults(found);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  async function choose(r: RouteSearchResult) {
    if (!pickup || !firstName.trim()) {
      onError('Enter your child’s first name, then choose a van.');
      return;
    }
    setBusy(true);
    try {
      await store.enrolChild({ routeId: r.routeId, parentId, parentPhone: phone, firstName, pickup });
      track('child_added', { via: 'search' });
      setResults(null);
      setSchool('');
      setFirstName('');
      setPickup(null);
      onDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add your child');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Find a van for a child</h2>
      <label>
        School name
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Sunrise School" />
      </label>
      <label>
        Child’s first name
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <PointInput label="Your pickup point (home)" value={pickup} onChange={setPickup} defaultName="Home" />
      <button type="button" onClick={search} disabled={busy}>
        Search vans
      </button>

      {results && results.length === 0 && <p>No van with free seats for that school yet.</p>}
      {results && results.length > 0 && (
        <ul className="results">
          {results.map((r) => (
            <li key={r.routeId} className="result">
              <div>
                <strong>{r.driverName}</strong> · {r.routeName}
              </div>
              <div className="muted">
                {r.schoolName} · {r.seatsLeft} seats left · about {formatDistance(r.distanceM)} from your pickup
              </div>
              <button type="button" disabled={busy || !firstName.trim()} onClick={() => choose(r)}>
                Choose this van
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

// Timeline of what happened on the van for this child. New items notify once, then are marked seen.
function Timeline({
  events,
  childId,
  firstName,
  schoolName,
  pickupLabel,
  dropLabel,
}: {
  events: EventRecord[];
  childId: string;
  firstName: string;
  schoolName: string;
  pickupLabel: string;
  dropLabel: string;
}) {
  const storageKey = `ashwa.seen.${childId}`;
  const [seen, setSeen] = useState<Set<string> | null>(null);

  // First visit on this device: mark what already happened as seen, without notifying.
  useEffect(() => {
    const stored = loadSeen(storageKey);
    if (stored) {
      setSeen(stored);
    } else {
      const all = new Set(timelineFor(events, childId).map((e) => e.id));
      saveSeen(storageKey, all);
      setSeen(all);
    }
    // only on mount or child change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const items = timelineFor(events, childId);
  const fresh = seen ? unseenFor(events, childId, seen) : [];
  const freshKey = fresh.map((e) => e.id).join(',');

  useEffect(() => {
    if (!seen || fresh.length === 0) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      for (const e of fresh.slice(0, 3)) {
        new Notification(parentMessage(e.eventType, { firstName, schoolName, pickupLabel, dropLabel }));
      }
    }
    const next = new Set([...seen, ...fresh.map((e) => e.id)]);
    saveSeen(storageKey, next);
    setSeen(next);
    // runs when new events arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey]);

  if (items.length === 0) return null;
  return (
    <ol className="timeline updates" aria-label="Updates for today">
      {items.map((e) => (
        <li key={e.id}>
          <span className="muted">{new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>{' '}
          {parentMessage(e.eventType, { firstName, schoolName, pickupLabel, dropLabel })}
        </li>
      ))}
    </ol>
  );
}

function loadSeen(key: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function saveSeen(key: string, ids: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...ids].slice(-500)));
  } catch {
    // Storage blocked: the same updates may notify again on reload. Not a data problem.
  }
}

// Parents can erase their personal data. Children stay on the driver's list, anonymised, so fee records stay.
function DeleteData() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function erase() {
    setBusy(true);
    setError(null);
    try {
      await store.deleteMyData();
      await store.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your data');
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Your data</h2>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)}>
          Delete my data
        </button>
      ) : (
        <>
          <p>
            This removes your name and mobile number from Ashwa. Your child stays on your driver’s list, shown as “Deleted”, so the
            fee records stay correct. This can’t be undone.
          </p>
          <div className="row">
            <button type="button" onClick={erase} disabled={busy}>
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
