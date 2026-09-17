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
  /** True once the mounted kunai model-viewer fires its load event. */
  ready: boolean;
  bindModelViewer: (element: ModelViewerElement | null) => void;
};

const KunaiModelContext = createContext<KunaiModelContextValue | null>(null);

export function KunaiModelProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const bindModelViewer = useCallback((element: ModelViewerElement | null) => {
    if (!element) return;

    const handleProgress = (event: ModelViewerProgressEvent) => {
      const total = event.detail?.totalProgress;
      if (typeof total === 'number') {
        setProgress(Math.min(100, Math.round(total * 100)));
      }
    };

    const handleLoad = () => {
      setProgress(100);
      setReady(true);
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
      ready,
      bindModelViewer,
    }),
    [bindModelViewer, progress, ready],
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
