import { useEffect, useState } from 'react';
import Login from '../components/Login';
import { store } from '../data';
import { extras, type IncidentRecord, type WaitlistEntry } from '../data/extras';
import type { DriverProfile } from '../data/types';

// Founder console: verify drivers, see the funnel, the waitlist, and problems. Admins only.
export default function Admin() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (userId) store.isAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [userId]);

  if (userId === undefined) return <main className="shell">Loading…</main>;
  if (userId === null) return <Login title="Ashwa admin" onSignedIn={setUserId} />;
  if (isAdmin === null) return <main className="shell">Checking access…</main>;
  if (!isAdmin) {
    return (
      <main className="shell">
        <h2>Not authorised</h2>
        <p className="muted">This page is for the Ashwa team.</p>
      </main>
    );
  }
  return <Console />;
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Console() {
  const [pending, setPending] = useState<DriverProfile[]>([]);
  const [verified, setVerified] = useState<DriverProfile[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; n: number }[]>([]);
  const [days, setDays] = useState(30);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [p, v, f, w, i] = await Promise.all([
      store.listDriversByStatus('PENDING'),
      store.listDriversByStatus('VERIFIED'),
      extras.funnel(days),
      extras.listWaitlist(),
      extras.listIncidents(),
    ]);
    setPending(p);
    setVerified(v);
    setFunnel(f);
    setWaitlist(w);
    setIncidents(i);
  }

  useEffect(() => {
    load().catch((e: unknown) => setMessage(e instanceof Error ? e.message : 'Could not load'));
    // reload when the period changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function decide(d: DriverProfile, status: 'VERIFIED' | 'REJECTED') {
    try {
      await store.setDriverStatus(d.id, status);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <main className="shell stack">
      <h2>Ashwa admin</h2>
      {message && <p className="error">{message}</p>}

      <section className="card stack">
        <div className="row between">
          <strong>Funnel</strong>
          <div className="seg">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>
                {d} days
              </button>
            ))}
          </div>
        </div>
        <table className="counts" style={{ width: '100%' }}>
          <tbody>
            {funnel.map((r) => (
              <tr key={r.stage}>
                <td>{r.stage}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong>{r.n}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="btn ghost full"
          onClick={() => download(`ashwa-funnel-${days}d.csv`, toCsv(funnel.map((r) => ({ stage: r.stage, count: r.n }))))}
          disabled={funnel.length === 0}
        >
          Download funnel (CSV)
        </button>
      </section>

      <section className="card stack">
        <strong>Waiting for verification ({pending.length})</strong>
        <p className="muted">Check the licence and vehicle papers in person before you verify.</p>
        {pending.length === 0 && <p className="muted">No drivers waiting.</p>}
        <ul className="list">
          {pending.map((d) => (
            <li key={d.id} className="row between">
              <span>
                {d.name} · {d.vanSeats} seats
              </span>
              <span className="row">
                <button type="button" className="btn small primary" onClick={() => decide(d, 'VERIFIED')}>
                  Verify
                </button>
                <button type="button" className="btn small danger" onClick={() => decide(d, 'REJECTED')}>
                  Reject
                </button>
              </span>
            </li>
          ))}
        </ul>
        <p className="muted">Verified: {verified.length}</p>
      </section>

      <section className="card stack">
        <strong>Waitlist ({waitlist.length})</strong>
        <p className="muted">Parents who found no van. Match them by hand, then mark them matched in the database.</p>
        {waitlist.length === 0 && <p className="muted">Nobody waiting.</p>}
        <ul className="list">
          {waitlist.map((w) => (
            <li key={w.id}>
              {w.firstName} · {w.schoolName} · {w.pickupLat.toFixed(4)}, {w.pickupLng.toFixed(4)}
            </li>
          ))}
        </ul>
        {waitlist.length > 0 && (
          <button
            type="button"
            className="btn ghost full"
            onClick={() =>
              download(
                'ashwa-waitlist.csv',
                toCsv(waitlist.map((w) => ({ first_name: w.firstName, school: w.schoolName, lat: w.pickupLat, lng: w.pickupLng, created: w.createdAt }))),
              )
            }
          >
            Download waitlist (CSV)
          </button>
        )}
      </section>

      <section className="card stack">
        <strong>Problems reported ({incidents.length})</strong>
        {incidents.length === 0 && <p className="muted">None.</p>}
        <ul className="list">
          {incidents.map((i) => (
            <li key={i.id}>
              {i.kind} · {new Date(i.createdAt).toLocaleString('en-IN')}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
