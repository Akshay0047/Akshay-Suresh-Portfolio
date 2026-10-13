import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCameraRig } from './CameraController.jsx';
import SettingsMenu from './SettingsMenu.jsx';
import { useSettingsStore } from '../store/useSettingsStore.js';
import {
  about, arsenalSlots, attackPower, chapters, contact, memories, profile, projects, skillCategories,
} from '../data.js';

export const SECTIONS = [
  { id: 'home', key: '1', label: 'Briefing', tag: 'OVERVIEW' },
  { id: 'projects', key: '2', label: 'Operations', tag: 'NEON // ENTRY DUELIST' },
  { id: 'skills', key: '3', label: 'Arsenal', tag: 'CHAMBER // LOADOUT' },
  { id: 'about', key: '4', label: 'Dossier', tag: 'CYPHER // HEAVEN' },
  { id: 'comms', key: '5', label: 'Comms', tag: 'JETT // BLADE STORM' },
];

const panelMotion = {
  initial: { opacity: 0, x: 40, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 24, filter: 'blur(6px)', transition: { duration: 0.2 } },
};

function PanelHeader({ code, title, kicker }) {
  return (
    <header className="vp-header">
      <span className="vp-code">{code}</span>
      <p className="vp-kicker">{kicker}</p>
      <h2 className="vp-title">{title}</h2>
    </header>
  );
}

function ContactButtons() {
  return (
    <div className="vp-actions">
      <a className="vp-button vp-button-solid" href={`mailto:${profile.email}`}>EMAIL</a>
      <a className="vp-button" href={profile.github} target="_blank" rel="noreferrer">GITHUB</a>
      <a className="vp-button" href={profile.linkedin} target="_blank" rel="noreferrer">LINKEDIN</a>
      <a className="vp-button" href={profile.resume} target="_blank" rel="noopener noreferrer">RESUME</a>
    </div>
  );
}

/* ---------------------------------------------------------------- Briefing */
function HomePanel() {
  return (
    <div className="vp-body vp-home">
      <PanelHeader code="00 // BRIEFING" kicker="INITIATOR // PORTFOLIO" title={profile.name} />
      <p className="vp-role">{profile.role}</p>
      <p className="vp-meta">{profile.location}</p>
      <p className="vp-lead">{about.lead}</p>
      <p className="vp-muted">{about.body}</p>
      <ContactButtons />
      <p className="vp-hint">Pick a sector on the left. Click the Vandal to inspect it.</p>
    </div>
  );
}

