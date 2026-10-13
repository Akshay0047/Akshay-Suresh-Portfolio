import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCameraRig } from './CameraController.jsx';
import { about, contact, memories, profile, projects, skillCategories } from '../data.js';

export const SECTIONS = [
  { id: 'home', key: '1', label: 'Home', tag: 'OVERVIEW' },
  { id: 'projects', key: '2', label: 'Projects', tag: 'RUSHING AGENT' },
  { id: 'skills', key: '3', label: 'Skills', tag: 'HIGHGROUND AGENT' },
  { id: 'about', key: '4', label: 'About', tag: 'LURKING AGENT' },
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

function HomePanel() {
  return (
    <div className="vp-body vp-home">
      <PanelHeader code="00 // OVERVIEW" kicker="INITIATOR // PORTFOLIO" title={profile.name} />
      <p className="vp-role">{profile.role}</p>
      <p className="vp-meta">{profile.location}</p>
      <p className="vp-lead">{about.lead}</p>
      <div className="vp-actions">
        <a className="vp-button" href={profile.github} target="_blank" rel="noreferrer">GITHUB</a>
        <a className="vp-button" href={profile.linkedin} target="_blank" rel="noreferrer">LINKEDIN</a>
        <a className="vp-button vp-button-solid" href={profile.resume} target="_blank" rel="noopener noreferrer">RESUME</a>
      </div>
      <p className="vp-hint">Pick a sector on the left. Click the Vandal to inspect it.</p>
    </div>
  );
}

function ProjectsPanel() {
  const [open, setOpen] = useState(0);
  return (
    <div className="vp-body">
      <PanelHeader code="01 // RUSHING AGENT" kicker="SELECTED WORK" title="Projects" />
      <ul className="vp-list vp-scroll">
        {projects.map((project, index) => (
          <li key={project.index} className={`vp-card ${open === index ? 'is-open' : ''}`}>
            <button type="button" className="vp-card-head" onClick={() => setOpen(open === index ? -1 : index)}>
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
                {project.repoUrl && (
                  <a className="vp-button" href={project.repoUrl} target="_blank" rel="noreferrer">VIEW REPOSITORY</a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillsPanel() {
  const categories = Object.keys(skillCategories);
  const [active, setActive] = useState(categories[0]);
  return (
    <div className="vp-body">
      <PanelHeader code="02 // HIGHGROUND AGENT" kicker="LOADOUT" title="Skills" />
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
            {category}
          </button>
        ))}
      </div>
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
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="vp-body">
      <PanelHeader code="03 // LURKING AGENT" kicker={about.kicker} title={about.headline} />
      <div className="vp-scroll vp-about">
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

        <h3 className="vp-subhead">{contact.kicker}</h3>
        <p className="vp-muted">{contact.lead}</p>
        <div className="vp-actions">
          <a className="vp-button vp-button-solid" href={`mailto:${profile.email}`}>{profile.email}</a>
          <a className="vp-button" href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a>
        </div>
      </div>
    </div>
  );
}

const PANELS = { home: HomePanel, projects: ProjectsPanel, skills: SkillsPanel, about: AboutPanel };

export default function ValorantHUD({ ready }) {
  const { section, settled, goTo } = useCameraRig();
  const [glitchKey, setGlitchKey] = useState(0);

  // Glitch flash whenever the camera starts a new flight.
  useEffect(() => {
    setGlitchKey((value) => value + 1);
  }, [section]);

  useEffect(() => {
    if (!ready) return undefined;
    const onKey = (event) => {
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
    </div>
  );
}
