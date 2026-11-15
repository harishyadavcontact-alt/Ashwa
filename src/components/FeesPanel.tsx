import { useEffect, useState } from 'react';
import { store } from '../data';
import type { ChildRecord, PaymentRecord } from '../data/types';
import { track } from '../lib/analytics';
import { currentMonth, feeState, formatMonth } from '../logic/routes';

// The driver sets each price on the Customers tab. Here the driver marks who has paid this month,
// and sees who has not. Cash, UPI or bank: the method is just a note.
const METHODS = ['cash', 'UPI', 'bank'];

export function FeesPanel({ customers }: { customers: ChildRecord[] }) {
  const [month, setMonth] = useState(currentMonth());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [method, setMethod] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPayments(await store.listPayments(customers.map((c) => c.id), month));
  }

  useEffect(() => {
    load().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load'));
    // reload when the month or the customer list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, customers.length]);

  const byChild = new Map(payments.map((p) => [p.childId, p]));
  const paid = customers.filter((c) => byChild.get(c.id)?.status === 'PAID');
  const unpaid = customers.filter((c) => byChild.get(c.id)?.status !== 'PAID');
  const collected = paid.reduce((sum, c) => sum + c.monthlyFee, 0);
  const expected = customers.reduce((sum, c) => sum + c.monthlyFee, 0);

  async function markPaid(c: ChildRecord) {
    setError(null);
    try {
      await store.markPaid({ childId: c.id, month, amount: c.monthlyFee, method: method[c.id] ?? 'cash', reference: '' });
      track('payment_marked', { method: method[c.id] ?? 'cash' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  async function undo(c: ChildRecord) {
    setError(null);
    try {
      await store.clearPayment(c.id, month);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <div className="stack">
      <div className="row between">
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={{ width: 'auto' }} aria-label="Month" />
        <span className="muted">{formatMonth(month)}</span>
      </div>

      <p>
        <span className="big-num">
          {paid.length} of {customers.length}
        </span>{' '}
        <span className="muted">paid · ₹{collected} of ₹{expected}</span>
      </p>

      {error && <p className="error">{error}</p>}

      <strong>Not paid ({unpaid.length})</strong>
      {unpaid.length === 0 && <p className="muted">Everyone has paid.</p>}
      <ul className="list">
        {unpaid.map((c) => (
          <li key={c.id} className="row between">
            <div className="grow">
              <strong>{c.firstName}</strong> <span className="muted">₹{c.monthlyFee}</span>
            </div>
            <select aria-label={`Method for ${c.firstName}`} value={method[c.id] ?? 'cash'} onChange={(e) => setMethod({ ...method, [c.id]: e.target.value })} style={{ width: 96, height: 40 }}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button type="button" className="btn small primary" onClick={() => markPaid(c)}>
              Mark paid
            </button>
          </li>
        ))}
      </ul>

      {paid.length > 0 && (
        <>
          <strong>Paid ({paid.length})</strong>
          <ul className="list">
            {paid.map((c) => {
              const p = byChild.get(c.id);
              return (
                <li key={c.id} className="row between">
                  <div className="grow">
                    <strong>{c.firstName}</strong> <span className="muted">· {p?.method || feeState(p ?? null).toLowerCase()}</span>
                  </div>
                  <button type="button" className="btn small ghost" onClick={() => undo(c)}>
                    Undo
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {customers.length === 0 && <p className="muted">No customers yet.</p>}
    </div>
  );
}
