import { memo, useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const PARTICLE_COUNT = 45;
const EMBER_CHANCE = 0.15;

type AshParticle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  isEmber: boolean;
  opacity: number;
};

const KANJI_WATERMARKS = [
  { char: '忍', top: '11%', left: '7%', size: 'clamp(6rem, 14vw, 11rem)', speed: 0.32 },
  { char: '狼', top: '56%', left: '74%', size: 'clamp(5rem, 12vw, 9.5rem)', speed: 0.58 },
  { char: '死', top: '26%', left: '80%', size: 'clamp(7rem, 16vw, 12rem)', speed: 0.24 },
  { char: '影', top: '68%', left: '16%', size: 'clamp(5.5rem, 13vw, 10rem)', speed: 0.46 },
] as const;

function KanjiWatermark({
  character,
  top,
  left,
  fontSize,
  parallaxSpeed,
  scrollProgress,
}: {
  character: string;
  top: string;
  left: string;
  fontSize: string;
  parallaxSpeed: number;
  scrollProgress: MotionValue<number>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const y = useTransform(scrollProgress, [0, 1], [0, -180 * parallaxSpeed]);

  return (
    <motion.span
      className="atmosphere-kanji pointer-events-none absolute select-none leading-none"
      style={{
        top,
        left,
        fontSize,
        y: prefersReducedMotion ? 0 : y,
      }}
      aria-hidden="true"
    >
      {character}
    </motion.span>
  );
}

function createParticle(width: number, height: number): AshParticle {
  const isEmber = Math.random() < EMBER_CHANCE;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: isEmber ? 3 + Math.random() * 2 : 0.55 + Math.random() * 1.35,
    speed: 0.12 + Math.random() * 0.32,
    drift: 0.18 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    isEmber,
    opacity: 0.14 + Math.random() * 0.34,
  };
}

function resetParticle(particle: AshParticle, width: number, height: number) {
  const isEmber = Math.random() < EMBER_CHANCE;

  particle.x = Math.random() * width;
  particle.y = height + Math.random() * 24;
  particle.size = isEmber ? 3 + Math.random() * 2 : 0.55 + Math.random() * 1.35;
  particle.speed = 0.12 + Math.random() * 0.32;
  particle.drift = 0.18 + Math.random() * 0.55;
  particle.phase = Math.random() * Math.PI * 2;
  particle.isEmber = isEmber;
  particle.opacity = 0.14 + Math.random() * 0.34;
}

function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<AshParticle[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const panelScrollProgress = useMotionValue(0);
  const scrollProgress = useTransform(
    [scrollYProgress, panelScrollProgress],
    ([windowProgress, panelProgress]) => Math.max(Number(windowProgress ?? 0), Number(panelProgress ?? 0)),
  );

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest('.portfolio-app')) return;

      const maxScroll = target.scrollHeight - target.clientHeight;
      if (maxScroll <= 0) return;

      panelScrollProgress.set(target.scrollTop / maxScroll);
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', handleScroll, { capture: true });
  }, [panelScrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame = 0;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width === 0 || height === 0) return;

      const previous = dimensionsRef.current;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height));
        dimensionsRef.current = { width, height };
        return;
      }

      const widthRatio = width / Math.max(previous.width, 1);
      const heightRatio = height / Math.max(previous.height, 1);

      for (const particle of particlesRef.current) {
        particle.x *= widthRatio;
        particle.y *= heightRatio;
      }

      dimensionsRef.current = { width, height };
    };

    const drawAsh = (time: number) => {
      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        resizeCanvas();
        animationFrame = window.requestAnimationFrame(drawAsh);
        return;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particlesRef.current) {
        const waver = Math.sin(time * 0.0011 + particle.phase) * 14 * particle.drift;
        particle.y -= particle.speed;
        particle.x += waver * 0.018;

        if (particle.y < -6) {
          resetParticle(particle, width, height);
        }

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

        if (particle.isEmber) {
          ctx.fillStyle = 'rgba(255, 69, 0, 1)';
          ctx.shadowColor = 'rgba(255, 69, 0, 0.9)';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(132, 128, 118, ${particle.opacity * 0.42})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrame = window.requestAnimationFrame(drawAsh);
    };

    const syncCanvasSize = () => {
      resizeCanvas();
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize, { passive: true });
    window.addEventListener('orientationchange', syncCanvasSize, { passive: true });

    if (prefersReducedMotion) {
      drawAsh(0);
      animationFrame = 0;
    } else {
      animationFrame = window.requestAnimationFrame(drawAsh);
    }

    return () => {
      window.removeEventListener('resize', syncCanvasSize);
      window.removeEventListener('orientationchange', syncCanvasSize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 overflow-hidden">
        {KANJI_WATERMARKS.map((mark) => (
          <KanjiWatermark
            key={mark.char}
            character={mark.char}
            top={mark.top}
            left={mark.left}
            fontSize={mark.size}
            parallaxSpeed={mark.speed}
            scrollProgress={scrollProgress}
          />
        ))}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

export default memo(Atmosphere);
