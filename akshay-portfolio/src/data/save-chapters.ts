export type SaveChapter = {
  id: string;
  slot: string;
  title: string;
  status: string;
  year: string;
  summary: string;
  background: string;
  timeline: Array<{ date: string; title: string; detail: string }>;
  projects: Array<{ name: string; stack: string; detail: string }>;
};

export const saveChapters: SaveChapter[] = [
  {
    id: 'full-stack',
    slot: 'SAVE 01',
    title: 'Full-Stack Engineer',
    status: 'Active Run',
    year: '2026',
    summary: 'The current chapter — shipping production-grade web systems with React, Django REST, and MongoDB.',
    background:
      'Third-year CSE student at VIT Vellore (CGPA 9.24) with a full-stack internship at Antlegs Technology Solutions. Focused on authentication flows, admin tooling, and polished interface systems.',
    timeline: [
      {
        date: 'JUN — JUL 2026',
        title: 'Full-stack development intern',
        detail: 'Antlegs Technology Solutions Pvt. Ltd. — built authentication, profile, and user-management applications.',
      },
      {
        date: '2024 — PRESENT',
        title: 'Computer Science Engineering',
        detail: 'VIT Vellore — software engineering, algorithms, and systems design.',
      },
      {
        date: '2025',
        title: 'Production web systems',
        detail: 'Delivered secure JWT-backed APIs, Redux dashboards, and MongoDB-backed services end to end.',
      },
    ],
    projects: [
      {
        name: 'Authentication & Profile',
        stack: 'React · Django REST · MongoDB · JWT',
        detail: 'Secure registration, login, profile viewing, and editing with protected API routes.',
      },
      {
        name: 'User Management System',
        stack: 'React · Redux Toolkit · Django REST',
        detail: 'Full CRUD admin console with bcrypt hashing, httpOnly cookies, and role-based access.',
      },
      {
        name: 'Cinematic Portfolio Platform',
        stack: 'React · TypeScript · Framer Motion · Vite',
        detail: 'Game-inspired portfolio with 3D loadout, inventory inspect, and scroll-driven chronicle.',
      },
    ],
  },
  {
    id: 'ai-ml',
    slot: 'SAVE 02',
    title: 'AI & ML Experiments',
    status: 'Archived',
    year: '2024',
    summary: 'An earlier run focused on conversational automation, computer vision, and expressive ML prototypes.',
    background:
      'Explored how intelligence could feel alive in software — from Discord communities to webcam-driven recommendation engines. These experiments sharpened my Python craft and API orchestration instincts.',
    timeline: [
      {
        date: '2024',
        title: 'AI Discord Chatbot',
        detail: 'Gemini-assisted replies, reminders, moderation, and music playback inside live servers.',
      },
      {
        date: '2024',
        title: 'Emotion-Based Song Recommender',
        detail: 'Real-time facial landmark analysis mapped to mood classes and dynamic music search.',
      },
      {
        date: 'ONGOING',
        title: 'ML tooling practice',
        detail: 'Computer vision pipelines, prompt engineering, and lightweight model experimentation.',
      },
    ],
    projects: [
      {
        name: 'AI Discord Chatbot',
        stack: 'Python · Discord.py · Gemini API',
        detail: 'Multifunctional bot with AI queries, timers, automated replies, and server utilities.',
      },
      {
        name: 'Emotion-Based Song Recommender',
        stack: 'Python · OpenCV · Machine Learning',
        detail: 'Webcam emotion classifier that triggers curated YouTube listening sessions.',
      },
      {
        name: 'Developer Foundations',
        stack: 'JavaScript · React · HTML/CSS',
        detail: 'WhiteHat Jr and Udemy certifications grounding early automation experiments.',
      },
    ],
  },
  {
    id: 'hackathon-oss',
    slot: 'SAVE 03',
    title: 'Hackathon Wins & Open Source',
    status: 'Archived',
    year: '2022 — 2024',
    summary: 'Competitive runs, browser-game prototypes, and public repositories that built my engineering instincts.',
    background:
      'Before the full-stack chapter, I sharpened logic through hackathons, school honors, and open-source game prototypes — learning to ship fast, debug under pressure, and present work clearly.',
    timeline: [
      {
        date: 'IEEE COMPUTER SOCIETY',
        title: '3rd place — Where’s The Flag',
        detail: 'CTF competition against 35+ teams, decoding flags under time pressure.',
      },
      {
        date: 'SCHOOL HONORS',
        title: 'Olympiad district qualifier',
        detail: 'SOF IEO and ISO — multiple-time school-level winner.',
      },
      {
        date: 'CUSAT',
        title: 'Summer Science Workshops',
        detail: 'Cochin University of Science and Technology — hands-on science and engineering exposure.',
      },
    ],
    projects: [
      {
        name: 'JavaScript Games',
        stack: 'JavaScript · HTML5 Canvas · Node.js',
        detail: 'Arcade prototypes including a car racing game with score systems and tight controls.',
      },
      {
        name: 'Open Source Portfolio',
        stack: 'React · Git · GitHub',
        detail: 'Public repositories documenting experiments, coursework, and iterative UI craft.',
      },
      {
        name: 'Academic Milestones',
        stack: 'JEE 96.66% · CBSE XII 97.4%',
        detail: 'Strong quantitative foundation before university engineering specialization.',
      },
    ],
  },
];

export function getSaveChapter(id: string) {
  return saveChapters.find((chapter) => chapter.id === id);
}
