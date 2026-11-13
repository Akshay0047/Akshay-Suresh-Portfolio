import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useProgress } from '@react-three/drei';
import ValorantScene from './components/ValorantScene.jsx';
import ValorantHUD from './components/ValorantHUD.jsx';
import ValorantCursor from './components/ValorantCursor.jsx';
import { CameraRigProvider, useCameraRig } from './components/CameraController.jsx';
import { warmValorantAssets } from './assetPreload.js';
import './styles/valorant.css';

// A direct visit still downloads every model immediately. The landing page warms
// the same cache in stages, so these calls reuse anything already decoded.
warmValorantAssets('all');

/*
 * Boot is reported as one bar. Fetching is real progress; the later stages ease toward their cap
 * until the scene reports the next stage, so the bar never sits at 100% while work remains.
 */
const BOOT_STAGES = {
  fetch: { from: 0, to: 50, label: 'Downloading assets' },
  decode: { from: 50, to: 62, label: 'Decoding textures' },
  mounted: { from: 62, to: 72, label: 'Building environment' },
  compiling: { from: 72, to: 90, label: 'Compiling shaders' },
  warming: { from: 90, to: 99, label: 'Uploading to GPU' },
  ready: { from: 100, to: 100, label: 'Ready' },
};

/* Stage lives outside React state so reporting it never re-renders the canvas tree. */
let bootStage = null;
const bootListeners = new Set();
function setBootStage(next) {
  if (bootStage === next) return;
  bootStage = next;
  bootListeners.forEach((listener) => listener());
}
const subscribeBoot = (listener) => {
  bootListeners.add(listener);
  return () => bootListeners.delete(listener);
};

function useBootProgress(assetsProgress, assetsReady, stage) {
  const key = stage ?? (assetsReady ? 'decode' : 'fetch');
  const [value, setValue] = useState(0);
  const entered = useRef({ key, at: performance.now() });
  if (entered.current.key !== key) entered.current = { key, at: performance.now() };

  useEffect(() => {
    const tick = () => {
      const { from, to } = BOOT_STAGES[key];
      const next = key === 'fetch'
        ? from + (to - from) * (assetsProgress / 100)
        : from + (to - from) * (1 - Math.exp(-(performance.now() - entered.current.at) / 2500));
      setValue((current) => Math.max(current, next));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [key, assetsProgress]);

  return { value: key === 'ready' ? 100 : Math.min(value, 99), label: BOOT_STAGES[key].label };
}

function BootOverlay({ progress, assetsReady }) {
  const stage = useSyncExternalStore(subscribeBoot, () => bootStage);
  const boot = useBootProgress(progress, assetsReady, stage);
  return (
    <div className="vl-boot" role="status" aria-live="polite">
      <div className="vl-loader">
        <strong>Loading Protocol</strong>
        <div className="vl-loader-track">
          <i style={{ width: `${boot.value}%` }} />
        </div>
        <small>{Math.round(boot.value)}% // {boot.label}</small>
      </div>
    </div>
  );
}

function Experience() {
  const rig = useCameraRig();
  const { roaming } = rig;
  const { progress, active } = useProgress();
  const [ready, setReady] = useState(false);
  const [shadersReady, setShadersReady] = useState(false);
  const onBootStage = setBootStage;
  const onShadersReady = useCallback(() => {
    setBootStage('ready');
    setShadersReady(true);
  }, []);
  const assetsReady = progress >= 100 && !active;

  useEffect(() => () => setBootStage(null), []);
  // The section buttons stay hidden until every material program, including the
  // shadow variant, has been compiled. Otherwise each mesh hitches as the camera arrives.
  useEffect(() => {
    if (!assetsReady || !shadersReady) return undefined;
    const id = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(id);
  }, [assetsReady, shadersReady]);

  return (
    <div className={`valorant-root${roaming ? ' is-roaming' : ''}`} data-ready={ready} data-roaming={roaming ? 'true' : 'false'}>
      <ValorantScene rig={rig} onShadersReady={onShadersReady} onBootStage={onBootStage} />
      <ValorantHUD ready={ready} />
      <ValorantCursor active={ready} />
      {!ready && <BootOverlay progress={progress} assetsReady={assetsReady} />}
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
