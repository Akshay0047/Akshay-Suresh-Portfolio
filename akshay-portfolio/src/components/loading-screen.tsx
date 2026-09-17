import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useKunaiModelProgress } from '@/components/kunai-model-context';
import { preloadCoreAssets } from '@/lib/preload-assets';

function Particles({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        left: `${(index * 37 + 4) % 100}%`,
        top: `${(index * 61 + 7) % 100}%`,
        size: 1 + (index % 3),
        delay: `${(index % 8) * 0.72}s`,
        duration: `${6 + (index % 5)}s`,
      })),
    [count],
  );

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          className="particle"
          key={`particle-${index}`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingScreen({
  onComplete,
  onEnter,
}: {
  onComplete: () => void;
  onEnter?: () => void;
}) {
  const { progress: kunaiProgress } = useKunaiModelProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const strikingRef = useRef(false);

  const isActuallyReady = assetsReady && kunaiProgress >= 100;
  const isHoldingAtCap = displayProgress >= 95 && !isActuallyReady;
  const progressLabel = Math.min(100, Math.round(displayProgress));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= 95) {
          return prev;
        }
        return prev + 1;
      });
    }, 42);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    preloadCoreAssets(() => {
      if (!mounted) return;
    })
      .then(() => {
        if (!mounted) return;
        setAssetsReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setAssetsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!assetsReady || kunaiProgress < 100) return;

    setDisplayProgress(100);

    const timeout = window.setTimeout(() => {
      setLoadingComplete(true);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [assetsReady, kunaiProgress]);

  const handleEnter = () => {
    if (!loadingComplete || strikingRef.current || displayProgress < 100) return;
    onEnter?.();
    strikingRef.current = true;
    setIsStriking(true);
    window.setTimeout(() => onComplete(), 430);
  };

  return (
    <motion.div
      className={`loading-screen fixed inset-0 z-[100] ${isStriking ? 'is-striking' : ''} ${loadingComplete ? 'is-ready' : ''}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      aria-label="Loading portfolio"
      onClick={handleEnter}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleEnter();
        }
      }}
      role="button"
      tabIndex={loadingComplete ? 0 : -1}
    >
      <Particles count={24} />
      <div className="loading-vignette" />
      <div className="loading-ash" aria-hidden="true" />
      <div className="loading-mark">
        <div className="loading-kanji">忍</div>
        <div className="loading-name">AKSHAY SURESH</div>
        <div className="loading-subtitle">SHINOBI / DEVELOPER</div>
      </div>
      <div className="loading-glare" aria-hidden="true" />
      <div className="loading-progress">
        <div className="loading-progress-label">
          <span>INITIALIZING ARCHIVE</span>
          <span>{String(progressLabel).padStart(3, '0')}%</span>
        </div>
        <div className={`loading-track ${isHoldingAtCap ? 'loading-track-pulse' : ''}`}>
          <div
            className={`loading-fill h-full transition-all duration-200 ease-out ${isHoldingAtCap ? 'loading-fill-pulse' : ''}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        {loadingComplete && !isStriking && (
          <div className="loading-enter-prompt">CLICK TO ENTER</div>
        )}
      </div>
    </motion.div>
  );
}
