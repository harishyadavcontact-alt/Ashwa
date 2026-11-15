import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import DriverHome from './pages/DriverHome';
import ParentHome from './pages/ParentHome';
import Privacy from './pages/Privacy';

function Landing() {
  return (
    <div className="auth">
      <div className="brand-mark">ASHWA</div>
      <div className="card stack">
        <Link className="btn primary full" to="/parent">I’m a parent</Link>
        <Link className="btn ghost full" to="/driver">I’m a driver</Link>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/parent" element={<ParentHome />} />
        <Route path="/driver" element={<DriverHome />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
