import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import NotFound from '@/pages/not-found';
import './hub.css';

// Each portfolio ships as its own chunk so the heavy 3D and Sekiro styles
// only load on the route that needs them.
const SekiroPortfolio = lazy(() => import('@/portfolios/sekiro/SekiroPortfolio'));
const ValorantPortfolio = lazy(() => import('@/portfolios/valorant/ValorantPortfolio.jsx'));

function Hub() {
  return (
    <main className="hub" data-testid="hub">
      <div className="hub-grid" aria-hidden="true" />
      <p className="hub-kicker">Akshay Suresh / Select a protocol</p>
      <nav className="hub-choices" aria-label="Portfolios">
        <Link to="/sekiro" className="hub-link hub-link-sekiro">
          <span className="hub-index">01</span>
          <span className="hub-title">SEKIRO // SHADOWS DIE TWICE</span>
        </Link>
        <Link to="/valorant" className="hub-link hub-link-valorant">
          <span className="hub-index">02</span>
          <span className="hub-title">VALORANT // PROTOCOL</span>
        </Link>
      </nav>
    </main>
  );
}

function RouteFallback() {
  return <div className="hub-fallback">Loading</div>;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/sekiro/*" element={<SekiroPortfolio />} />
          <Route path="/valorant" element={<ValorantPortfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
