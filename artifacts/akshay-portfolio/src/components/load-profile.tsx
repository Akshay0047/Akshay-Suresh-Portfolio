import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollText, X } from 'lucide-react';
import { getSaveChapter, saveChapters, type SaveChapter } from '@/data/save-chapters';

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
      {isOpenSaveMenu && !chapter && (
        <SaveFileMenu
          key="save-menu"
          onSelect={onSelectSaveFile}
          onClose={onCloseSaveMenu}
        />
      )}
      {chapter && (
        <ParchmentScroll
          key={chapter.id}
          chapter={chapter}
          onRollUp={onCloseScroll}
        />
      )}
    </AnimatePresence>
  );
}

function SaveFileMenu({
  onSelect,
  onClose,
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="save-file-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Load profile save files"
    >
      <motion.div
        className="save-file-menu"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-topline save-file-menu-header">
          <span>LOAD PROFILE / SAVE DATA</span>
          <button type="button" onClick={onClose} aria-label="Close save menu">
            <X size={17} />
          </button>
        </div>

        <p className="save-file-menu-lead">Select a chapter to unfurl the chronicle.</p>

        <div className="save-file-slots">
          {saveChapters.map((chapter, index) => (
            <motion.button
              key={chapter.id}
              type="button"
              className="save-file-slot"
              onClick={() => onSelect(chapter.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + index * 0.08, duration: 0.32 }}
            >
              <span className="save-file-slot-index">[{chapter.slot}]</span>
              <span className="save-file-slot-copy">
                <span className="save-file-slot-title">{chapter.title}</span>
                <span className="save-file-slot-meta">
                  {chapter.status} — {chapter.year}
                </span>
              </span>
              <span className="save-file-slot-arrow" aria-hidden="true">›</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ParchmentScroll({
  chapter,
  onRollUp,
}: {
  chapter: SaveChapter;
  onRollUp: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="parchment-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.title} chronicle`}
    >
      <motion.article
        className="parchment-scroll"
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scaleY: 0.12, clipPath: 'inset(48% 0 48% 0 round 12px)' }
        }
        animate={
          prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 1, scaleY: 1, clipPath: 'inset(0% 0 0% 0 round 12px)' }
        }
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scaleY: 0.08, clipPath: 'inset(50% 0 50% 0 round 12px)' }
        }
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'top center' }}
      >
        <div className="parchment-scroll-edge parchment-scroll-edge-top" aria-hidden="true" />
        <div className="parchment-scroll-body">
          <header className="parchment-scroll-header">
            <div>
              <span className="parchment-scroll-kicker">{chapter.slot} / {chapter.status}</span>
              <h2 className="parchment-scroll-title">{chapter.title}</h2>
              <p className="parchment-scroll-year">{chapter.year}</p>
            </div>
            <button type="button" className="parchment-seal-button" onClick={onRollUp}>
              <ScrollText size={14} />
              <span>ROLL UP / CLOSE</span>
            </button>
          </header>

          <p className="parchment-scroll-summary">{chapter.summary}</p>
          <p className="parchment-scroll-background">{chapter.background}</p>

          <section className="parchment-scroll-section">
            <h3>CHRONICLE</h3>
            <ul className="parchment-timeline">
              {chapter.timeline.map((entry) => (
                <li key={`${entry.date}-${entry.title}`}>
                  <span>{entry.date}</span>
                  <strong>{entry.title}</strong>
                  <p>{entry.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="parchment-scroll-section">
            <h3>ARMAMENTS / PROJECTS</h3>
            <ul className="parchment-projects">
              {chapter.projects.map((project) => (
                <li key={project.name}>
                  <div className="parchment-project-head">
                    <strong>{project.name}</strong>
                    <span>{project.stack}</span>
                  </div>
                  <p>{project.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <button type="button" className="parchment-seal-button parchment-seal-button-bottom" onClick={onRollUp}>
            <ScrollText size={14} />
            <span>SEAL SCROLL & RETURN</span>
          </button>
        </div>
        <div className="parchment-scroll-edge parchment-scroll-edge-bottom" aria-hidden="true" />
      </motion.article>
    </motion.div>
  );
}
