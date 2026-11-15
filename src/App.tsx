import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import Entry from './pages/Entry';
import DriverHome from './pages/DriverHome';
import ParentHome from './pages/ParentHome';
import Privacy from './pages/Privacy';
import { useEffect } from 'react';
import { captureReferral } from './lib/referral';

export default function App() {
  useEffect(() => {
    captureReferral();
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/parent" element={<ParentHome />} />
        <Route path="/driver" element={<DriverHome />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
