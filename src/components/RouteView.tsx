import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { store } from '../data';
import type { ChildRecord, Direction, MapStop, Point, RouteRecord, RouteStop } from '../data/types';
import { track } from '../lib/analytics';
import { orderedStops, phoneKey } from '../logic/routes';
import { FeesPanel } from './FeesPanel';
import { SharedIcon as Icon } from './Icons';
import { MapView } from './MapView';
import { RunPanel } from './RunPanel';

type Tab = 'run' | 'customers' | 'stops' | 'fees';
type PickFor = 'stop' | 'pickup' | 'drop' | null;

interface CustomerForm {
  firstName: string;
  phone: string;
  fee: string;
  pickup: Point | null;
  sameDrop: boolean;
  drop: Point | null;
}

const EMPTY_FORM: CustomerForm = { firstName: '', phone: '', fee: '', pickup: null, sameDrop: true, drop: null };

// The driver's map. Tap the map to place stops and homes. The sheet holds the run, customers, stops and fees.
export function RouteView({ route, driverId, driverName, onBack }: { route: RouteRecord; driverId: string; driverName: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('run');
  const [map, setMap] = useState<MapStop[]>([]);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [pickFor, setPickFor] = useState<PickFor>(null);
  const [pickPoint, setPickPoint] = useState<Point | null>(null);
  const [stopDirection, setStopDirection] = useState<Direction>('TO_SCHOOL');
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [openStop, setOpenStop] = useState<MapStop | null>(null);

  async function load() {
    const [m, s, c] = await Promise.all([store.routeMap(route.id), store.listStops(route.id), store.listChildrenForRoute(route.id)]);
    setMap(m);
    setStops(s);
    setChildren(c);
  }

  useEffect(() => {
    load().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load'));
    // reload when the route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.id]);

  function startPick(what: Exclude<PickFor, null>) {
    setPickFor(what);
    setPickPoint(null);
  }

  function endPick() {
    setPickFor(null);
    setPickPoint(null);
  }

  async function confirmPick() {
    if (!pickPoint || !pickFor) return;
    if (pickFor === 'stop') {
      try {
        await store.addStop(route.id, stopDirection, pickPoint);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add stop');
      }
    } else if (pickFor === 'pickup') {
      setForm((f) => ({ ...f, pickup: pickPoint }));
      setTab('customers');
    } else {
      setForm((f) => ({ ...f, drop: pickPoint }));
      setTab('customers');
    }
    endPick();
  }

  const inviteLink = `${window.location.origin}/parent?route=${route.id}`;
  const picking = pickFor !== null;

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="btn small ghost" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <span className="title">{route.name}</span>
        <button type="button" className="chip" onClick={() => setShowCode((v) => !v)}>
          {showCode ? route.code : 'Code'}
        </button>
      </header>

      <div className="stage">
        <MapView stops={map} pick={pickPoint} pickMode={picking} onPick={setPickPoint} onStopTap={picking ? undefined : setOpenStop} />

        <section className="sheet" aria-label="Route">
          {picking && (
            <div className="stack">
              <p className="run-next">
                {pickFor === 'stop' ? 'Tap the stop' : pickFor === 'pickup' ? 'Tap the home for pickup' : 'Tap the drop point'}
              </p>
              <div className="row">
                <button type="button" className="btn primary grow" disabled={!pickPoint} onClick={confirmPick}>
                  Confirm
                </button>
                <button type="button" className="btn ghost" onClick={endPick}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!picking && openStop && (
            <StopSheet stop={openStop} children={children} driverName={driverName} inviteLink={inviteLink} onClose={() => setOpenStop(null)} />
          )}

          {!picking && !openStop && (
            <>
              <nav className="seg" aria-label="Sections" style={{ marginBottom: 12 }}>
                {(['run', 'customers', 'stops', 'fees'] as Tab[]).map((t) => (
                  <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
                    {t === 'run' ? 'Run' : t === 'customers' ? `Customers (${children.length})` : t === 'stops' ? 'Stops' : 'Fees'}
                  </button>
                ))}
              </nav>

              {error && <p className="error">{error}</p>}
              {showCode && (
                <p className="notice">
                  Replacement driver code: <span className="code">{route.code}</span>
                </p>
              )}

              {tab === 'run' && <RunPanel route={route} stops={stops} children={children} driverId={driverId} />}

              {tab === 'customers' && (
                <CustomersTab
                  route={route}
                  driverName={driverName}
                  inviteLink={inviteLink}
                  children={children}
                  form={form}
                  setForm={setForm}
                  onPickMap={startPick}
                  onChanged={load}
                  onError={setError}
                />
              )}

              {tab === 'stops' && (
                <StopsTab
                  routeId={route.id}
                  stops={stops}
                  children={children}
                  direction={stopDirection}
                  onDirection={setStopDirection}
                  onAdd={() => startPick('stop')}
                  onChanged={load}
                  onError={setError}
                />
              )}

              {tab === 'fees' && <FeesPanel customers={children} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

async function currentPoint(label: string): Promise<Point | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

// Fills a customer field from the phone's location in one tap.
function useHere(setForm: Dispatch<SetStateAction<CustomerForm>>, field: 'pickup' | 'drop') {
  currentPoint(field === 'pickup' ? 'Home' : 'Drop').then((p) => {
    if (!p) return alert('Location is off. Pin the point on the map instead.');
    setForm((f) => (field === 'pickup' ? { ...f, pickup: p } : { ...f, drop: p }));
  });
}

function StopsTab({
  routeId,
  stops,
  children,
  direction,
  onDirection,
  onAdd,
  onChanged,
  onError,
}: {
  routeId: string;
  stops: RouteStop[];
  children: ChildRecord[];
  direction: Direction;
  onDirection: (d: Direction) => void;
  onAdd: () => void;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const list = orderedStops(stops, direction);
  const addHere = async (dir: Direction) => {
    const p = await currentPoint('Stop');
    if (!p) return onError('Location is off. Pin the stop on the map instead.');
    try {
      await store.addStop(routeId, dir, p);
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add stop');
    }
  };
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Try again');
    }
  };
  return (
    <div className="stack">
      <div className="row">
        <div className="seg grow">
          <button type="button" aria-pressed={direction === 'TO_SCHOOL'} onClick={() => onDirection('TO_SCHOOL')}>
            To school
          </button>
          <button type="button" aria-pressed={direction === 'TO_HOME'} onClick={() => onDirection('TO_HOME')}>
            Home
          </button>
        </div>
      </div>
      <button type="button" className="btn primary full" onClick={() => addHere(direction)}>
        <Icon name="plus" /> Add stop: my location
      </button>
      <button type="button" className="btn small ghost" onClick={onAdd}>
        Pin on map instead
      </button>
      <ol className="list">
        {list.map((s, i) => {
          const users = children.filter((c) => (direction === 'TO_SCHOOL' ? c.toSchoolStopId : c.toHomeStopId) === s.id).length;
          return (
            <li key={s.id} className="row">
              <span className="grow">
                {i + 1}. {s.point.label || 'Stop'} {users > 0 && <span className="muted">· {users} kids</span>}
              </span>
              <button type="button" className="btn small ghost" aria-label="Move up" disabled={i === 0} onClick={() => run(() => store.moveStop(s.id, -1))}>
                ↑
              </button>
              <button type="button" className="btn small ghost" aria-label="Move down" disabled={i === list.length - 1} onClick={() => run(() => store.moveStop(s.id, 1))}>
                ↓
              </button>
              <button type="button" className="btn small danger" aria-label="Remove" disabled={users > 0} onClick={() => run(() => store.removeStop(s.id))}>
                ✕
              </button>
            </li>
          );
        })}
      </ol>
      {list.length === 0 && <p className="muted">No stops yet.</p>}
    </div>
  );
}

function CustomersTab({
  route,
  driverName,
  inviteLink,
  children,
  form,
  setForm,
  onPickMap,
  onChanged,
  onError,
}: {
  route: RouteRecord;
  driverName: string;
  inviteLink: string;
  children: ChildRecord[];
  form: CustomerForm;
  setForm: Dispatch<SetStateAction<CustomerForm>>;
  onPickMap: (what: 'pickup' | 'drop') => void;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<ChildRecord | null>(null);

  async function save() {
    if (!form.firstName.trim() || phoneKey(form.phone).length !== 10 || !form.pickup) {
      onError('Name, 10-digit mobile and pickup are needed.');
      return;
    }
    if (!form.sameDrop && !form.drop) {
      onError('Set the drop point on the map.');
      return;
    }
    setBusy(true);
    try {
      const child = await store.addCustomer({
        routeId: route.id,
        firstName: form.firstName,
        parentPhone: form.phone,
        monthlyFee: Number(form.fee) || 0,
        pickup: form.pickup,
        drop: form.sameDrop ? null : form.drop,
      });
      track('customer_added', { hasDrop: form.sameDrop ? 0 : 1 });
      setSaved(child);
      setAdding(false);
      setForm(EMPTY_FORM);
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add customer');
    } finally {
      setBusy(false);
    }
  }

  if (!adding) {
    return (
      <div className="stack">
        <button type="button" className="btn primary full" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add customer
        </button>
        {saved && (
          <div className="notice row between">
            <span>
              <strong>{saved.firstName}</strong> added
            </span>
            <a
              href={`https://wa.me/91${saved.parentPhone}?text=${encodeURIComponent(`Hi, it's ${driverName}, your school van. Join here: ${inviteLink}`)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('invite_shared', { role: 'driver' })}
            >
              Send invite
            </a>
          </div>
        )}
        <button
          type="button"
          className="btn ghost full"
          onClick={() => {
            const free = Math.max(0, route.vanSeats - children.length);
            const text = `${free} seat${free === 1 ? '' : 's'} free on ${route.name} (${route.schoolName}). Join: ${inviteLink}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
            track('invite_shared', { role: 'driver', kind: 'seats' });
          }}
        >
          Share free seats
        </button>
        <CustomerList children={children} onChanged={onChanged} onError={onError} />
      </div>
    );
  }

  return (
    <div className="stack">
      <label className="field" style={{ margin: 0 }}>
        <span>Child’s name</span>
        <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
      </label>
      <label className="field" style={{ margin: 0 }}>
        <span>Parent’s mobile</span>
        <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="98xxx xxxxx" />
      </label>
      <label className="field" style={{ margin: 0 }}>
        <span>Monthly fee ₹</span>
        <input inputMode="numeric" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value.replace(/\D/g, '') }))} />
      </label>
      <button type="button" className={`btn ${form.pickup ? 'ghost' : 'primary'} full`} onClick={() => useHere(setForm, 'pickup')}>
        {form.pickup ? 'Pickup set ✓ · update' : 'Use my location: pickup'}
      </button>
      <button type="button" className="btn small ghost" onClick={() => onPickMap('pickup')}>
        Pin on map instead
      </button>
      <label className="check">
        <input type="checkbox" checked={form.sameDrop} onChange={(e) => setForm((f) => ({ ...f, sameDrop: e.target.checked }))} />
        Drop is the same as pickup
      </label>
      {!form.sameDrop && (
        <button type="button" className={`btn ${form.drop ? 'ghost' : 'primary'} full`} onClick={() => useHere(setForm, 'drop')}>
          {form.drop ? 'Drop set ✓ · update' : 'Use my location: drop'}
        </button>
      )}
      <div className="row">
        <button type="button" className="btn primary grow" onClick={save} disabled={busy}>
          Save customer
        </button>
        <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CustomerList({ children, onChanged, onError }: { children: ChildRecord[]; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  if (children.length === 0) return <p className="muted">No customers yet.</p>;
  return (
    <ul className="list">
      {children.map((c) => (
        <CustomerRow key={c.id} child={c} onChanged={onChanged} onError={onError} />
      ))}
    </ul>
  );
}

function CustomerRow({ child, onChanged, onError }: { child: ChildRecord; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  const [fee, setFee] = useState(String(child.monthlyFee));
  return (
    <li className="row between">
      <div className="grow">
        <strong>{child.firstName}</strong> <span className={`chip ${child.parentId ? 'ok' : 'warn'}`}>{child.parentId ? 'Joined' : 'Invited'}</span>
        <div className="muted">•••• {child.parentPhone.slice(-4)}</div>
      </div>
      <input
        aria-label={`Monthly fee for ${child.firstName}`}
        inputMode="numeric"
        value={fee}
        onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))}
        onBlur={async () => {
          if (Number(fee) === child.monthlyFee) return;
          try {
            await store.setMonthlyFee(child.id, Number(fee) || 0);
            await onChanged();
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Could not save fee');
          }
        }}
        style={{ width: 96, height: 40 }}
      />
    </li>
  );
}

// Families at one pin. Joined families are linked to their account; the rest get an invite.
function StopSheet({
  stop,
  children,
  driverName,
  inviteLink,
  onClose,
}: {
  stop: MapStop;
  children: ChildRecord[];
  driverName: string;
  inviteLink: string;
  onClose: () => void;
}) {
  const here = stop.id ? children.filter((c) => c.toSchoolStopId === stop.id || c.toHomeStopId === stop.id) : [];
  return (
    <div className="stack">
      <div className="row between">
        <strong>{stop.point.label || 'Stop'}</strong>
        <button type="button" className="btn small ghost" onClick={onClose}>
          Done
        </button>
      </div>
      {here.length === 0 && <p className="muted">No families at this pin yet.</p>}
      <ul className="list">
        {here.map((c) => {
          const text = `Hi, it's ${driverName}, your school van. Join here: ${inviteLink}`;
          return (
            <li key={c.id} className="row between">
              <div className="grow">
                <strong>{c.firstName}</strong>
                <div className="muted">•••• {c.parentPhone.slice(-4)}</div>
              </div>
              {c.parentId ? (
                <span className="chip ok">Joined</span>
              ) : (
                <a
                  className="btn small primary"
                  href={`https://wa.me/91${c.parentPhone}?text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track('invite_shared', { role: 'driver' })}
                >
                  Invite
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
