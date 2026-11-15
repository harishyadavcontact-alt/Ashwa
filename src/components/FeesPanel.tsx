import { useEffect, useState } from 'react';
import { store } from '../data';
import { track } from '../lib/analytics';
import type { ChildRecord, PaymentRecord } from '../data/types';
import { currentMonth, feeState, formatMonth } from '../logic/routes';

const METHODS = ['cash', 'upi', 'bank', 'other'];

// Driver's view of fees for one month. Works for cash, UPI, bank, or anything else the driver can see.
export function FeesPanel({ children }: { children: ChildRecord[] }) {
  const [month, setMonth] = useState(currentMonth());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setPayments(await store.listPayments(children.map((c) => c.id), month));
  }

  useEffect(() => {
    load().catch((e: unknown) => setMessage(String(e)));
    // load depends on the child list and month only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, children.length]);

  const byChild = new Map(payments.map((p) => [p.childId, p]));
  const due = children.reduce((sum, c) => sum + c.monthlyFee, 0);
  const collected = children.reduce((sum, c) => {
    const p = byChild.get(c.id);
    return p?.status === 'PAID' ? sum + p.amount : sum;
  }, 0);
  const paidCount = children.filter((c) => byChild.get(c.id)?.status === 'PAID').length;

  async function markPaidTracked(input: Parameters<typeof store.markPaid>[0]) {
    await store.markPaid(input);
    track('payment_marked', { method: input.method });
  }

  async function run(action: () => Promise<void>) {
    setMessage(null);
    try {
      await action();
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <section className="card">
      <h2>Fees for {formatMonth(month)}</h2>
      <label>
        Month
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </label>
      <p className="next">
        Collected ₹{collected} of ₹{due} · {paidCount}/{children.length} paid
      </p>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}
      <ul className="fees">
        {children.map((c) => {
          const p = byChild.get(c.id) ?? null;
          const state = feeState(p);
          const method = methods[c.id] ?? 'cash';
          return (
            <li key={c.id} className={`fee fee-${state.toLowerCase()}`}>
              <div>
                <strong>{c.firstName}</strong> · ₹{c.monthlyFee}{' '}
                <span className="badge">{state === 'DUE' ? 'Due' : state === 'REPORTED' ? 'Parent says paid' : 'Paid'}</span>
              </div>
              {p && (
                <p className="muted">
                  {p.method || 'unknown method'}
                  {p.reference ? ` · ref ${p.reference}` : ''}
                </p>
              )}
              {state === 'DUE' && (
                <div className="row">
                  <select aria-label={`Method for ${c.firstName}`} value={method} onChange={(e) => setMethods({ ...methods, [c.id]: e.target.value })}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => run(() => markPaidTracked({ childId: c.id, month, amount: c.monthlyFee, method, reference: '' }))}
                  >
                    Mark paid
                  </button>
                </div>
              )}
              {state === 'REPORTED' && p && (
                <div className="row">
                  <button
                    type="button"
                    onClick={() => run(() => markPaidTracked({ childId: c.id, month, amount: p.amount, method: p.method, reference: p.reference }))}
                  >
                    Confirm received
                  </button>
                  <button type="button" onClick={() => run(() => store.clearPayment(c.id, month))}>
                    Not received
                  </button>
                </div>
              )}
              {state === 'PAID' && (
                <button type="button" onClick={() => run(() => store.clearPayment(c.id, month))}>
                  Undo
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
