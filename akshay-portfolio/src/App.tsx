import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFound from '@/pages/not-found';
import './hub.css';

// Each experience ships as its own chunk so the landing page, the Sekiro
// styles, and the Valorant scene only load on the route that needs them.
const Landing = lazy(() => import('@/pages/Landing'));
const SekiroPortfolio = lazy(() => import('@/portfolios/sekiro/SekiroPortfolio'));
const ValorantPortfolio = lazy(() => import('@/portfolios/valorant/ValorantPortfolio.jsx'));

function RouteFallback() {
  return <div className="hub-fallback">Loading</div>;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sekiro/*" element={<SekiroPortfolio />} />
          <Route path="/valorant" element={<ValorantPortfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
