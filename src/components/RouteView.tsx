import { useEffect, useState } from 'react';
import { store } from '../data';
import type { ChildRecord, Direction, Point, RouteRecord, RouteStop } from '../data/types';
import { orderedStops, phoneKey } from '../logic/routes';
import { FeesPanel } from './FeesPanel';
import { PointInput } from './PointInput';
import { RunPanel } from './RunPanel';

type Tab = 'route' | 'customers' | 'run' | 'fees';

export function RouteView({ route, driverId, driverName, onBack }: { route: RouteRecord; driverId: string; driverName: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('route');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const isOwner = route.ownerId === driverId;

  async function load() {
    const [s, c] = await Promise.all([store.listStops(route.id), store.listChildrenForRoute(route.id)]);
    setStops(s);
    setChildren(c);
  }

  useEffect(() => {
    load().catch((e: unknown) => setMessage(String(e)));
  }, [route.id]);

  const parentLink = `${window.location.origin}/parent?route=${route.id}`;
  const parentShare = encodeURIComponent(
    `Hi, I'm ${driverName}, your school van to ${route.schoolName}. Tap to see your child's van live and get alerts. Free: ${parentLink}`,
  );

  return (
    <main className="shell">
      <button type="button" onClick={onBack}>
        ← All routes
      </button>
      <h1>{route.name}</h1>
      <p className="muted">
        {route.schoolName} · {route.vanSeats} seats
      </p>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}

      <nav className="tabs" aria-label="Route sections">
        {(['route', 'customers', 'run', 'fees'] as Tab[]).map((t) => (
          <button key={t} type="button" aria-current={tab === t} className={tab === t ? 'tab on' : 'tab'} onClick={() => setTab(t)}>
            {t === 'route' ? 'Route' : t === 'customers' ? 'Customers' : t === 'run' ? 'Run' : 'Fees'}
          </button>
        ))}
      </nav>

      {tab === 'route' && (
        <>
          {isOwner && (
            <section className="card">
              <h2>Replacement driver code</h2>
              <p>
                A substitute driver opens the app, picks <em>Join a route</em>, and enters <strong className="code">{route.code}</strong>. They
                then see the same stops and can run it.
              </p>
            </section>
          )}
          <section className="card">
            <h2>Invite parents</h2>
            <p>Parents tap this, sign in, and add their child to your van.</p>
            <p>
              <a href={`https://wa.me/?text=${parentShare}`} target="_blank" rel="noreferrer">
                Share on WhatsApp
              </a>
            </p>
          </section>
          <StopList
            routeId={route.id}
            title="To school (morning)"
            direction="TO_SCHOOL"
            startLabel={route.start.label}
            endLabel={`School: ${route.school.label}`}
            stops={stops}
            children={children}
            editable={isOwner}
            onChanged={load}
            onError={setMessage}
          />
          <StopList
            routeId={route.id}
            title="Back home (afternoon)"
            direction="TO_HOME"
            startLabel={`School: ${route.school.label}`}
            endLabel={`End: ${route.start.label}`}
            stops={stops}
            children={children}
            editable={isOwner}
            onChanged={load}
            onError={setMessage}
          />
        </>
      )}

      {tab === 'customers' && (
        <Customers route={route} driverName={driverName} children={children} onChanged={load} onError={setMessage} />
      )}

      {tab === 'run' && <RunPanel route={route} stops={stops} children={children} driverId={driverId} />}

      {tab === 'fees' && <FeesPanel children={children} />}
    </main>
  );
}

