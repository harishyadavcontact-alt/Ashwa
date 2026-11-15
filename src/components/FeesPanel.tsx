import { useEffect, useState } from 'react';
import { store } from '../data';
import type { ChildRecord, PaymentRecord } from '../data/types';
import { track } from '../lib/analytics';
import { currentMonth, feeState, formatMonth } from '../logic/routes';

// Driver's fee list for one month. Cash, UPI, bank: the driver just marks what they received.
export function FeesPanel({ customers }: { customers: ChildRecord[] }) {
  const [month, setMonth] = useState(currentMonth());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPayments(await store.listPayments(customers.map((c) => c.id), month));
  }

  useEffect(() => {
    load().catch((e: unknown) => setError(String(e)));
    // reload on month or customer-count change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, customers.length]);

  const byChild = new Map(payments.map((p) => [p.childId, p]));
  const due = customers.reduce((s, c) => s + c.monthlyFee, 0);
  const got = customers.reduce((s, c) => (byChild.get(c.id)?.status === 'PAID' ? s + (byChild.get(c.id)?.amount ?? 0) : s), 0);

  async function act(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again');
    }
  }

  return (
    <div className="stack">
      <div className="row between">
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={{ width: 'auto' }} aria-label="Month" />
        <span className="chip">{formatMonth(month)}</span>
      </div>
      <p>
        <span className="big-num">₹{got}</span> <span className="muted">of ₹{due}</span>
      </p>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {customers.map((c) => {
          const p = byChild.get(c.id) ?? null;
          const state = feeState(p);
          return (
            <li key={c.id} className="row between">
              <div className="grow">
                <strong>{c.firstName}</strong> <span className="muted">₹{c.monthlyFee}</span>
                {p?.method && <div className="muted">{p.method}{p.reference ? ` · ${p.reference}` : ''}</div>}
              </div>
              {state === 'PAID' && (
                <>
                  <span className="chip ok">Paid</span>
                  <button type="button" className="btn small ghost" onClick={() => act(() => store.clearPayment(c.id, month))}>
                    Undo
                  </button>
                </>
              )}
              {state === 'REPORTED' && p && (
                <>
                  <button
                    type="button"
                    className="btn small primary"
                    onClick={() =>
                      act(async () => {
                        await store.markPaid({ childId: c.id, month, amount: p.amount, method: p.method, reference: p.reference });
                        track('payment_marked', { method: p.method });
                      })
                    }
                  >
                    Received
                  </button>
                  <button type="button" className="btn small ghost" onClick={() => act(() => store.clearPayment(c.id, month))}>
                    No
                  </button>
                </>
              )}
              {state === 'DUE' && (
                <button
                  type="button"
                  className="btn small primary"
                  onClick={() =>
                    act(async () => {
                      await store.markPaid({ childId: c.id, month, amount: c.monthlyFee, method: 'cash', reference: '' });
                      track('payment_marked', { method: 'cash' });
                    })
                  }
                >
                  Got cash
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {customers.length === 0 && <p className="muted">No customers yet.</p>}
    </div>
  );
}
