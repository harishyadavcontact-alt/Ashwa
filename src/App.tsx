import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import ParentHome from './pages/ParentHome';
import DriverHome from './pages/DriverHome';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
