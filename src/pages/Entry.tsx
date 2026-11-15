import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { store } from '../data';

// One front door, like a ride-hailing app: mobile number first. After sign-in the app
// sends a driver to their routes and a parent to their map. The session stays on the device.
export default function Entry() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [roles, setRoles] = useState<{ driver: boolean; parent: boolean } | null>(null);

  useEffect(() => {
    store.auth.currentUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    Promise.all([store.getDriver(userId), store.getParent(userId)]).then(([d, p]) => setRoles({ driver: !!d, parent: !!p }));
  }, [userId]);

  useEffect(() => {
    if (!roles) return;
    if (roles.driver && !roles.parent) navigate('/driver', { replace: true });
    if (roles.parent && !roles.driver) navigate('/parent', { replace: true });
  }, [roles, navigate]);

  if (userId === undefined) return <div className="auth">Loading…</div>;
  if (!userId) return <Login title="Sign in with your mobile" onSignedIn={setUserId} />;
  if (!roles) return <div className="auth">Loading…</div>;

  // New user, or someone who is both a parent and a driver.
  return (
    <div className="auth">
      <div className="brand-mark">ASHWA</div>
      <div className="card stack">
        <h2>I am a…</h2>
        <button type="button" className="btn primary full" onClick={() => navigate('/parent')}>
          Parent
        </button>
        <button type="button" className="btn primary full" onClick={() => navigate('/driver')}>
          Driver
        </button>
      </div>
    </div>
  );
}
