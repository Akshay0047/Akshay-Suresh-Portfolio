import { useGLTF } from '@react-three/drei';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import * as THREE from 'three';
import { MODEL_URLS } from './sceneConfig.js';
import { preloadSprinterClip } from './psaClip.js';

// Draco decoder is served locally from /public/draco (copied from three).
useGLTF.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);

// Textures ship as KTX2 (Basis). They stay GPU-compressed (BC7/ASTC/ETC2), about a quarter of the
// memory of RGBA8, and need no CPU image decode. The transcoder is served from /public/basis.
// It gets its own LoadingManager: hundreds of textures finish in the same tick, and routing each one
// through the default manager floods drei's useProgress store ("Maximum update depth exceeded").
const ktx2Loader = new KTX2Loader(new THREE.LoadingManager()).setTranscoderPath(`${import.meta.env.BASE_URL}basis/`);
{
  const probe = new THREE.WebGLRenderer();
  ktx2Loader.detectSupport(probe);
  probe.dispose();
  probe.forceContextLoss();
}

// Dozens of assets can finish in one tick, and drei turns every itemEnd into a synchronous React
// update. Coalesce them so useProgress updates at most every 60 ms.
{
  const manager = THREE.DefaultLoadingManager;
  const forward = manager.onProgress;
  const finish = manager.onLoad;
  let pending = null;
  let timer = 0;
  const flush = () => {
    window.clearTimeout(timer);
    const latest = pending;
    pending = null;
    if (latest) forward?.(...latest);
  };
  manager.onProgress = (...args) => {
    const idle = pending === null;
    pending = args;
    if (idle) timer = window.setTimeout(flush, 60);
  };
  // drei's progress handler marks the store active again, so it must land before onLoad does.
  manager.onLoad = (...args) => {
    flush();
    finish?.(...args);
  };
}

export const extendLoader = (loader) => loader.setKTX2Loader(ktx2Loader);

const unique = (urls) => [...new Set(urls)];

const MAP_URLS = [MODEL_URLS.map];
const ENTRY_URLS = unique([
  MODEL_URLS.agents.neon,
  MODEL_URLS.agents.reyna,
  MODEL_URLS.agents.phoenix,
  MODEL_URLS.weapons.vandal,
]);
const REST_URLS = unique([
  ...Object.values(MODEL_URLS.agents),
  ...Object.values(MODEL_URLS.weapons),
  ...Object.values(MODEL_URLS.props),
  MODEL_URLS.gun,
]).filter((url) => !MAP_URLS.includes(url) && !ENTRY_URLS.includes(url));
const ALL_URLS = unique([...MAP_URLS, ...ENTRY_URLS, ...REST_URLS]);

const inflight = new Map();
const phaseJobs = new Map();

/**
 * useGLTF.preload fills the cache the scene reads, but suspend-react drops the promise.
 * Wrap this load so a phase can wait until the file has actually decoded.
 */
export function preloadValorantAsset(url) {
  const existing = inflight.get(url);
  if (existing) return existing;

  const pending = new Promise((resolve, reject) => {
    let settled = false;
    let started = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve();
    };
    useGLTF.preload(url, true, false, (loader) => {
      extendLoader(loader);
      const load = loader.load.bind(loader);
      loader.load = (resource, onLoad, onProgress, onError) => {
        started = true;
        load(
          resource,
          (data) => {
            finish();
            onLoad(data);
          },
          onProgress,
          (error) => {
            finish(error instanceof Error ? error : new Error(`Could not load ${resource}`));
            onError?.(error);
          },
        );
      };
    });
    queueMicrotask(() => {
      if (!started) finish();
    });
  }).catch((error) => {
    console.error(error);
  });

  inflight.set(url, pending);
  return pending;
}

async function runPool(urls, concurrency) {
  let index = 0;
  const worker = async () => {
    while (index < urls.length) {
      const current = index;
      index += 1;
      await preloadValorantAsset(urls[current]);
    }
  };
  const count = Math.max(1, Math.min(concurrency, urls.length));
  await Promise.all(Array.from({ length: count }, () => worker()));
}

/** `map`, `entry`, and `rest` stay ordered. `all` starts every file at once for a direct visit. */
export function warmValorantAssets(phase) {
  if (phase === 'all') {
    preloadSprinterClip();
    const existing = phaseJobs.get('all');
    if (existing) return existing;
    const job = runPool(ALL_URLS, ALL_URLS.length);
    phaseJobs.set('all', job);
    return job;
  }

  const existing = phaseJobs.get(phase);
  if (existing) return existing;
  const urls = phase === 'map' ? MAP_URLS : phase === 'entry' ? ENTRY_URLS : REST_URLS;
  const job = (async () => {
    if (phase !== 'map') preloadSprinterClip();
    await runPool(urls, phase === 'map' ? 1 : 2);
  })();
  phaseJobs.set(phase, job);
  return job;
}
