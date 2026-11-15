import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import DriverHome from './pages/DriverHome';
import ParentHome from './pages/ParentHome';
import Privacy from './pages/Privacy';

function Landing() {
  return (
    <main className="shell">
      <h1>Ashwa</h1>
      <p>Know where your child's school van is, without calling anyone.</p>
      <p>
        <Link to="/parent">I'm a parent</Link>
      </p>
      <p>
        <Link to="/driver">I'm a van driver</Link>
      </p>
      <p className="muted">
        <Link to="/privacy">Privacy notice</Link>
      </p>
    </main>
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
