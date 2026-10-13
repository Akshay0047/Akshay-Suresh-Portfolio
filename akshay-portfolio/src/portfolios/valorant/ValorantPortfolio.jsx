import { useEffect, useState } from 'react';
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

  // Reveal the HUD once every GLB has streamed in and the first frame is up.
  useEffect(() => {
    if (progress >= 100 && !active) {
      const id = window.setTimeout(() => setReady(true), 250);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [progress, active]);

  return (
    <div className="valorant-root" data-ready={ready}>
      <ValorantScene rig={rig} />
      <ValorantHUD ready={ready} />
      <ValorantCursor />
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
