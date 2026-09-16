import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSaveChapter, saveChapters, type SaveChapter } from '@/data/save-chapters';

const PARCHMENT_HEIGHT_SAVE = '600px';
const PARCHMENT_HEIGHT_CHAPTER = 'min(72vh, 760px)';
const ROD_OFFSET_SAVE = '310px';
const ROD_OFFSET_CHAPTER = 'calc(min(36vh, 380px) + 10px)';
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
  const [scrollSession, setScrollSession] = useState(0);

  useEffect(() => {
    if (isOpenSaveMenu) setScrollSession((current) => current + 1);
  }, [isOpenSaveMenu]);

  const handleCloseSaveMenu = useCallback(() => {
    onCloseSaveMenu();
    onCloseScroll();
  }, [onCloseSaveMenu, onCloseScroll]);

  return (
    <AnimatePresence>
      {isOpenSaveMenu && (
        <AncientScroll
          key={`ancient-scroll-${scrollSession}`}
          chapter={chapter ?? null}
          onSelectSave={onSelectSaveFile}
          onReturnToSaveList={onCloseScroll}
          onCloseSaveMenu={handleCloseSaveMenu}
        />
      )}
    </AnimatePresence>
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
            <span className="scroll-save-slot-title">{entry.title}</span>
            <span className="scroll-save-slot-meta">
              {entry.status} — {entry.year}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ChapterDetails({ chapter }: { chapter: SaveChapter }) {
  return (
    <motion.div
      className="scroll-chapter-details w-full"
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="custom-scroll my-2 max-h-[55vh] w-full overflow-y-auto pr-3">
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
      </div>
    </motion.div>
  );
}

function AncientScroll({
  chapter,
  onSelectSave,
  onReturnToSaveList,
  onCloseSaveMenu,
}: {
  chapter: SaveChapter | null;
  onSelectSave: (id: string) => void;
  onReturnToSaveList: () => void;
  onCloseSaveMenu: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [isUnfurled, setIsUnfurled] = useState(false);
  const rollTimeoutRef = useRef<number | null>(null);
  const reunfurlTimeoutRef = useRef<number | null>(null);

  const clearRollTimers = useCallback(() => {
    if (rollTimeoutRef.current !== null) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    if (reunfurlTimeoutRef.current !== null) {
      window.clearTimeout(reunfurlTimeoutRef.current);
      reunfurlTimeoutRef.current = null;
    }
  }, []);

  const triggerUnfurl = useCallback(() => {
    if (prefersReducedMotion) {
      setIsUnfurled(true);
      return;
    }

    setIsUnfurled(false);
    reunfurlTimeoutRef.current = window.setTimeout(() => {
      reunfurlTimeoutRef.current = null;
      window.requestAnimationFrame(() => setIsUnfurled(true));
    }, 32);
  }, [prefersReducedMotion]);

  useEffect(() => {
    triggerUnfurl();
    return clearRollTimers;
  }, [clearRollTimers, triggerUnfurl]);

  const rollUp = useCallback(
    (onComplete: () => void) => {
      clearRollTimers();

      if (prefersReducedMotion) {
        onComplete();
        return;
      }

      setIsUnfurled(false);
      rollTimeoutRef.current = window.setTimeout(() => {
        rollTimeoutRef.current = null;
        onComplete();
      }, ROLL_DURATION * 1000);
    },
    [clearRollTimers, prefersReducedMotion],
  );

  const handleSeal = () => {
    if (chapter) {
      rollUp(() => {
        onReturnToSaveList();
        triggerUnfurl();
      });
      return;
    }

    rollUp(onCloseSaveMenu);
  };

  const handleDismiss = () => {
    rollUp(onCloseSaveMenu);
  };

  const rollTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : { duration: ROLL_DURATION, ease: [0.22, 1, 0.36, 1] as const };

  const parchmentHeight = chapter ? PARCHMENT_HEIGHT_CHAPTER : PARCHMENT_HEIGHT_SAVE;
  const rodOffset = chapter ? ROD_OFFSET_CHAPTER : ROD_OFFSET_SAVE;

  return (
    <motion.div
      className="scroll-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Load profile scroll"
    >
      <div
        className={`scroll-assembly-vertical mx-auto w-[90%] max-w-[750px] ${chapter ? 'is-chapter-mode' : 'is-save-mode'}`}
        onClick={(event) => event.stopPropagation()}
      >
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
            height: isUnfurled ? parchmentHeight : 0,
            opacity: isUnfurled ? 1 : 0,
          }}
          transition={rollTransition}
          style={{ pointerEvents: isUnfurled ? 'auto' : 'none' }}
        >
          <div
            className={`ancient-scroll-inner flex flex-col items-center ${
              chapter ? 'is-chapter-mode' : 'is-save-mode'
            }`}
          >
            <WaxSealButton
              label={chapter ? 'Roll up chapter' : 'Roll up scroll'}
              onClick={handleSeal}
            />

            <div
              className={
                chapter
                  ? 'ancient-scroll-content is-chapter overflow-hidden'
                  : 'ancient-scroll-content is-save-list overflow-hidden'
              }
            >
              <AnimatePresence mode="wait">
                {chapter ? (
                  <ChapterDetails key={chapter.id} chapter={chapter} />
                ) : (
                  <motion.div
                    key="save-list"
                    className="scroll-save-list-wrap"
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
