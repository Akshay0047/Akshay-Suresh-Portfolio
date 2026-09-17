import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type ModelViewerProgressEvent = Event & {
  detail?: {
    totalProgress?: number;
  };
};

type ModelViewerElement = HTMLElement & {
  loaded?: boolean;
};

type KunaiModelContextValue = {
  /** 0–100, mirrors @react-three/drei useProgress().progress for model-viewer. */
  progress: number;
  /** Current 3D asset path being processed (drei useProgress().item equivalent). */
  item: string;
  /** Loaded units out of total (0–100 scale for model-viewer). */
  loaded: number;
  /** Total units (100 for percentage-based model-viewer progress). */
  total: number;
  /** True once the mounted kunai model-viewer fires its load event. */
  ready: boolean;
  bindModelViewer: (element: ModelViewerElement | null) => void;
};

const KunaiModelContext = createContext<KunaiModelContextValue | null>(null);

export function KunaiModelProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [item, setItem] = useState('');
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const total = 100;

  const bindModelViewer = useCallback((element: ModelViewerElement | null) => {
    if (!element) return;

    const src = element.getAttribute('src') ?? 'kunai.glb';
    setItem(src);

    const handleProgress = (event: ModelViewerProgressEvent) => {
      const totalProgress = event.detail?.totalProgress;
      if (typeof totalProgress === 'number') {
        const percent = Math.min(100, Math.round(totalProgress * 100));
        setProgress(percent);
        setLoaded(percent);
      }
    };

    const handleLoad = () => {
      setProgress(100);
      setLoaded(100);
      setReady(true);
      console.log(`[3D Asset Loading]: ${src} complete (100/100)`);
    };

    element.addEventListener('progress', handleProgress as EventListener);
    element.addEventListener('load', handleLoad);

    if (element.loaded) {
      handleLoad();
    }

    return () => {
      element.removeEventListener('progress', handleProgress as EventListener);
      element.removeEventListener('load', handleLoad);
    };
  }, []);

  const value = useMemo(
    () => ({
      progress,
      item,
      loaded,
      total,
      ready,
      bindModelViewer,
    }),
    [bindModelViewer, item, loaded, progress, ready, total],
  );

  return <KunaiModelContext.Provider value={value}>{children}</KunaiModelContext.Provider>;
}

/** model-viewer equivalent of drei's useProgress for the kunai GLB. */
export function useKunaiModelProgress() {
  const context = useContext(KunaiModelContext);
  if (!context) {
    throw new Error('useKunaiModelProgress must be used within KunaiModelProvider');
  }
  return context;
}