function StopList({
  routeId,
  title,
  direction,
  startLabel,
  endLabel,
  stops,
  children,
  editable,
  onChanged,
  onError,
}: {
  routeId: string;
  title: string;
  direction: Direction;
  startLabel: string;
  endLabel: string;
  stops: RouteStop[];
  children: ChildRecord[];
  editable: boolean;
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const list = orderedStops(stops, direction);
  const usedBy = (stopId: string) =>
    children.filter((c) => (direction === 'TO_SCHOOL' ? c.toSchoolStopId : c.toHomeStopId) === stopId);
  const [point, setPoint] = useState<Point | null>(null);

  async function act(fn: () => Promise<void>) {
    try {
      await fn();
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      <ol className="stops">
        <li className="fixed">{startLabel}</li>
        {list.length === 0 && <li className="muted">No stops yet. Add customers or waypoints.</li>}
        {list.map((s, i) => {
          const kids = usedBy(s.id);
          return (
            <li key={s.id}>
              <span>
                {i + 1}. {s.point.label}
                {kids.length > 0 && <span className="muted"> · {kids.map((k) => k.firstName).join(', ')}</span>}
              </span>
              {editable && (
                <span className="row small">
                  <button type="button" aria-label={`Move ${s.point.label} up`} disabled={i === 0} onClick={() => act(() => store.moveStop(s.id, -1))}>
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${s.point.label} down`}
                    disabled={i === list.length - 1}
                    onClick={() => act(() => store.moveStop(s.id, 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${s.point.label}`}
                    disabled={kids.length > 0}
                    onClick={() => act(() => store.removeStop(s.id))}
                  >
                    ✕
                  </button>
                </span>
              )}
            </li>
          );
        })}
        <li className="fixed">{endLabel}</li>
      </ol>
      {editable && (
        <details>
          <summary>Add a waypoint to this direction</summary>
          <PointInput label="Waypoint" value={point} onChange={setPoint} defaultName="Stop" />
          <button
            type="button"
            disabled={!point}
            onClick={() => {
              if (!point) return;
              act(async () => {
                await store.addStop(routeId, direction, point);
                setPoint(null);
              });
            }}
          >
            Add waypoint
          </button>
        </details>
      )}
    </section>
  );
}

function Customers({
  route,
  driverName,
  children,
  onChanged,
  onError,
}: {
  route: RouteRecord;
  driverName: string;
  children: ChildRecord[];
  onChanged: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [fee, setFee] = useState('');
  const [pickup, setPickup] = useState<Point | null>(null);
  const [sameDrop, setSameDrop] = useState(true);
  const [drop, setDrop] = useState<Point | null>(null);
  const [added, setAdded] = useState<ChildRecord | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!firstName.trim() || phoneKey(phone).length !== 10 || !pickup) {
      onError('Enter the child’s name, the parent’s 10-digit mobile number and the pickup point.');
      return;
    }
    if (!sameDrop && !drop) {
      onError('Set the drop point, or tick “same as pickup”.');
      return;
    }
    setSaving(true);
    try {
      const child = await store.addCustomer({
        routeId: route.id,
        firstName,
        parentPhone: phone,
        monthlyFee: Number(fee) || 0,
        pickup,
        drop: sameDrop ? null : drop,
      });
      setAdded(child);
      setFirstName('');
      setPhone('');
      setFee('');
      setPickup(null);
      setDrop(null);
      setSameDrop(true);
      await onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add the customer');
    } finally {
      setSaving(false);
    }
  }

  const link = `${window.location.origin}/parent?route=${route.id}`;

  return (
    <>
      <section className="card">
        <h2>Customers ({children.length})</h2>
        {children.length === 0 && <p>No customers yet. Add your first one below.</p>}
        <ul className="customers">
          {children.map((c) => (
            <CustomerRow key={c.id} child={c} onChanged={onChanged} onError={onError} />
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Add a customer</h2>
        <label>
          Child’s first name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Parent’s mobile number
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxxxxxxx" />
        </label>
        <label>
          Monthly fee (₹)
          <input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))} />
        </label>
        <PointInput label="Pickup point (home)" value={pickup} onChange={setPickup} defaultName="Home" />
        <label className="check">
          <input type="checkbox" checked={sameDrop} onChange={(e) => setSameDrop(e.target.checked)} />
          Drop-off is the same as pickup
        </label>
        {!sameDrop && <PointInput label="Drop point" value={drop} onChange={setDrop} defaultName="Drop" />}
        <button type="button" onClick={save} disabled={saving}>
          Save customer
        </button>

        {added && (
          <div className="status">
            <p>Added {added.firstName}. Send the parent the link so they can join:</p>
            <p>
              <a
                href={`https://wa.me/91${added.parentPhone}?text=${encodeURIComponent(
                  `Hi, it's ${driverName}, your school van driver. Tap to join and see your child's van live: ${link}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Send to parent on WhatsApp
              </a>
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function CustomerRow({ child, onChanged, onError }: { child: ChildRecord; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  const [fee, setFee] = useState(String(child.monthlyFee));
  return (
    <li className="customer">
      <div>
        <strong>{child.firstName}</strong> · {child.parentPhone}{' '}
        <span className="badge">{child.parentId ? 'Joined' : 'Waiting for parent'}</span>
      </div>
      <div className="row">
        <input aria-label={`Monthly fee for ${child.firstName}`} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))} />
        <button
          type="button"
          onClick={async () => {
            try {
              await store.setMonthlyFee(child.id, Number(fee) || 0);
              await onChanged();
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Could not save the fee');
            }
          }}
        >
          Save fee
        </button>
      </div>
    </li>
  );
}
