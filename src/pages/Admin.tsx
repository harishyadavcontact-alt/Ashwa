import { useEffect, useState } from 'react';
import Login from '../components/Login';
import { store } from '../data';
import type { DriverProfile } from '../data/types';

// Founder-only: verify drivers before they appear in parent search, and see the pilot's event counts.
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
  if (userId === null) {
    return (
      <main className="shell">
        <h1>Ashwa admin</h1>
        <Login onSignedIn={setUserId} />
      </main>
    );
  }
  if (isAdmin === null) return <main className="shell">Checking access…</main>;
  if (!isAdmin) {
    return (
      <main className="shell">
        <h1>Not authorised</h1>
        <p>This page is for the Ashwa team.</p>
      </main>
    );
  }
  return <AdminConsole />;
}

function AdminConsole() {
  const [pending, setPending] = useState<DriverProfile[]>([]);
  const [verified, setVerified] = useState<DriverProfile[]>([]);
  const [counts, setCounts] = useState<{ name: string; n: number }[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [p, v, c] = await Promise.all([
      store.listDriversByStatus('PENDING'),
      store.listDriversByStatus('VERIFIED'),
      store.eventCounts(7),
    ]);
    setPending(p);
    setVerified(v);
    setCounts(c);
  }

  useEffect(() => {
    load().catch((e: unknown) => setMessage(String(e)));
  }, []);

  async function decide(d: DriverProfile, status: 'VERIFIED' | 'REJECTED') {
    setMessage(null);
    try {
      await store.setDriverStatus(d.id, status);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <main className="shell">
      <h1>Ashwa admin</h1>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}

      <section className="card">
        <h2>Waiting for verification ({pending.length})</h2>
        <p className="muted">Meet the driver and check the licence and vehicle papers in person before you verify. Only verified drivers appear in parent search.</p>
        {pending.length === 0 && <p>No drivers waiting.</p>}
        <ul className="customers">
          {pending.map((d) => (
            <li key={d.id}>
              <strong>{d.name}</strong> · {d.vanSeats} seats
              <div className="row">
                <button type="button" onClick={() => decide(d, 'VERIFIED')}>
                  Verify
                </button>
                <button type="button" onClick={() => decide(d, 'REJECTED')}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Verified drivers ({verified.length})</h2>
        <ul>
          {verified.map((d) => (
            <li key={d.id}>
              {d.name} · {d.vanSeats} seats
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Events, last 7 days</h2>
        {counts.length === 0 && <p>No events yet.</p>}
        <table className="counts">
          <tbody>
            {counts.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
