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
};
