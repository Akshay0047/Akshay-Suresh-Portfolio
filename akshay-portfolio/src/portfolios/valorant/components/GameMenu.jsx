import { AnimatePresence, motion } from 'framer-motion';
import { useCameraRig } from '../3d/CameraController.jsx';

const NAV = [
  { id: 'menu', index: '01', label: 'Menu' },
  { id: 'projects', index: '02', label: 'Projects' },
  { id: 'skills', index: '03', label: 'Skills' },
  { id: 'contact', index: '04', label: 'Contact' },
];

const PLACES = {
  menu: 'Main Menu',
  projects: 'Projects Alley',
  skills: 'Skills Crate',
  contact: 'Contact Doorway',
};

const projects = [
  {
    index: '01',
    title: 'Disaster Response Coordination',
    meta: '2026 · Agentic AI',
    copy: 'AWS-backed coordinator that prioritizes relief requests and orchestrates rescue resources.',
    href: 'https://github.com/Akshay0047/Agentic-AI-Based-Disaster-Response-and-Relief-Coordination-System',
  },
  {
    index: '02',
    title: 'RAG PDF Reader',
    meta: '2026 · Retrieval',
    copy: 'A hand-built RAG pipeline for PDF question answering, compared against a LangChain version.',
    href: 'https://github.com/Akshay0047/RAG-PDF-Reader',
  },
  {
    index: '03',
    title: 'Authentication & Profile',
    meta: '2025 · Full-stack',
    copy: 'Registration, login, and profile editing with JWT-protected React and Django REST.',
    href: 'https://github.com/Akshay0047/Authentication-Profile-Management-Application',
  },
  {
    index: '04',
    title: 'AI Discord Chatbot',
    meta: '2024 · Automation',
    copy: 'Discord bot for intelligent queries, reminders, timers, and moderation.',
    href: 'https://github.com/Akshay0047/DiscordBot-Pookie',
  },
  {
    index: '05',
    title: 'Emotion-Based Song Recommender',
    meta: '2024 · Computer vision',
    copy: 'Realtime facial emotion detection that turns the signal into music recommendations.',
  },
  {
    index: '06',
    title: 'JavaScript Games',
    meta: '2023–24 · Interaction',
    copy: 'Browser games built to sharpen logic, event handling, and interaction design.',
    href: 'https://github.com/Akshay0047/Car-Racing-Game',
  },
];

const skills = [
  ['JavaScript', 86],
  ['React.js', 89],
  ['Python', 84],
  ['HTML5', 84],
  ['CSS3', 82],
  ['Django REST', 81],
  ['Git', 80],
  ['Redux Toolkit', 77],
  ['MongoDB', 73],
  ['Node.js', 72],
  ['Gemini API', 71],
  ['Java', 68],
  ['C++', 66],
  ['C', 64],
  ['MySQL', 64],
  ['Blender', 57],
];

export default function GameMenu() {
  const { section, moveTo } = useCameraRig();

  return (
    <div className="val-ui">
      <header className="val-top">
        <div>
          <p className="val-kicker">Initiator // Portfolio</p>
          <strong>Akshay Suresh</strong>
        </div>
        <p className="val-place">{PLACES[section] ?? PLACES.menu}</p>
      </header>

      <nav className="val-nav" aria-label="Site sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? 'is-active' : undefined}
            onClick={() => moveTo(item.id)}
          >
            <span>{item.index}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.aside
          key={section}
          className="val-panel"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Panel section={section} />
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}

function Panel({ section }) {
  if (section === 'projects') {
    return (
      <>
        <p className="val-kicker">02 // Projects Alley</p>
        <h2>Selected work</h2>
        <div className="val-scroll">
          {projects.map((project) => (
            <article key={project.index}>
              <header>
                <span>{project.index}</span>
                <small>{project.meta}</small>
              </header>
              <h3>{project.title}</h3>
              <p>{project.copy}</p>
              {project.href ? (
                <a href={project.href} target="_blank" rel="noreferrer">
                  Open repository
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </>
    );
  }

  if (section === 'skills') {
    return (
      <>
        <p className="val-kicker">03 // Skills Crate</p>
        <h2>Loadout</h2>
        <div className="val-scroll">
          {skills.map(([name, value]) => (
            <div className="val-skill" key={name}>
              <div>
                <span>{name}</span>
                <span>{value}</span>
              </div>
              <div className="val-skill-track">
                <span style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === 'contact') {
    return (
      <>
        <p className="val-kicker">04 // Contact Doorway</p>
        <h2>Open a channel</h2>
        <p className="val-lead">Computer science engineer and full-stack developer. VIT Vellore, CSE.</p>
        <div className="val-links">
          <a href="mailto:akshay47suresh@gmail.com">akshay47suresh@gmail.com</a>
          <a href="https://github.com/Akshay0047" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/akshay47suresh" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="/Akshay_Resume.pdf" target="_blank" rel="noreferrer">
            Resume
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="val-kicker">01 // Main Menu</p>
      <h2>Akshay Suresh</h2>
      <p className="val-lead">Computer science engineer / full-stack developer. VIT Vellore · CSE.</p>
      <p className="val-lead">
        Walk the courtyard. Projects, skills, and contact each hold a camera position in the map.
      </p>
    </>
  );
}
