import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { preloadSoundAssets } from '@/components/sound-context';
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
  const [progress, setProgress] = useState(0);
  const [isStriking, setIsStriking] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  const strikingRef = useRef(false);
  const assetsReadyRef = useRef(false);

  useEffect(() => {
    preloadSoundAssets();
  }, []);

  useEffect(() => {
    let mounted = true;

    const scheduleExit = () => {
      if (!mounted || strikingRef.current) return;
      assetsReadyRef.current = true;
      setProgress(100);
      setCanEnter(true);
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
    };
  }, []);

  const displayProgress = Math.min(100, Math.round(progress));

  const handleEnter = () => {
    if (!canEnter || strikingRef.current || !assetsReadyRef.current) return;
    onEnter?.();
    strikingRef.current = true;
    setIsStriking(true);
    window.setTimeout(() => setProgress(100), 260);
    window.setTimeout(() => onComplete(), 430);
  };

  return (
    <motion.div
      className={`loading-screen fixed inset-0 z-[100] ${isStriking ? 'is-striking' : ''} ${canEnter ? 'is-ready' : ''}`}
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
      tabIndex={canEnter ? 0 : -1}
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
        {canEnter && !isStriking && (
          <div className="loading-enter-prompt">CLICK TO ENTER</div>
        )}
      </div>
    </motion.div>
  );
}
