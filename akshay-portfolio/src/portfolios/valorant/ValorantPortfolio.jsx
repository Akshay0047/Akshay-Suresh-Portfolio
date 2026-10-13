import { useCallback, useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import ValorantScene from './components/ValorantScene.jsx';
import ValorantHUD from './components/ValorantHUD.jsx';
import ValorantCursor from './components/ValorantCursor.jsx';
import { CameraRigProvider, useCameraRig } from './components/CameraController.jsx';
import './styles/valorant.css';

function Experience() {
  const rig = useCameraRig();
  const { progress, active } = useProgress();
  const [ready, setReady] = useState(false);
  const [shadersReady, setShadersReady] = useState(false);
  const onShadersReady = useCallback(() => setShadersReady(true), []);
  const assetsReady = progress >= 100 && !active;

  // The section buttons stay hidden until every material program, including the
  // shadow variant, has been compiled. Otherwise each mesh hitches as the camera arrives.
  useEffect(() => {
    if (!assetsReady || !shadersReady) return undefined;
    const id = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(id);
  }, [assetsReady, shadersReady]);

  return (
    <div className="valorant-root" data-ready={ready}>
      <ValorantScene rig={rig} onShadersReady={onShadersReady} />
      <ValorantHUD ready={ready} />
      <ValorantCursor />
      {!ready && (
        <div className="vl-boot" role="status" aria-live="polite">
          <div className="vl-loader">
            <strong>Loading Protocol</strong>
            <div className="vl-loader-track">
              <i style={{ width: `${progress >= 100 ? 100 : Math.round(progress)}%` }} />
            </div>
            <small>{progress >= 100 ? 'Compiling shaders' : `${Math.round(progress)}%`}</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ValorantPortfolio() {
  return (
    <CameraRigProvider>
      <Experience />
    </CameraRigProvider>
  );
}
