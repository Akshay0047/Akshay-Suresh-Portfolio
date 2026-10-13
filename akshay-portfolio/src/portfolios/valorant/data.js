// Text content extracted verbatim from the Sekiro portfolio
// (src/portfolios/sekiro/SekiroPortfolio.tsx and src/data/save-chapters.ts).

export const profile = {
  name: 'Akshay Suresh',
  role: 'Computer Science Engineer / Full-Stack Developer',
  location: 'VIT Vellore · CSE',
  origin: 'Kerala, India',
  email: 'akshay47suresh@gmail.com',
  phone: '+91 8075292781',
  github: 'https://github.com/Akshay0047',
  linkedin: 'https://www.linkedin.com/in/akshay47suresh',
  resume: '/Akshay_Resume.pdf',
};

export const projects = [
  {
    index: '01',
    title: 'Disaster Response Coordination',
    type: 'AI SYSTEM',
    year: '2026',
    description:
      'An AWS-backed agentic AI coordinator that analyzes emergencies, prioritizes relief requests, and orchestrates rescue resources in real time.',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Claude AI', 'SQS', 'SNS', 'S3'],
    detail:
      'A cloud-native disaster response platform where a Claude-powered Agentic AI coordinator observes emergency situations, plans responses, and executes authorized actions through controlled tools. Phase 1 delivers the FastAPI backend with PostgreSQL, JWT authentication, and role-based access for citizens, volunteers, and admins — covering emergency request intake, volunteer availability, shelters, resources, and assignments. The architecture targets AWS services (RDS, SQS, SNS, S3) with a dedicated agent worker planned for autonomous replanning as conditions evolve.',
    metric: 'AGENTIC AI',
    repoUrl:
      'https://github.com/Akshay0047/Agentic-AI-Based-Disaster-Response-and-Relief-Coordination-System',
  },
  {
    index: '02',
    title: 'RAG PDF Reader',
    type: 'AI SYSTEM',
    year: '2026',
    description:
      'A hand-built RAG pipeline that ingests PDFs and answers questions grounded in your documents, with a LangChain version for direct comparison.',
    stack: ['Python', 'ChromaDB', 'Sentence Transformers', 'Groq API', 'LangChain', 'pypdf'],
    detail:
      'Built every stage of Retrieval-Augmented Generation from scratch in plain Python — document loading, sentence-aware chunking with overlap, local MiniLM embeddings, ChromaDB vector storage, cosine-similarity retrieval, and Groq-powered generation with strict context-only prompting. Reimplemented the same pipeline with LangChain to compare framework abstractions against raw mechanics. Includes isolated stage scripts for debugging each step, separate persisted indexes for both versions, and documented fixes for Windows dependency issues around chromadb 1.x wheels and httpx pinning.',
    metric: 'RAG PIPELINE',
    repoUrl: 'https://github.com/Akshay0047/RAG-PDF-Reader',
  },
  {
    index: '03',
    title: 'Authentication & Profile',
    type: 'FULL-STACK SYSTEM',
    year: '2025',
    description: 'Secure registration, login, profile viewing, and profile editing with a responsive React frontend.',
    stack: ['React', 'Django REST', 'MongoDB', 'JWT'],
    detail:
      'Manual JWT validation protected API endpoints while working around MongoDB ObjectId compatibility with Django ORM.',
    metric: 'SECURE ACCESS',
    repoUrl: 'https://github.com/Akshay0047/Authentication-Profile-Management-Application',
  },
  {
    index: '04',
    title: 'AI Discord Chatbot',
    type: 'CONVERSATIONAL TOOL',
    year: '2024',
    description: 'A multifunctional Discord bot with intelligent queries, reminders, timers, and moderation.',
    stack: ['Python', 'Discord.py', 'Gemini API'],
    detail:
      'Combined AI-assisted responses with reminders, timers, automated replies, music playback, utility commands, and server moderation.',
    metric: 'AI / AUTOMATION',
    repoUrl: 'https://github.com/Akshay0047/DiscordBot-Pookie',
  },
  {
    index: '05',
    title: 'Emotion-Based Song Recommender',
    type: 'COMPUTER VISION',
    year: '2024',
    description: 'Real-time emotion detection that turns facial signals into music recommendations.',
    stack: ['Python', 'Machine Learning', 'Computer Vision'],
    detail:
      'Used webcam input and facial landmark mapping to train a model that classifies emotions and triggers dynamic YouTube searches.',
    metric: 'REAL-TIME ML',
  },
  {
    index: '06',
    title: 'JavaScript Games',
    type: 'INTERACTION STUDIES',
    year: '2023–24',
    description: 'Browser games built to sharpen logic, event handling, and interaction design.',
    stack: ['JavaScript', 'Node.js', 'DOM'],
    detail:
      'Created multiple browser games focused on JavaScript logic, event handling, DOM manipulation, problem solving, and user interaction design.',
    metric: 'GAME LOGIC',
    repoUrl: 'https://github.com/Akshay0047/Car-Racing-Game',
  },
];

