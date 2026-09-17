import '@google/model-viewer';
import { motion } from 'framer-motion';
import { CircleDot, Code2, Crosshair, Database, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useKunaiModelProgress } from '@/components/kunai-model-context';
import { preloadKunaiModel } from '@/lib/preload-assets';

const assetBase = import.meta.env.BASE_URL.replace(/\/$/, '');
const portraitSrc = `${assetBase}/portrait.webp`;
export const kunaiSrc = `${assetBase}/kunai.glb`;

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

function ProstheticToolCard({ modelRef }: { modelRef: RefObject<HTMLElement | null> }) {
  return (
    <article className="prosthetic-tool-card relative flex h-full w-full flex-col overflow-hidden border border-[#4a3b2c] bg-[#141210]/90 p-3 shadow-[inset_0_1px_0_rgba(212,178,140,0.06),0_12px_32px_rgba(0,0,0,0.35)]">
      <span className="prosthetic-corner prosthetic-corner-tl" aria-hidden="true" />
      <span className="prosthetic-corner prosthetic-corner-tr" aria-hidden="true" />
      <span className="prosthetic-corner prosthetic-corner-bl" aria-hidden="true" />
      <span className="prosthetic-corner prosthetic-corner-br" aria-hidden="true" />

      <header className="shrink-0 border-b border-[rgba(74,59,44,0.45)] pb-2">
        <span className="text-[6px] tracking-[0.14em] text-[var(--amber-bright)]">[PROSTHETIC TOOL / 03]</span>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="grid size-[24px] shrink-0 place-items-center border border-[rgba(190,176,148,0.28)] bg-[rgba(20,18,16,0.85)] text-[#e5a06b] [transform:rotate(45deg)]">
            <Crosshair size={12} strokeWidth={1.35} className="[transform:rotate(-45deg)]" />
          </span>
          <h2 className="font-[family-name:var(--app-font-serif)] text-[15px] font-semibold leading-none tracking-[0.03em] text-[var(--paper-bright)]">
            KUNAI OF FOCUS
          </h2>
        </div>
      </header>

      <div className="prosthetic-viewport relative my-1.5 h-[140px] w-full shrink-0 overflow-hidden border border-[rgba(74,59,44,0.55)] bg-[rgba(8,7,6,0.72)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(213,155,88,0.08),transparent_58%)]" aria-hidden="true" />
        <model-viewer
          ref={modelRef}
          src={kunaiSrc}
          shadow-intensity="1"
          interaction-prompt="none"
          camera-orbit="-45deg 55deg auto"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        />
      </div>

      <footer className="shrink-0 space-y-1.5">
        <p className="line-clamp-2 text-[7px] leading-snug text-[#a49b8b]">
          A heavy iron-forged shinobi blade used to puncture complex backend bottlenecks.
        </p>
        <div className="flex items-center justify-between gap-2 border-t border-[rgba(74,59,44,0.35)] pt-1.5 text-[6px] tracking-[0.1em] text-[#8f8678]">
          <span><strong className="text-[#d4b28c]">DURABILITY</strong> · 99.9%</span>
          <span><strong className="text-[#d4b28c]">EFFECT</strong> · Sharpness</span>
        </div>
      </footer>
    </article>
  );
}

export function EquipmentPanel() {
  const modelRef = useRef<HTMLElement | null>(null);
  const { bindModelViewer } = useKunaiModelProgress();

  useLayoutEffect(() => {
    const viewer = modelRef.current;
    if (!viewer) return;
    return bindModelViewer(viewer);
  }, [bindModelViewer]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!modelRef.current) return;

      const xPercent = event.clientX / window.innerWidth - 0.5;
      const yPercent = event.clientY / window.innerHeight - 0.5;
      const orbitX = -45 - xPercent * 100;
      const orbitY = 55 - yPercent * 70;

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

      <div className="equipment-loadout-arena absolute inset-0 z-20 h-full w-full pointer-events-none">
        {/* 1. CENTER: The Portrait with Ink Fade Mask */}
        <div className="absolute bottom-[-15px] left-1/2 z-10 origin-bottom -translate-x-1/2 scale-90 overflow-hidden rounded-t-[4rem] pointer-events-auto">
          <img
            src={portraitSrc}
            className="h-[620px] w-[380px] object-cover object-center opacity-65 grayscale contrast-125 sepia-[.3] mix-blend-luminosity"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 22%, black 68%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 22%, black 68%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
              WebkitMaskComposite: 'intersect',
              maskComposite: 'intersect',
            }}
            alt="Portrait"
          />
        </div>

        {/* 2. Four independently positioned loadout cards. */}
        <motion.div
          className="absolute top-[220px] left-[4%] z-30 w-[300px] pointer-events-auto"
        >
          <EquipmentSlot
            slot="PRIMARY ARM"
            title="REACT"
            detail="Component systems and interfaces built to feel immediate, clear, and alive."
            icon={Code2}
            align="right"
          />
        </motion.div>

        <motion.div
          className="absolute bottom-[80px] left-[14%] z-30 w-[300px] pointer-events-auto"
        >
          <EquipmentSlot
            slot="SECONDARY ARM"
            title="PYTHON"
            detail="Automation, AI experiments, and service logic that keeps the experience moving."
            icon={Sparkles}
            align="right"
          />
        </motion.div>

        <motion.div
        className="absolute top-[50px] right-[9%] z-50 w-[280px] pointer-events-auto"
        >
          <ProstheticToolCard modelRef={modelRef} />
        </motion.div>

        <motion.div
          className="absolute bottom-[30px] right-[12%] z-30 w-[340px] pointer-events-auto"
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

// Warm the kunai GLB as soon as this module loads (model-viewer, not R3F useGLTF).
void preloadKunaiModel(kunaiSrc);
