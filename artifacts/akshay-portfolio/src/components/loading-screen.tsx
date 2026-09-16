import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const EXIT_BUFFER_MS = 360;

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isStriking, setIsStriking] = useState(false);
  const strikingRef = useRef(false);
  const assetsReadyRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const completionTimers: number[] = [];

    const startStrike = () => {
      if (!mounted || strikingRef.current || !assetsReadyRef.current) return;

      strikingRef.current = true;
      setIsStriking(true);
      completionTimers.push(window.setTimeout(() => mounted && setProgress(100), 260));
      completionTimers.push(window.setTimeout(() => mounted && onComplete(), 430));
    };

    const scheduleExit = () => {
      if (!mounted || strikingRef.current) return;
      assetsReadyRef.current = true;
      setProgress(100);
      completionTimers.push(window.setTimeout(() => mounted && startStrike(), EXIT_BUFFER_MS));
    };

    preloadCoreAssets((percent) => {
      if (!mounted) return;
      setProgress(percent);
    })
      .then(() => {
        if (!mounted) return;
        scheduleExit();
      })
      .catch((error) => {
        console.error('[preload] Asset preload failed:', error);
        if (!mounted) return;
        scheduleExit();
      });

    return () => {
      mounted = false;
      completionTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onComplete]);

  const displayProgress = Math.min(100, Math.round(progress));

  return (
    <motion.div
      className={`loading-screen fixed inset-0 z-[100] ${isStriking ? 'is-striking' : ''}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      aria-label="Loading portfolio"
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
          <span>{String(displayProgress).padStart(3, '0')}%</span>
        </div>
        <div className="loading-track">
          <motion.div
            className="loading-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: displayProgress / 100 }}
            transition={{ duration: 0.12, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