export const technicalSkills = [
  { name: 'C', value: 64, note: 'systems / fundamentals' },
  { name: 'C++', value: 66, note: 'logic / performance' },
  { name: 'PYTHON', value: 84, note: 'logic / services' },
  { name: 'JAVA', value: 68, note: 'object-oriented logic' },
  { name: 'JAVASCRIPT', value: 86, note: 'interaction / web' },
  { name: 'ASSEMBLY', value: 51, note: 'low-level concepts' },
  { name: 'MATLAB', value: 55, note: 'numerical / modeling' },
  { name: 'HTML5', value: 84, note: 'structure / semantics' },
  { name: 'CSS3', value: 82, note: 'layout / visual systems' },
  { name: 'NODE.JS', value: 72, note: 'runtime / tooling' },
  { name: 'REACT.JS', value: 89, note: 'interfaces / systems' },
  { name: 'REDUX TOOLKIT', value: 77, note: 'state / scale' },
  { name: 'DJANGO REST', value: 81, note: 'apis / architecture' },
  { name: 'MYSQL', value: 64, note: 'relational / data' },
  { name: 'MONGODB', value: 73, note: 'data / modeling' },
  { name: 'GIT', value: 80, note: 'branches / history' },
  { name: 'GITHUB', value: 78, note: 'code / collaboration' },
  { name: 'DISCORD API', value: 70, note: 'bots / communities' },
  { name: 'GEMINI API', value: 71, note: 'intelligence / prompts' },
  { name: 'BLENDER', value: 57, note: 'basic 3d modeling' },
  { name: 'VIDEO EDITING', value: 56, note: 'cuts / motion' },
];

export const skillCategories = {
  'TECHNICAL SKILLS': technicalSkills,
  'PERSONAL SKILLS': [
    { name: 'PROBLEM SOLVING', value: 92, note: 'break down / rebuild' },
    { name: 'CURIOSITY', value: 90, note: 'ask better questions' },
    { name: 'ADAPTABILITY', value: 86, note: 'learn / iterate' },
    { name: 'COLLABORATION', value: 83, note: 'share / ship' },
    { name: 'COMMUNICATION', value: 79, note: 'clarity / intent' },
  ],
  'TOOLS & PRACTICE': [
    { name: 'API DESIGN', value: 84, note: 'contracts / flow' },
    { name: 'COMPUTER VISION', value: 74, note: 'signals / models' },
    { name: 'MACHINE LEARNING', value: 71, note: 'experiments / data' },
    { name: 'GIT', value: 80, note: 'branches / history' },
    { name: 'UI SYSTEMS', value: 88, note: 'hierarchy / feedback' },
  ],
};

export const memories = [
  { date: 'JUN — JUL 2026', category: 'EXPERIENCE', title: 'Full-stack development intern', subtitle: 'Antlegs Technology Solutions Pvt. Ltd.', detail: 'Built authentication, profile, and user-management applications with React, Django REST Framework, and MongoDB.' },
  { date: '2025', category: 'ACHIEVEMENTS', title: '3rd place — Where’s The Flag', subtitle: 'IEEE Computer Society CTF · 35+ teams', detail: '' },
  { date: '2024 — PRESENT', category: 'EDUCATION', title: 'Computer Science Engineering', subtitle: 'VIT Vellore · CGPA 9.24', detail: 'Software engineering, algorithms, systems, and the practical craft of turning ideas into useful products.' },
  { date: 'JEE MAIN 2024', category: 'EDUCATION', title: '96.66 percentile', subtitle: 'Qualified', detail: '' },
  { date: '2024 / CBSE XII', category: 'EDUCATION', title: 'Senior Secondary', subtitle: 'SFS Public School, Kottayam · 97.4%', detail: '' },
  { date: '2022 / ICSE X', category: 'EDUCATION', title: 'Secondary', subtitle: 'Pallikoodam, Kottayam · 93%', detail: '' },
  { date: 'CERTIFIED', category: 'CERTIFICATIONS', title: 'Developer foundations', subtitle: 'WhiteHat Jr · Udemy', detail: 'Junior Developer and App Developer certifications covering HTML, CSS, JavaScript, and React.' },
  { date: 'SCHOOL HONORS', category: 'ACHIEVEMENTS', title: 'Olympiad district qualifier', subtitle: 'SOF IEO and ISO · multiple-time school-level winner', detail: '' },
  { date: 'CUSAT', category: 'ACTIVITIES', title: 'Summer Science Workshops', subtitle: 'Cochin University of Science and Technology', detail: 'Participated in the university’s summer science workshops.' },
];

