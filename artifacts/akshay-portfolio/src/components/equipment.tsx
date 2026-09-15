import '@google/model-viewer';
import { motion, useReducedMotion } from 'framer-motion';
import { CircleDot, Code2, Database, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');
const portraitSrc = `${assetBase}/portrait.jpg`;
const kunaiSrc = `${assetBase}/kunai.glb`;

type LoadoutSlot = {
  slot: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  align: 'left' | 'right';
};

function EquipmentSlot({
  slot,
  title,
  detail,
  icon: Icon,
  align,
}: LoadoutSlot) {
  const isLeftWing = align === 'right';

  return (
    <article
      className={[
        'equipment-slot group relative grid min-h-[108px] gap-3 rounded-none border border-[rgba(194,181,153,0.12)] bg-[rgba(16,15,13,0.92)] p-4 transition-all duration-200 ease-out',
        isLeftWing
          ? 'grid-cols-[1fr_40px] border-r-2 border-r-[rgba(94,89,79,0.85)] text-right hover:-translate-x-2 hover:border-r-[#d59b58] hover:bg-[rgba(24,22,19,0.96)]'
          : 'grid-cols-[40px_1fr] border-l-2 border-l-[rgba(94,89,79,0.85)] text-left hover:translate-x-2 hover:border-l-[#d59b58] hover:bg-[rgba(24,22,19,0.96)]',
      ].join(' ')}
    >
      <div
        className={[
          'absolute top-2.5 inline-flex items-center gap-1.5 text-[6px] tracking-[0.16em] text-[rgba(213,155,88,0.88)]',
          isLeftWing ? 'left-3' : 'right-3',
        ].join(' ')}
        aria-hidden="true"
      >
        <span className="size-[5px] rounded-full bg-[#e5a06b] shadow-[0_0_8px_rgba(229,160,107,0.95)]" />
        <span>EQUIPPED</span>
      </div>

      {isLeftWing ? (
        <>
          <div className="min-w-0">
            <span className="text-[7px] tracking-[0.14em] text-[var(--amber-bright)]">{slot}</span>
            <h2 className="mt-1.5 font-[family-name:var(--app-font-serif)] text-[clamp(18px,2vw,28px)] font-semibold leading-[0.95] text-[var(--paper-bright)]">
              {title}
            </h2>
            <p className="mt-2 text-[8px] leading-relaxed text-[#a49b8b]">{detail}</p>
          </div>
          <div className="ml-auto grid size-[34px] place-items-center border border-[rgba(190,176,148,0.24)] text-[var(--amber-pale)] [transform:rotate(45deg)]">
            <Icon size={18} strokeWidth={1.3} className="[transform:rotate(-45deg)]" />
          </div>
        </>
      ) : (
        <>
          <div className="grid size-[34px] place-items-center border border-[rgba(190,176,148,0.24)] text-[var(--amber-pale)] [transform:rotate(45deg)]">
            <Icon size={18} strokeWidth={1.3} className="[transform:rotate(-45deg)]" />
          </div>
          <div className="min-w-0">
            <span className="text-[7px] tracking-[0.14em] text-[var(--amber-bright)]">{slot}</span>
            <h2 className="mt-1.5 font-[family-name:var(--app-font-serif)] text-[clamp(18px,2vw,28px)] font-semibold leading-[0.95] text-[var(--paper-bright)]">
              {title}
            </h2>
            <p className="mt-2 text-[8px] leading-relaxed text-[#a49b8b]">{detail}</p>
          </div>
        </>
      )}
    </article>
  );
}

export function EquipmentPanel() {
  const modelRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!modelRef.current) return;

      const xPercent = event.clientX / window.innerWidth - 0.5;
      const yPercent = event.clientY / window.innerHeight - 0.5;
      const orbitX = -45 - xPercent * 60;
      const orbitY = 55 - yPercent * 40;

      modelRef.current.setAttribute('camera-orbit', `${orbitX}deg ${orbitY}deg auto`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="content-panel equipment-panel flex min-h-0 flex-col overflow-hidden">
      <div className="panel-topline shrink-0">
        <span>EQUIPMENT / LOADOUT</span>
        <span className="status-dot"><CircleDot size={12} /> EQUIPPED</span>
      </div>

      <div className="panel-title shrink-0">
        <div className="panel-kicker">CURRENT ARMAMENT</div>
        <h1>The<span> arsenal</span></h1>
      </div>

      <div className="relative mx-auto mt-4 flex h-[750px] w-full max-w-[1300px] items-center justify-center overflow-visible">
        {/* 1. CENTER: The Portrait with Ink Fade Mask */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[620px] w-[380px] -translate-x-1/2 -translate-y-1/2">
          <img
            src={portraitSrc}
            className="h-full w-full object-cover object-center opacity-65 grayscale contrast-125 sepia-[.3] mix-blend-luminosity"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 70%, transparent 100%), radial-gradient(circle at 50% 50%, black 50%, transparent 90%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 70%, transparent 100%), radial-gradient(circle at 50% 50%, black 50%, transparent 90%)',
              WebkitMaskComposite: 'intersect',
              maskComposite: 'intersect',
            }}
            alt="Portrait"
          />
        </div>

        {/* 2. TOP RIGHT: The 3D Kunai (Above the right-side cards) */}
        <div className="pointer-events-none absolute top-[-80%] right-[0%] z-30 h-[280px] w-[280px]">
          <model-viewer
            ref={modelRef}
            src={kunaiSrc}
            shadow-intensity="1"
            interaction-prompt="none"
            camera-orbit="-45deg 55deg auto"
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
          />
        </div>

        {/* 3. THE ARC: Floating Equipment Cards (Staggered to form a clean semi-circle) */}

        {/* React (Top Left) */}
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [-8, 8, -8] }}
          transition={prefersReducedMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[12%] left-[2%] z-40 w-[280px] lg:w-[310px]"
        >
          <EquipmentSlot
            slot="PRIMARY ARM"
            title="REACT"
            detail="Component systems and interfaces built to feel immediate, clear, and alive."
            icon={Code2}
            align="right"
          />
        </motion.div>

        {/* Python (Bottom Left - Pushed inward to create the curve) */}
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [-8, 8, -8] }}
          transition={prefersReducedMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-[62%] left-[12%] z-40 w-[280px] lg:w-[310px]"
        >
          <EquipmentSlot
            slot="SECONDARY ARM"
            title="PYTHON"
            detail="Automation, AI experiments, and service logic that keeps the experience moving."
            icon={Sparkles}
            align="right"
          />
        </motion.div>

        {/* Django (Top Right) */}
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [-8, 8, -8] }}
          transition={prefersReducedMotion ? undefined : { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          className="absolute top-[12%] right-[2%] z-40 w-[280px] lg:w-[310px]"
        >
          <EquipmentSlot
            slot="PROSTHETIC TOOL"
            title="DJANGO REST"
            detail="Structured APIs with authentication, permissions, and dependable data flow."
            icon={ShieldCheck}
            align="left"
          />
        </motion.div>

        {/* Databases (Bottom Right - Pushed inward to create the curve) */}
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [-8, 8, -8] }}
          transition={prefersReducedMotion ? undefined : { duration: 4.7, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute top-[62%] right-[12%] z-40 w-[280px] lg:w-[310px]"
        >
          <EquipmentSlot
            slot="CONSUMABLES / DATABASES"
            title="POSTGRESQL · DOCKER · GIT"
            detail="Database persistence, containerized deployments, and disciplined version control."
            icon={Database}
            align="left"
          />
        </motion.div>
      </div>
    </div>
  );
}
