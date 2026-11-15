import { useState } from 'react';
import { isDemoMode, store } from '../data';

// Phone + one-time code. Same for parents and drivers.
export default function Login({ title, onSignedIn }: { title: string; onSignedIn: (userId: string) => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const e164 = () => (phone.startsWith('+') ? phone.replace(/\s/g, '') : `+91${phone.replace(/\D/g, '')}`);

  async function getCode() {
    setBusy(true);
    setError(null);
    try {
      await store.auth.sendCode(e164());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await store.auth.verifyCode(e164(), code.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wrong code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="brand-mark">ASHWA</div>
      <div className="card stack">
        <h2>{title}</h2>
        {isDemoMode && <p className="notice">Demo: code 000000</p>}
        {!sent ? (
          <>
            <label className="field">
              <span>Mobile</span>
              <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxx xxxxx" />
            </label>
            <button type="button" className="btn primary full" onClick={getCode} disabled={busy || phone.replace(/\D/g, '').length < 10}>
              Get code
            </button>
          </>
        ) : (
          <>
            <label className="field">
              <span>6-digit code</span>
              <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <button type="button" className="btn primary full" onClick={signIn} disabled={busy || code.trim().length < 6}>
              Sign in
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
