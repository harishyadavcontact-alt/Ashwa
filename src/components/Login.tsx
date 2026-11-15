import { useState } from 'react';
import { isDemoMode, store } from '../data';

// Phone + one-time code. Same screen for parents and drivers.
export default function Login({ onSignedIn }: { onSignedIn: (userId: string) => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const normalised = () => (phone.startsWith('+') ? phone.replace(/\s/g, '') : `+91${phone.replace(/\D/g, '')}`);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      await store.auth.sendCode(normalised());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send code');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const id = await store.auth.verifyCode(normalised(), code.trim());
      onSignedIn(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wrong code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      {isDemoMode && (
        <p role="note" className="demo-note">
          Demo mode: data stays in this browser. Use code 000000.
        </p>
      )}
      <label>
        Mobile number
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98xxxxxxxx"
        />
      </label>
      {!sent ? (
        <button type="button" onClick={sendCode} disabled={busy || phone.replace(/\D/g, '').length < 10}>
          Send code
        </button>
      ) : (
        <>
          <label>
            Code from SMS
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button type="button" onClick={verify} disabled={busy || code.trim().length < 6}>
            Sign in
          </button>
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