export const about = {
  kicker: 'ABOUT THE PLAYER',
  headline: 'Still becoming.',
  lead: 'Third-year B.Tech Computer Science student with hands-on full-stack development experience.',
  body:
    'Across React, Django REST Framework, and MongoDB, I turn independent projects and practical experience into reliable products. I am actively seeking software development internship and full-time opportunities.',
  facts: [
    { label: 'ORIGIN', value: 'KERALA, INDIA' },
    { label: 'CLASS', value: 'FULL-STACK DEVELOPER' },
    { label: 'INTERESTS', value: 'GAME DEV / AI + AUTOMATION / 3D' },
    { label: 'ARMAMENT', value: 'REACT + PYTHON' },
  ],
};

export const contact = {
  kicker: 'OPEN CHANNEL',
  headline: 'Send a signal.',
  lead: 'Have a product, puzzle, or problem worth giving some attention to? The channel is open.',
  channels: [
    { label: 'PRIMARY CHANNEL', value: profile.email, href: `mailto:${profile.email}` },
    { label: 'DIRECT LINE', value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, '')}` },
  ],
};

// Loadout framing for the Arsenal panel (same skills, mapped to weapon slots).
export const arsenalSlots = {
  'TECHNICAL SKILLS': { slot: 'PRIMARY', weapon: 'VANDAL', spec: 'Languages, frameworks and platforms I fire daily.' },
  'PERSONAL SKILLS': { slot: 'ABILITIES', weapon: 'SIGNATURE', spec: 'The traits that keep a team moving and a build shipping.' },
  'TOOLS & PRACTICE': { slot: 'UTILITY', weapon: 'GADGETS', spec: 'Tooling and disciplines that support every push.' },
};

export const attackPower = { label: 'ATTACK POWER', value: 'WEB / API / STATE' };

// Career chapters (src/data/save-chapters.ts) shown in the Dossier.
export const chapters = [
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
      { date: 'JUN — JUL 2026', title: 'Full-stack development intern', detail: 'Antlegs Technology Solutions Pvt. Ltd. — built authentication, profile, and user-management applications.' },
      { date: '2024 — PRESENT', title: 'Computer Science Engineering', detail: 'VIT Vellore — software engineering, algorithms, and systems design.' },
      { date: '2025', title: 'Production web systems', detail: 'Delivered secure JWT-backed APIs, Redux dashboards, and MongoDB-backed services end to end.' },
    ],
    projects: [
      { name: 'Authentication & Profile', stack: 'React · Django REST · MongoDB · JWT', detail: 'Secure registration, login, profile viewing, and editing with protected API routes.' },
      { name: 'User Management System', stack: 'React · Redux Toolkit · Django REST', detail: 'Full CRUD admin console with bcrypt hashing, httpOnly cookies, and role-based access.' },
      { name: 'Cinematic Portfolio Platform', stack: 'React · TypeScript · Framer Motion · Vite', detail: 'Game-inspired portfolio with 3D loadout, inventory inspect, and scroll-driven chronicle.' },
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
      { date: '2024', title: 'AI Discord Chatbot', detail: 'Gemini-assisted replies, reminders, moderation, and music playback inside live servers.' },
      { date: '2024', title: 'Emotion-Based Song Recommender', detail: 'Real-time facial landmark analysis mapped to mood classes and dynamic music search.' },
      { date: 'ONGOING', title: 'ML tooling practice', detail: 'Computer vision pipelines, prompt engineering, and lightweight model experimentation.' },
    ],
    projects: [
      { name: 'AI Discord Chatbot', stack: 'Python · Discord.py · Gemini API', detail: 'Multifunctional bot with AI queries, timers, automated replies, and server utilities.' },
      { name: 'Emotion-Based Song Recommender', stack: 'Python · OpenCV · Machine Learning', detail: 'Webcam emotion classifier that triggers curated YouTube listening sessions.' },
      { name: 'Developer Foundations', stack: 'JavaScript · React · HTML/CSS', detail: 'WhiteHat Jr and Udemy certifications grounding early automation experiments.' },
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
      { date: '2025', title: '3rd place — Where’s The Flag', detail: 'IEEE Computer Society CTF competition against 35+ teams, decoding flags under time pressure.' },
      { date: 'SCHOOL HONORS', title: 'Olympiad district qualifier', detail: 'SOF IEO and ISO — multiple-time school-level winner.' },
      { date: 'CUSAT', title: 'Summer Science Workshops', detail: 'Cochin University of Science and Technology — hands-on science and engineering exposure.' },
    ],
    projects: [
      { name: 'JavaScript Games', stack: 'JavaScript · HTML5 Canvas · Node.js', detail: 'Arcade prototypes including a car racing game with score systems and tight controls.' },
      { name: 'Open Source Portfolio', stack: 'React · Git · GitHub', detail: 'Public repositories documenting experiments, coursework, and iterative UI craft.' },
      { name: 'Academic Milestones', stack: 'JEE 96.66% · CBSE XII 97.4%', detail: 'Strong quantitative foundation before university engineering specialization.' },
    ],
  },
];
