import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { getSaveChapter, saveChapters, type SaveChapter } from '@/data/save-chapters';

const PARCHMENT_HEIGHT = 'min(72vh, 760px)';
const ROLL_DURATION = 0.88;

type LoadProfileExperienceProps = {
  isOpenSaveMenu: boolean;
  selectedSaveFile: string | null;
  onCloseSaveMenu: () => void;
  onSelectSaveFile: (id: string) => void;
  onCloseScroll: () => void;
};

export function LoadProfileExperience({
  isOpenSaveMenu,
  selectedSaveFile,
  onCloseSaveMenu,
  onSelectSaveFile,
  onCloseScroll,
}: LoadProfileExperienceProps) {
  const chapter = selectedSaveFile ? getSaveChapter(selectedSaveFile) : null;

  return (
    <AnimatePresence>
      {isOpenSaveMenu && (
        <AncientScroll
          key="ancient-scroll"
          chapter={chapter ?? null}
          onSelectSave={onSelectSaveFile}
          onSeal={() => {
            if (chapter) onCloseScroll();
            else onCloseSaveMenu();
          }}
          onCloseAll={onCloseSaveMenu}
        />
      )}
    </AnimatePresence>
  );
}

function ScrollEmbers() {
  const embers = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${(index * 19 + 8) % 100}%`,
        top: `${(index * 31 + 12) % 100}%`,
        delay: `${(index % 6) * 0.45}s`,
        duration: `${4 + (index % 4)}s`,
        size: index % 4 === 0 ? 3 : 2,
      })),
    [],
  );

  return (
    <div className="scroll-embers" aria-hidden="true">
      {embers.map((ember, index) => (
        <span
          key={`scroll-ember-${index}`}
          className="scroll-ember"
          style={{
            left: ember.left,
            top: ember.top,
            width: ember.size,
            height: ember.size,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
          }}
        />
      ))}
    </div>
  );
}

function HorizontalRod({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div className={`scroll-rod-h scroll-rod-h-${position}`} aria-hidden="true">
      <span className="scroll-rod-h-cap scroll-rod-h-cap-left" />
      <span className="scroll-rod-h-ring scroll-rod-h-ring-left" />
      <span className="scroll-rod-h-ring scroll-rod-h-ring-center" />
      <span className="scroll-rod-h-ring scroll-rod-h-ring-right" />
      <span className="scroll-rod-h-cap scroll-rod-h-cap-right" />
    </div>
  );
}

function WaxSealButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="scroll-wax-seal" onClick={onClick} aria-label={label}>
      <span className="scroll-wax-seal-face" aria-hidden="true">
        <span className="scroll-wax-seal-mark">忍者</span>
      </span>
      <span className="scroll-wax-seal-label">{label}</span>
    </button>
  );
}

function SaveSlotList({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="scroll-save-list">
      <header className="scroll-content-header">
        <span className="scroll-content-kicker">LOAD PROFILE / SAVE DATA</span>
        <h2 className="scroll-content-title">Choose Your Chapter</h2>
        <p className="scroll-content-lead">Select a save file inscribed upon the scroll.</p>
      </header>

      <div className="scroll-save-slots">
        {saveChapters.map((entry, index) => (
          <motion.button
            key={entry.id}
            type="button"
            className="scroll-save-slot"
            onClick={() => onSelect(entry.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + index * 0.08, duration: 0.35, ease: 'easeOut' }}
          >
            <span className="scroll-save-slot-index">[{entry.slot}]</span>
            <span className="scroll-save-slot-copy">
              <span className="scroll-save-slot-title">{entry.title}</span>
              <span className="scroll-save-slot-meta">
                {entry.status} — {entry.year}
              </span>
            </span>
            <span className="scroll-save-slot-arrow" aria-hidden="true">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ChapterDetails({ chapter }: { chapter: SaveChapter }) {
  return (
    <motion.div
      className="scroll-chapter-details"
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <header className="scroll-content-header">
        <span className="scroll-content-kicker">{chapter.slot} / {chapter.status}</span>
        <h2 className="scroll-content-title">{chapter.title}</h2>
        <p className="scroll-content-lead">{chapter.year}</p>
      </header>

      <p className="scroll-chapter-summary">{chapter.summary}</p>
      <p className="scroll-chapter-background">{chapter.background}</p>

      <section className="scroll-chapter-section">
        <h3>CHRONICLE</h3>
        <ul className="scroll-chapter-timeline">
          {chapter.timeline.map((entry) => (
            <li key={`${entry.date}-${entry.title}`}>
              <span>{entry.date}</span>
              <strong>{entry.title}</strong>
              <p>{entry.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="scroll-chapter-section">
        <h3>ARMAMENTS / PROJECTS</h3>
        <ul className="scroll-chapter-projects">
          {chapter.projects.map((project) => (
            <li key={project.name}>
              <div className="scroll-project-head">
                <strong>{project.name}</strong>
                <span>{project.stack}</span>
              </div>
              <p>{project.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </motion.div>
  );
}

function AncientScroll({
  chapter,
  onSelectSave,
  onSeal,
  onCloseAll,
}: {
  chapter: SaveChapter | null;
  onSelectSave: (id: string) => void;
  onSeal: () => void;
  onCloseAll: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [isUnfurled, setIsUnfurled] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const frame = window.requestAnimationFrame(() => setIsUnfurled(true));
    return () => window.cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const handleSeal = () => {
    if (prefersReducedMotion) {
      onSeal();
      return;
    }

    setIsUnfurled(false);
    window.setTimeout(onSeal, ROLL_DURATION * 1000);
  };

  const rollTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : { duration: ROLL_DURATION, ease: [0.22, 1, 0.36, 1] as const };

  const rodOffset = 'calc(min(36vh, 380px) + 10px)';

  return (
    <motion.div
      className="scroll-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onCloseAll}
      role="dialog"
      aria-modal="true"
      aria-label="Load profile scroll"
    >
      <ScrollEmbers />

      <div className="scroll-assembly-vertical" onClick={(event) => event.stopPropagation()}>
        <motion.div
          className="scroll-rod-h-wrap scroll-rod-h-wrap-top"
          initial={{ y: 0 }}
          animate={{ y: isUnfurled ? `calc(-1 * ${rodOffset})` : 0 }}
          transition={rollTransition}
        >
          <HorizontalRod position="top" />
        </motion.div>

        <motion.article
          className="ancient-scroll-parchment"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isUnfurled ? PARCHMENT_HEIGHT : 0,
            opacity: isUnfurled ? 1 : 0,
          }}
          transition={rollTransition}
          style={{ pointerEvents: isUnfurled ? 'auto' : 'none' }}
        >
          <div className="ancient-scroll-burn ancient-scroll-burn-top" aria-hidden="true" />
          <div className="ancient-scroll-burn ancient-scroll-burn-bottom" aria-hidden="true" />
          <div className="ancient-scroll-vignette" aria-hidden="true" />
          <div className="ancient-scroll-grain" aria-hidden="true" />

          <div className="ancient-scroll-inner">
            <WaxSealButton
              label={chapter ? 'Roll up chapter' : 'Roll up scroll'}
              onClick={handleSeal}
            />

            <div className="ancient-scroll-content">
              <AnimatePresence mode="wait">
                {chapter ? (
                  <ChapterDetails key={chapter.id} chapter={chapter} />
                ) : (
                  <motion.div
                    key="save-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SaveSlotList onSelect={onSelectSave} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <WaxSealButton
              label={chapter ? 'Seal & return to saves' : 'Seal & return to menu'}
              onClick={handleSeal}
            />
          </div>
        </motion.article>

        <motion.div
          className="scroll-rod-h-wrap scroll-rod-h-wrap-bottom"
          initial={{ y: 0 }}
          animate={{ y: isUnfurled ? rodOffset : 0 }}
          transition={rollTransition}
        >
          <HorizontalRod position="bottom" />
        </motion.div>
      </div>
    </motion.div>
  );
}