/* -------------------------------------------------------------- Operations */
function ProjectsPanel() {
  const [open, setOpen] = useState(0);
  return (
    <div className="vp-body">
      <PanelHeader code="01 // NEON — ENTRY DUELIST" kicker="OPERATIONS // SELECTED WORK" title="Operations" />
      <ul className="vp-list vp-scroll" data-testid="project-list">
        {projects.map((project, index) => (
          <li key={project.index} className={`vp-card ${open === index ? 'is-open' : ''}`}>
            <button type="button" className="vp-card-head" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>
              <span className="vp-card-index">{project.index}</span>
              <span className="vp-card-title">{project.title}</span>
              <span className="vp-card-meta">{project.year} · {project.metric}</span>
            </button>
            {open === index && (
              <div className="vp-card-body">
                <p className="vp-card-type">{project.type}</p>
                <p>{project.description}</p>
                <p className="vp-muted">{project.detail}</p>
                <div className="vp-chips">
                  {project.stack.map((item) => <span key={item}>{item}</span>)}
                </div>
                {project.repoUrl ? (
                  <a className="vp-button vp-button-solid" href={project.repoUrl} target="_blank" rel="noreferrer">VIEW REPOSITORY</a>
                ) : (
                  <a className="vp-button" href={profile.github} target="_blank" rel="noreferrer">MORE ON GITHUB</a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------- Arsenal */
function SkillsPanel() {
  const categories = Object.keys(skillCategories);
  const [active, setActive] = useState(categories[0]);
  const slot = arsenalSlots[active];
  return (
    <div className="vp-body">
      <PanelHeader code="02 // CHAMBER — ARSENAL" kicker="LOADOUT // SKILLS" title="Arsenal" />
      <div className="vp-tabs" role="tablist">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active === category}
            className={active === category ? 'is-active' : ''}
            onClick={() => setActive(category)}
          >
            <small>{arsenalSlots[category]?.slot}</small>
            {category}
            <b>{skillCategories[category].length}</b>
          </button>
        ))}
      </div>
      {slot && (
        <p className="vp-spec">
          <span>{slot.slot} // {slot.weapon}</span> {slot.spec}
        </p>
      )}
      <ul className="vp-skills vp-scroll">
        {skillCategories[active].map((skill, index) => (
          <li key={`${active}-${skill.name}`}>
            <div className="vp-skill-row">
              <span>{skill.name}</span>
              <span className="vp-muted">{skill.note}</span>
              <b>{skill.value}</b>
            </div>
            <div className="vp-bar">
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: `${skill.value}%` }}
                transition={{ duration: 0.7, delay: index * 0.025, ease: 'easeOut' }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="vp-callout">{attackPower.label} <b>{attackPower.value}</b></p>
    </div>
  );
}

/* ----------------------------------------------------------------- Dossier */
function AboutPanel() {
  return (
    <div className="vp-body">
      <PanelHeader code="03 // CYPHER — HEAVEN ANCHOR" kicker={about.kicker} title={about.headline} />
      <div className="vp-scroll vp-about" data-testid="dossier-scroll">
        <p className="vp-lead">{about.lead}</p>
        <p>{about.body}</p>
        <dl className="vp-facts">
          {about.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="vp-subhead">Career chapters</h3>
        {chapters.map((chapter) => (
          <article key={chapter.id} className="vp-chapter">
            <header>
              <span className="vp-time">{chapter.slot} · {chapter.status} · {chapter.year}</span>
              <b>{chapter.title}</b>
            </header>
            <p>{chapter.summary}</p>
            <p className="vp-muted">{chapter.background}</p>
            <ul className="vp-mini">
              {chapter.timeline.map((entry) => (
                <li key={`${entry.date}-${entry.title}`}>
                  <span className="vp-time">{entry.date}</span> <b>{entry.title}</b>
                  <span className="vp-muted"> — {entry.detail}</span>
                </li>
              ))}
            </ul>
            <ul className="vp-mini vp-mini-projects">
              {chapter.projects.map((project) => (
                <li key={project.name}>
                  <b>{project.name}</b> <span className="vp-time">{project.stack}</span>
                  <span className="vp-muted"> — {project.detail}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}

        <h3 className="vp-subhead">Chronicle</h3>
        <ol className="vp-timeline">
          {memories.map((memory) => (
            <li key={`${memory.date}-${memory.title}`}>
              <span className="vp-time">{memory.date} · {memory.category}</span>
              <b>{memory.title}</b>
              <span className="vp-muted">{memory.subtitle}</span>
              {memory.detail && <p>{memory.detail}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Comms */
function CommsPanel() {
  return (
    <div className="vp-body">
      <PanelHeader code="04 // JETT — BLADE STORM" kicker={contact.kicker} title={contact.headline} />
      <p className="vp-lead">{contact.lead}</p>
      <div className="vp-channels">
        {contact.channels.map((channel) => (
          <a key={channel.label} className="vp-channel" href={channel.href}>
            <span>{channel.label}</span>
            <b>{channel.value}</b>
          </a>
        ))}
      </div>
      <ContactButtons />
      <p className="vp-meta">{profile.location} · {profile.origin}</p>
    </div>
  );
}

const PANELS = { home: HomePanel, projects: ProjectsPanel, skills: SkillsPanel, about: AboutPanel, comms: CommsPanel };

export default function ValorantHUD({ ready }) {
  const { section, settled, goTo } = useCameraRig();
  const [glitchKey, setGlitchKey] = useState(0);
  const settingsOpen = useSettingsStore((state) => state.settingsOpen);

  // Glitch flash whenever the camera starts a new flight.
  useEffect(() => {
    setGlitchKey((value) => value + 1);
  }, [section]);

  useEffect(() => {
    if (!ready) return undefined;
    const onKey = (event) => {
      if (useSettingsStore.getState().settingsOpen) return;
      const match = SECTIONS.find((item) => item.key === event.key);
      if (match) goTo(match.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, ready]);

  if (!ready) return null;

  const ActivePanel = PANELS[section];

  return (
    <div className="vh-root" data-testid="valorant-hud">
      <div className="vh-scanlines" aria-hidden="true" />
      <div className="vh-vignette" aria-hidden="true" />
      {glitchKey > 1 && <div key={glitchKey} className="vh-glitch" aria-hidden="true" />}

      <div className="vh-brand">
        <span>AKSHAY SURESH</span>
        <small>// PROTOCOL</small>
      </div>

      <nav className="vh-menu" aria-label="Sections">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`vh-menu-button ${section === item.id ? 'is-active' : ''}`}
            onClick={() => goTo(item.id)}
            data-section={item.id}
          >
            <span className="vh-menu-key">{item.key}</span>
            <span className="vh-menu-label">{item.label}</span>
            <span className="vh-menu-tag">{item.tag}</span>
          </button>
        ))}
        <Link className="vh-back" to="/">&larr; EXIT TO HUB</Link>
      </nav>

      <AnimatePresence mode="wait">
        {settled && (
          <motion.aside key={section} className="vh-panel" data-testid="valorant-panel" data-section={section} {...panelMotion}>
            <ActivePanel />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="vh-status" aria-live="polite">
        {settled ? `LOCKED // ${SECTIONS.find((item) => item.id === section)?.tag}` : 'REPOSITIONING...'}
      </div>

      <button
        type="button"
        className="vh-gear"
        aria-label="Open settings"
        data-testid="settings-gear"
        onClick={() => useSettingsStore.getState().openSettings()}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            d="M19.4 13.1a7.6 7.6 0 0 0 .05-2.2l1.85-1.15-1.9-3.3-2.15.55a7.7 7.7 0 0 0-1.9-1.1L14.8 3.4h-3.6l-.55 2.5a7.7 7.7 0 0 0-1.9 1.1l-2.15-.55-1.9 3.3L6.55 10.9a7.6 7.6 0 0 0 0 2.2l-1.85 1.15 1.9 3.3 2.15-.55c.56.46 1.2.84 1.9 1.1l.55 2.5h3.6l.55-2.5c.7-.26 1.34-.64 1.9-1.1l2.15.55 1.9-3.3-1.85-1.15Z"
          />
        </svg>
      </button>

      {settingsOpen && <SettingsMenu />}
    </div>
  );
}
