import { create } from 'zustand';

/** Scene environment intensity for each graphics preset. There are no LOD meshes. */
export const QUALITY_ENV = { low: 0.28, med: 0.48, high: 0.72 };

/** Shadow map edge length for each graphics preset. */
export const QUALITY_SHADOW_MAP = { low: 1024, med: 1536, high: 2048 };

const QUALITIES = new Set(['low', 'med', 'high']);

function clampScale(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(1.5, Math.max(0.5, number));
}

export const useSettingsStore = create((set) => ({
  graphicsQuality: 'high',
  shadowsEnabled: true,
  bloomEnabled: false,
  resolutionScale: 1.5,
  settingsOpen: false,
  setGraphicsQuality: (graphicsQuality) => {
    if (!QUALITIES.has(graphicsQuality)) return;
    set({ graphicsQuality });
  },
  setShadowsEnabled: (shadowsEnabled) => set({ shadowsEnabled: Boolean(shadowsEnabled) }),
  setBloomEnabled: (bloomEnabled) => set({ bloomEnabled: Boolean(bloomEnabled) }),
  setResolutionScale: (resolutionScale) => set({ resolutionScale: clampScale(resolutionScale) }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
