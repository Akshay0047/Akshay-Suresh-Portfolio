import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import {
  Swords,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Code2,
  Github,
  Gamepad2,
  Linkedin,
  FileText,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import Atmosphere from '@/components/Atmosphere';
import { BladeButton } from '@/components/blade-button';
import { EquipmentPanel } from '@/components/equipment';
import { AssetWarmup } from '@/components/asset-warmup';
import {
  LoadProfileExperience,
  PARCHMENT_HEIGHT_LORE,
  ParchmentScroll,
  ROD_OFFSET_LORE,
} from '@/components/load-profile';
import { LoadingScreen } from '@/components/loading-screen';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type MenuId = 'projects' | 'attributes' | 'memories' | 'lore' | 'signal';

const profileLinks = {
  github: 'https://github.com/Akshay0047',
  linkedin: 'https://www.linkedin.com/in/akshay47suresh',
};

type Project = {
  index: string;
  title: string;
  type: string;
  year: string;
  kanji: string;
  description: string;
  stack: string[];
  detail: string;
  metric: string;
  repoUrl?: string;
};

const projects: Project[] = [
  {
    index: '01',
    title: 'Disaster Response Coordination',
    type: 'AI SYSTEM',
    year: '2026',
    kanji: '救',
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
    kanji: '智',
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
    kanji: '術',
    description: 'Secure registration, login, profile viewing, and profile editing with a responsive React frontend.',
    stack: ['React', 'Django REST', 'MongoDB', 'JWT'],
    detail: 'Manual JWT validation protected API endpoints while working around MongoDB ObjectId compatibility with Django ORM.',
    metric: 'SECURE ACCESS',
    repoUrl: 'https://github.com/Akshay0047/Authentication-Profile-Management-Application',
  },
  {
    index: '04',
    title: 'AI Discord Chatbot',
    type: 'CONVERSATIONAL TOOL',
    year: '2024',
    kanji: '幻',
    description: 'A multifunctional Discord bot with intelligent queries, reminders, timers, and moderation.',
    stack: ['Python', 'Discord.py', 'Gemini API'],
    detail: 'Combined AI-assisted responses with reminders, timers, automated replies, music playback, utility commands, and server moderation.',
    metric: 'AI / AUTOMATION',
    repoUrl: 'https://github.com/Akshay0047/DiscordBot-Pookie',
  },
  {
    index: '05',
    title: 'Emotion-Based Song Recommender',
    type: 'COMPUTER VISION',
    year: '2024',
    kanji: '魂',
    description: 'Real-time emotion detection that turns facial signals into music recommendations.',
    stack: ['Python', 'Machine Learning', 'Computer Vision'],
    detail: 'Used webcam input and facial landmark mapping to train a model that classifies emotions and triggers dynamic YouTube searches.',
    metric: 'REAL-TIME ML',
  },
  {
    index: '06',
    title: 'JavaScript Games',
    type: 'INTERACTION STUDIES',
    year: '2023–24',
    kanji: '遊',
    description: 'Browser games built to sharpen logic, event handling, and interaction design.',
    stack: ['JavaScript', 'Node.js', 'DOM'],
    detail: 'Created multiple browser games focused on JavaScript logic, event handling, DOM manipulation, problem solving, and user interaction design.',
    metric: 'GAME LOGIC',
    repoUrl: 'https://github.com/Akshay0047/Car-Racing-Game',
  },
];

const attributes = [
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

const skillCategories = {
  'TECHNICAL SKILLS': attributes,
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
} as const;

const menuItems: { id: MenuId; label: string; hint: string }[] = [
  { id: 'projects', label: 'INVENTORY', hint: 'projects & combat arts' },
  { id: 'attributes', label: 'ATTRIBUTES', hint: 'skills & loadout' },
  { id: 'memories', label: 'MEMORIES', hint: 'experience & milestones' },
  { id: 'lore', label: 'LORE', hint: 'about the player' },
  { id: 'signal', label: 'SIGNAL', hint: 'open a channel' },
];

function Crest({ small = false }: { small?: boolean }) {
  return (
    <div className={`crest ${small ? 'crest-small' : ''}`} aria-label="AS monogram crest">
      <span>AS</span>
    </div>
  );
}

function SwordCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const trailPoints = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const pointer = useRef({ x: -100, y: -100 });
  const visibleRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !cursor || !context) return;
    const cursorElement = cursor;
    const trailContext = context;

    let animationFrame = 0;
    const requestTrailFrame = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(renderTrail);
    };
    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * pixelRatio);
      canvas.height = Math.floor(window.innerHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      requestTrailFrame();
    };
    const handleMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const last = trailPoints.current[trailPoints.current.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) < 3) return;
      pointer.current = { x, y };
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      trailPoints.current.push({ x, y, time: performance.now() });
      if (trailPoints.current.length > 16) trailPoints.current.shift();
      requestTrailFrame();
    };
    const handleLeave = () => {
      trailPoints.current = [];
      visibleRef.current = false;
      setVisible(false);
      cursor.style.transform = 'translate(-10%, -8%)';
      if (!animationFrame) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    function renderTrail(time: number) {
      animationFrame = 0;
      const points = trailPoints.current;
      while (points.length && time - points[0].time > 420) points.shift();
      cursorElement.style.left = `${pointer.current.x}px`;
      cursorElement.style.top = `${pointer.current.y}px`;
      trailContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (points.length > 1) {
        trailContext.lineCap = 'round';
        trailContext.lineJoin = 'round';
        for (let index = 1; index < points.length; index += 1) {
          const point = points[index - 1];
          const nextPoint = points[index];
          const ageOpacity = Math.max(0, 1 - (time - nextPoint.time) / 420);
          const progress = index / (points.length - 1);
          trailContext.strokeStyle = `rgba(235, 215, 174, ${ageOpacity * (0.12 + progress * 0.58)})`;
          trailContext.lineWidth = 1 + progress * 5;
          trailContext.beginPath();
          trailContext.moveTo(point.x, point.y);
          trailContext.lineTo(nextPoint.x, nextPoint.y);
          trailContext.stroke();
        }
      }
      if (points.length) requestTrailFrame();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <div className="sword-cursor-layer" aria-hidden="true"><canvas ref={canvasRef} className="sword-trail-canvas" /><span ref={cursorRef} className={`sword-cursor ${visible ? 'is-visible' : ''}`} /></div>;
}

type ArcadeObject = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  spin: number;
  radius: number;
  kind: 'fruit' | 'bomb';
  color: string;
  sliced: boolean;
};

type ArcadeSplash = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type ArcadeSplatDrop = {
  angle: number;
  distance: number;
  size: number;
  stretch: number;
};

type ArcadeSplatStreak = {
  angle: number;
  distance: number;
  length: number;
  width: number;
};

type ArcadeMark = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  lobes: Array<{ x: number; y: number }>;
  drops: ArcadeSplatDrop[];
  streaks: ArcadeSplatStreak[];
};

function distanceToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared === 0) return Math.hypot(pointX - startX, pointY - startY);
  const projection = Math.max(
    0,
    Math.min(1, ((pointX - startX) * segmentX + (pointY - startY) * segmentY) / lengthSquared),
  );
  return Math.hypot(pointX - (startX + projection * segmentX), pointY - (startY + projection * segmentY));
}

function FruitArcade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objects = useRef<ArcadeObject[]>([]);
  const splashes = useRef<ArcadeSplash[]>([]);
  const marks = useRef<ArcadeMark[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const objectId = useRef(0);
  const lastActivity = useRef(0);
  const activeRef = useRef(false);
  const [active, setActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      objects.current = [];
      splashes.current = [];
      marks.current = [];
      pointer.current = null;
      lastActivity.current = 0;
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    if (!active) {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const addSplash = (item: ArcadeObject, angle: number) => {
      const splashColor = item.kind === 'bomb' ? '#d59b58' : item.color;
      const lobeCount = 18;
      marks.current.push({
        x: item.x,
        y: item.y,
        rotation: angle,
        scale: 1.1 + Math.random() * 0.48,
        color: splashColor,
        lobes: Array.from({ length: lobeCount }, (_, index) => {
          const direction = (Math.PI * 2 * index) / lobeCount;
          const radius = 24 + Math.random() * 26;
          return {
            x: Math.cos(direction) * radius,
            y: Math.sin(direction) * (radius * (0.62 + Math.random() * 0.34)),
          };
        }),
        drops: Array.from({ length: 17 }, (_, index) => ({
          angle: (Math.PI * 2 * index) / 17 + (Math.random() - 0.5) * 0.24,
          distance: 34 + Math.random() * 53,
          size: 2.3 + Math.random() * 5.2,
          stretch: 1.2 + Math.random() * 2.2,
        })),
        streaks: Array.from({ length: 7 }, (_, index) => ({
          angle: (Math.PI * 2 * index) / 7 + (Math.random() - 0.5) * 0.32,
          distance: 20 + Math.random() * 28,
          length: 12 + Math.random() * 23,
          width: 2 + Math.random() * 3.5,
        })),
      });
      for (let index = 0; index < 42; index += 1) {
        const direction = (Math.PI * 2 * index) / 42 + Math.random() * 0.55;
        const speed = 3 + Math.random() * 8;
        splashes.current.push({
          x: item.x,
          y: item.y,
          vx: Math.cos(direction) * speed,
          vy: Math.sin(direction) * speed - 2.5,
          life: 1.4,
          size: 2.5 + Math.random() * 6,
          color: splashColor,
        });
      }
    };

    const sliceObject = (item: ArcadeObject, angle: number) => {
      item.sliced = true;
      addSplash(item, angle);
      if (item.kind === 'bomb') {
        activeRef.current = false;
        objects.current = [];
        setGameOver(true);
        return;
      }
      setScore((current) => current + 1);
    };

    const handleMove = (event: PointerEvent) => {
      const next = { x: event.clientX, y: event.clientY };
      const previous = pointer.current;
      if (activeRef.current) lastActivity.current = performance.now();
      if (activeRef.current && previous) {
        objects.current.forEach((item) => {
          if (
            activeRef.current &&
            !item.sliced &&
            distanceToSegment(item.x, item.y, previous.x, previous.y, next.x, next.y) <= item.radius + 12
          ) {
            sliceObject(item, Math.atan2(next.y - previous.y, next.x - previous.x));
          }
        });
      }
      pointer.current = next;
    };

    const handleLeave = () => {
      pointer.current = null;
    };

    const spawnWave = (time: number) => {
      const spawnCount = Math.random() > 0.5 ? 3 : 2;
      for (let index = 0; index < spawnCount; index += 1) {
        const kind = index === 1 ? 'bomb' : 'fruit';
        const radius = kind === 'bomb' ? 22 : 25 + Math.random() * 5;
        const colors = ['#cb5b36', '#d89c35', '#ba4435', '#d6b04a'];
        objects.current.push({
          id: objectId.current++,
          x: window.innerWidth * (0.22 + Math.random() * 0.56),
          y: window.innerHeight + radius + 22,
          vx: (Math.random() - 0.5) * 4.2,
          vy: -(14 + Math.random() * 4.5),
          gravity: 0.25 + Math.random() * 0.05,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.08,
          radius,
          kind,
          color: colors[Math.floor(Math.random() * colors.length)],
          sliced: false,
        });
      }
      return time;
    };

    const drawFruit = (item: ArcadeObject) => {
      context.save();
      context.translate(item.x, item.y);
      context.rotate(item.rotation);
      if (item.kind === 'bomb') {
        context.beginPath();
        context.arc(0, 0, item.radius, 0, Math.PI * 2);
        context.fillStyle = '#191817';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#d59b58';
        context.stroke();
        context.beginPath();
        context.arc(-6, -7, 4, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 241, 201, 0.58)';
        context.fill();
        context.beginPath();
        context.moveTo(6, -18);
        context.quadraticCurveTo(15, -29, 21, -20);
        context.strokeStyle = '#c2803e';
        context.lineWidth = 2;
        context.stroke();
        context.beginPath();
        context.arc(23, -19, 3, 0, Math.PI * 2);
        context.fillStyle = '#fff2bf';
        context.shadowColor = '#fff2bf';
        context.shadowBlur = 12;
        context.fill();
      } else {
        const gradient = context.createRadialGradient(-8, -10, 2, 0, 0, item.radius);
        gradient.addColorStop(0, '#fff1b5');
        gradient.addColorStop(0.16, item.color);
        gradient.addColorStop(1, '#6b2c25');
        context.beginPath();
        context.ellipse(0, 2, item.radius * 0.86, item.radius, 0, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = 'rgba(255, 230, 166, 0.75)';
        context.stroke();
        context.beginPath();
        context.moveTo(0, -item.radius + 4);
        context.quadraticCurveTo(7, -item.radius - 10, 16, -item.radius - 3);
        context.strokeStyle = '#6e4424';
        context.lineWidth = 3;
        context.stroke();
        context.beginPath();
        context.ellipse(9, -item.radius - 5, 8, 3.5, -0.35, 0, Math.PI * 2);
        context.fillStyle = '#708046';
        context.fill();
      }
      context.restore();
    };

    const drawMark = (mark: ArcadeMark) => {
      context.save();
      context.translate(mark.x, mark.y);
      context.rotate(mark.rotation);
      context.scale(mark.scale, mark.scale);
      context.globalAlpha = 0.94;
      context.fillStyle = mark.color;
      context.shadowColor = mark.color;
      context.shadowBlur = 18;
      const lobeMidpoint = (first: { x: number; y: number }, second: { x: number; y: number }) => ({
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      });
      const firstMidpoint = lobeMidpoint(mark.lobes[0], mark.lobes[1]);
      context.moveTo(firstMidpoint.x, firstMidpoint.y);
      mark.lobes.forEach((point, index) => {
        const nextPoint = mark.lobes[(index + 1) % mark.lobes.length];
        const nextMidpoint = lobeMidpoint(point, nextPoint);
        context.quadraticCurveTo(point.x, point.y, nextMidpoint.x, nextMidpoint.y);
      });
      context.closePath();
      context.fill();
      context.globalAlpha = 0.72;
      mark.streaks.forEach((streak) => {
        context.save();
        context.rotate(streak.angle);
        context.translate(streak.distance, 0);
        context.beginPath();
        context.ellipse(streak.length / 2, 0, streak.length / 2, streak.width, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
      context.globalAlpha = 0.88;
      mark.drops.forEach((drop) => {
        context.save();
        context.rotate(drop.angle);
        context.translate(drop.distance, 0);
        context.beginPath();
        context.ellipse(0, 0, drop.size * drop.stretch, drop.size, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
      context.restore();
    };

    let lastSpawn = 0;
    let lastFrame = performance.now();
    let animationFrame = 0;
    const render = (time: number) => {
      const delta = Math.min(2, Math.max(0.5, (time - lastFrame) / 16.67));
      lastFrame = time;
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);

      if (activeRef.current) {
        if (lastActivity.current && time - lastActivity.current > 20000) {
          activeRef.current = false;
          objects.current = [];
          pointer.current = null;
          setGameOver(true);
        }
        if (activeRef.current) {
          if (!lastSpawn || time - lastSpawn > 610) lastSpawn = spawnWave(time);
          objects.current.forEach((item) => {
            if (!item.sliced) {
              item.x += item.vx * delta;
              item.y += item.vy * delta;
              item.vy += item.gravity * delta;
              item.rotation += item.spin * delta;
            }
          });
          objects.current = objects.current.filter((item) => !item.sliced && item.y < height + 90);
        }
      }

      marks.current.forEach(drawMark);
      splashes.current.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.18 * delta;
        particle.vx *= 0.985;
        particle.life -= 0.018 * delta;
      });
      splashes.current = splashes.current.filter((particle) => particle.life > 0);

      objects.current.forEach(drawFruit);
      splashes.current.forEach((particle) => {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(Math.atan2(particle.vy, particle.vx));
        context.beginPath();
        context.ellipse(
          0,
          0,
          particle.size * particle.life * 1.55,
          particle.size * particle.life * 0.62,
          0,
          0,
          Math.PI * 2,
        );
        context.fillStyle = particle.color;
        context.globalAlpha = particle.life;
        context.shadowColor = particle.color;
        context.shadowBlur = 10;
        context.fill();
        context.restore();
        context.globalAlpha = 1;
        context.shadowBlur = 0;
      });
      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [active]);

  const startArcade = () => {
    activeRef.current = true;
    objects.current = [];
    splashes.current = [];
    marks.current = [];
    pointer.current = null;
    lastActivity.current = performance.now();
    setGameOver(false);
    setScore(0);
    setActive(true);
  };

  const exitArcade = () => {
    activeRef.current = false;
    lastActivity.current = 0;
    setGameOver(false);
    setActive(false);
  };

  const toggleArcade = () => {
    if (active) {
      exitArcade();
      return;
    }
    startArcade();
  };

  return (
    <>
      <canvas ref={canvasRef} className={`fruit-game-canvas ${active ? 'is-active' : ''}`} aria-hidden="true" />
      {active && gameOver && (
        <div className="fruit-death-screen" role="dialog" aria-modal="true" aria-label="Death">
          <div className="fruit-death-card">
            <span className="death-kanji" aria-hidden="true">死</span>
            <span className="death-label">DEATH</span>
            <div className="fruit-death-actions">
              <BladeButton className="game-action-button primary" type="button" onClick={startArcade}>PLAY AGAIN</BladeButton>
              <button className="game-action-button" type="button" onClick={exitArcade}>EXIT</button>
            </div>
          </div>
        </div>
      )}
      <BladeButton
        className={`fruit-trigger ${active ? 'is-active' : ''}`}
        type="button"
        onClick={toggleArcade}
        aria-pressed={active}
        data-testid="button-combat-trial"
      >
        <Swords size={18} strokeWidth={1.35} />
        <span>{active ? 'EXIT' : 'DRAW THE BLADE'}</span>
        <b>{String(score).padStart(2, '0')}</b>
      </BladeButton>
    </>
  );
}

function TitleScreen({ onContinue, onOptions }: { onContinue: () => void; onOptions: () => void }) {
  const [selected, setSelected] = useState(0);
  const [isOpenSaveMenu, setIsOpenSaveMenu] = useState(false);
  const [selectedSaveFile, setSelectedSaveFile] = useState<string | null>(null);
  const titleActions = [
    { label: 'CONTINUE', hint: 'ENTER THE ARCHIVE' },
    { label: 'LOAD PROFILE', hint: 'REVIEW THE RECORD' },
    { label: 'SETTINGS', hint: 'INTERFACE OPTIONS' },
  ];

  const activateAction = useCallback((index: number) => {
    if (index === 0) onContinue();
    else if (index === 1) setIsOpenSaveMenu(true);
    else onOptions();
  }, [onContinue, onOptions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpenSaveMenu || selectedSaveFile) return;

      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        setSelected((current) => (current + 1) % titleActions.length);
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        setSelected((current) => (current - 1 + titleActions.length) % titleActions.length);
      }
      if (event.key === 'Enter') {
        activateAction(selected);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activateAction, isOpenSaveMenu, selected, selectedSaveFile, titleActions.length]);

  return (
    <motion.main
      className="title-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65 }}
    >
      <div className="title-vignette" />
      <div className="title-meta"><span>AS / FIELD ARCHIVE</span><span>VER. 2026.09</span></div>
      <div className="title-watermark">葦</div>
      <div className="title-content">
        <div className="title-crest"><Crest /></div>
        <div className="title-name">
          <span>AKSHAY</span>
          <strong>SURESH</strong>
        </div>
        <div className="title-rule" />
        <div className="title-qualification">COMPUTER SCIENCE ENGINEER <i>/</i> FULL-STACK DEVELOPER</div>
        <div className="title-location">VIT VELLORE · CSE</div>
        <nav className="title-actions" aria-label="Landing menu">
          {titleActions.map((action, index) => (
            <button
              className={`title-action ${selected === index ? 'is-selected' : ''}`}
              type="button"
              key={action.label}
              onClick={() => {
                setSelected(index);
                activateAction(index);
              }}
            >
              <span>{action.label}</span>
              <small>{action.hint}</small>
            </button>
          ))}
        </nav>
      </div>
      <div className="title-footer"><span><kbd>W</kbd><kbd>S</kbd> SELECT</span><span><kbd>ENTER</kbd> CONFIRM</span><span>© 2026 AKSHAY SURESH</span></div>

      <LoadProfileExperience
        isOpenSaveMenu={isOpenSaveMenu}
        selectedSaveFile={selectedSaveFile}
        onCloseSaveMenu={() => setIsOpenSaveMenu(false)}
        onSelectSaveFile={setSelectedSaveFile}
        onCloseScroll={() => setSelectedSaveFile(null)}
      />
    </motion.main>
  );
}

function MenuButton({
  item,
  selected,
  onSelect,
}: {
  item: (typeof menuItems)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`game-menu-button ${selected ? 'is-selected' : ''}`}
      type="button"
      onClick={onSelect}
      aria-current={selected}
      data-testid={`button-menu-${item.id}`}
    >
      <span className="menu-button-index">{menuItems.indexOf(item) + 1}</span>
      <span className="menu-button-copy">
        <span className="menu-button-label">{item.label}</span>
        <span className="menu-button-hint">{item.hint}</span>
      </span>
      <span className="menu-button-arrow">{selected ? '▶' : '›'}</span>
    </button>
  );
}

function PanelTitle({ kicker, title, accent }: { kicker: string; title: string; accent?: string }) {
  return (
    <div className="panel-title">
      <div className="panel-kicker">{kicker}</div>
      <h1>
        {title}
        {accent && <span>{accent}</span>}
      </h1>
    </div>
  );
}

const inkBleedInitial = {
  opacity: 0,
  filter: 'blur(12px) grayscale(100%) contrast(150%)',
  scale: 0.98,
};

const inkBleedAnimate = {
  opacity: 1,
  filter: 'blur(0px) grayscale(0%) contrast(100%)',
  scale: 1,
};

const inkBleedTransition = { duration: 0.75, ease: 'easeOut' as const };

function ProjectLoreScrollContent({ project }: { project: Project }) {
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
          <span className="scroll-content-kicker">{project.type} / {project.year}</span>
          <h2 className="scroll-content-title">{project.title}</h2>
          <p className="scroll-content-lead">{project.metric}</p>
        </header>

        <section className="scroll-chapter-section">
          <h3>ARMAMENTS / STACK</h3>
          <div className="scroll-lore-stack" aria-label="Tech stack">
            {project.stack.map((tech) => (
              <span key={tech} className="scroll-lore-chip">{tech}</span>
            ))}
          </div>
        </section>

        {project.detail && (
          <section className="scroll-chapter-section">
            <h3>CHRONICLE</h3>
            <p className="scroll-chapter-background">{project.detail}</p>
          </section>
        )}

        <a
          className="project-repo-link scroll-lore-repo inline-flex w-fit items-center gap-2"
          href={project.repoUrl ?? profileLinks.github}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={14} />
          {project.repoUrl ? 'OPEN GITHUB REPOSITORY' : 'BROWSE GITHUB PROFILE'}
        </a>
      </div>
    </motion.div>
  );
}

function ProjectPanel({
  selectedProject,
  onProjectChange,
}: {
  selectedProject: number;
  onProjectChange: (index: number) => void;
}) {
  const project = projects[selectedProject];
  const prefersReducedMotion = useReducedMotion();
  const inkInitial = prefersReducedMotion ? { opacity: 0 } : inkBleedInitial;
  const inkAnimate = prefersReducedMotion ? { opacity: 1 } : inkBleedAnimate;
  const [isScrollOpen, setIsScrollOpen] = useState(false);
  const [scrollSession, setScrollSession] = useState(0);

  useEffect(() => {
    if (isScrollOpen) setScrollSession((current) => current + 1);
  }, [isScrollOpen]);

  useEffect(() => {
    setIsScrollOpen(false);
  }, [selectedProject]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'y') return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      setIsScrollOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="content-panel project-panel flex h-full flex-col overflow-hidden">
      <div className="panel-topline shrink-0">
        <span>ITEM INSPECT / PROJECT {project.index}</span>
        <span className="status-dot"><CircleDot size={12} /> READY</span>
      </div>

      <div className="flex h-full flex-col">
        <section
          className="shrink-0 pb-6 pr-4 pt-4"
          aria-label={`Inspecting ${project.title}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={project.index}
              className="flex shrink-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,8rem)_1fr] lg:items-start lg:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <motion.div
                className="item-emblem shrink-0"
                initial={inkInitial}
                animate={inkAnimate}
                transition={inkBleedTransition}
              >
                <div className="flex h-32 w-32 items-center justify-center border border-[#4a3b2c] bg-[#141210] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                  <span className="font-serif text-6xl text-[#b8976a] drop-shadow-lg shadow-amber-900/50">{project.kanji}</span>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col gap-1"
                initial={inkInitial}
                animate={inkAnimate}
                transition={{ ...inkBleedTransition, delay: prefersReducedMotion ? 0 : 0.1 }}
              >
                <span className="item-type">{project.type} / {project.year}</span>
                <h2 className="item-copy-title leading-tight">{project.title}</h2>
                <p className="h-[48px] min-h-[3rem] text-wrap break-words font-[family-name:var(--app-font-mono)] text-[10px] leading-relaxed text-[#aba190] line-clamp-2">
                  {project.description}
                </p>

                <button
                  type="button"
                  className="mt-4 flex w-fit shrink-0 cursor-pointer items-center gap-3 text-sm text-[#a3907c] uppercase tracking-widest transition-colors hover:text-[#e8d4b4]"
                  onClick={() => setIsScrollOpen((prev) => !prev)}
                >
                  <span className="flex h-6 min-w-6 items-center justify-center rounded border border-[#4a3b2c] bg-[#141210] px-2 text-xs leading-none">Y</span>
                  Read Scroll
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="custom-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto border-t border-[rgba(190,176,148,0.16)] pt-4 pr-1">
          <nav aria-label="Project inventory">
            {projects.map((entry, index) => {
              const isSelected = index === selectedProject;
              return (
                <button
                  type="button"
                  key={entry.index}
                  onClick={() => onProjectChange(index)}
                  aria-label={`Inspect ${entry.title}`}
                  aria-current={isSelected ? 'true' : undefined}
                  data-testid={`button-project-${index + 1}`}
                  className={[
                    'group flex w-full min-w-0 items-center justify-between rounded-sm border border-transparent px-3 py-2.5 text-left transition-all duration-300 ease-out',
                    'text-[#6e6659] hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-[#f0e4c8]',
                    isSelected
                      ? 'border-amber-500/35 bg-amber-500/12 text-[#f5e6c4]'
                      : '',
                  ].join(' ')}
                >
                  <span className="min-w-0 truncate font-[family-name:var(--app-font-mono)] text-[10px] tracking-[0.08em] uppercase">
                    {entry.title}
                  </span>
                  <span
                    className={[
                      'ml-3 shrink-0 font-[family-name:var(--app-font-mono)] text-[8px] tracking-widest transition-colors duration-300',
                      isSelected ? 'text-amber-300/90' : 'text-[#8a7f6e] group-hover:text-amber-400/90',
                    ].join(' ')}
                  >
                    {entry.year}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <AnimatePresence>
        {isScrollOpen && (
          <ParchmentScroll
            key={`project-lore-scroll-${scrollSession}`}
            ariaLabel={`${project.title} lore scroll`}
            parchmentHeight={PARCHMENT_HEIGHT_LORE}
            rodOffset={ROD_OFFSET_LORE}
            assemblyMode="lore"
            contentMode="lore"
            topSealLabel="Roll up scroll"
            bottomSealLabel="Seal & return to inspect"
            onClose={() => setIsScrollOpen(false)}
          >
            <ProjectLoreScrollContent project={project} />
          </ParchmentScroll>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttributesPanel() {
  const categories = Object.keys(skillCategories) as Array<keyof typeof skillCategories>;
  const [activeCategory, setActiveCategory] = useState<keyof typeof skillCategories>('TECHNICAL SKILLS');
  const visibleSkills = skillCategories[activeCategory];

  return (
    <div className="content-panel attributes-panel">
      <div className="panel-topline">
        <span>CHARACTER STATUS / ATTRIBUTES</span>
        <span className="status-dot"><CircleDot size={12} /> ONLINE</span>
      </div>
      <PanelTitle kicker="CURRENT LOADOUT" title="Skill" accent=" tree" />
      <p className="panel-lead">The instruments I reach for when a problem needs to become a reliable experience.</p>
      <div className="skill-tree-layout">
        <nav className="skill-category-list" aria-label="Skill categories">
          {categories.map((category) => (
            <button
              className={`skill-category-button ${category === activeCategory ? 'is-selected' : ''}`}
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              <span>{category}</span>
              <b>{skillCategories[category].length}</b>
            </button>
          ))}
        </nav>
        <div className="attribute-list">
          {visibleSkills.map((attribute) => (
            <div className="attribute-row" key={attribute.name}>
              <div className="attribute-label"><span>{attribute.name}</span><small>{attribute.note}</small></div>
              <div className="attribute-bar"><span style={{ width: `${attribute.value}%` }} /></div>
              <b>{attribute.value}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="panel-callout"><Sparkles size={18} /><span>ATTACK POWER <b>WEB / API / STATE</b></span></div>
    </div>
  );
}

type Memory = {
  date: string;
  category: string;
  title: string;
  subtitle: string;
  detail: string;
};

function TimelineEntry({
  memory,
  index,
  scrollContainerRef,
}: {
  memory: Memory;
  index: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <article className={`timeline-entry ${index % 2 === 0 ? 'is-left' : 'is-right'}`}>
      <div className="timeline-time">{memory.date}</div>
      <span className="timeline-node" aria-hidden="true" />
      <motion.div
        className="timeline-card"
        initial={prefersReducedMotion ? false : { opacity: 0.2, y: 28 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-100px', root: scrollContainerRef }}
        transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      >
        <span>{memory.category}</span>
        <h2>{memory.title}</h2>
        <p>{memory.subtitle}</p>
        {memory.detail && <small>{memory.detail}</small>}
      </motion.div>
    </article>
  );
}

function MemoriesPanel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: timelineContentRef,
    container: scrollContainerRef,
    offset: ['start 80%', 'end 50%'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const memories: Memory[] = [
    { date: 'JUN — JUL 2026', category: 'EXPERIENCE', title: 'Full-stack development intern', subtitle: 'Antlegs Technology Solutions Pvt. Ltd.', detail: 'Built authentication, profile, and user-management applications with React, Django REST Framework, and MongoDB.' },
    { date: '2024 — PRESENT', category: 'EDUCATION', title: 'Computer Science Engineering', subtitle: 'VIT Vellore · CGPA 9.24', detail: 'Software engineering, algorithms, systems, and the practical craft of turning ideas into useful products.' },
    { date: 'JEE MAIN 2024', category: 'EDUCATION', title: '96.66 percentile', subtitle: 'Qualified', detail: '' },
    { date: '2024 / CBSE XII', category: 'EDUCATION', title: 'Senior Secondary', subtitle: 'SFS Public School, Kottayam · 97.4%', detail: '' },
    { date: '2022 / ICSE X', category: 'EDUCATION', title: 'Secondary', subtitle: 'Pallikoodam, Kottayam · 93%', detail: '' },
    { date: 'CERTIFIED', category: 'CERTIFICATIONS', title: 'Developer foundations', subtitle: 'WhiteHat Jr · Udemy', detail: 'Junior Developer and App Developer certifications covering HTML, CSS, JavaScript, and React.' },
    { date: 'IEEE COMPUTER SOCIETY', category: 'ACHIEVEMENTS', title: '3rd place — Where’s The Flag', subtitle: 'CTF · 35+ teams', detail: '' },
    { date: 'SCHOOL HONORS', category: 'ACHIEVEMENTS', title: 'Olympiad district qualifier', subtitle: 'SOF IEO and ISO · multiple-time school-level winner', detail: '' },
    { date: 'CUSAT', category: 'ACTIVITIES', title: 'Summer Science Workshops', subtitle: 'Cochin University of Science and Technology', detail: 'Participated in the university’s summer science workshops.' },
  ];

  return (
    <div className="content-panel memory-panel">
      <div className="panel-topline"><span>MEMORY FRAGMENTS / CHRONICLE</span><span className="status-dot"><CircleDot size={12} /> INDEXED</span></div>
      <PanelTitle kicker="RECORDED PATH" title="The" accent=" chronicle" />
      <div className="memory-timeline" ref={scrollContainerRef}>
        <div className="memory-timeline-content" ref={timelineContentRef}>
          <div className="memory-timeline-axis absolute inset-y-0 left-1/2 -translate-x-1/2" aria-hidden="true">
            <div className="memory-timeline-axis-track" />
            <motion.div
              className="memory-timeline-axis-progress origin-top"
              style={
                prefersReducedMotion
                  ? { scaleY: 1, transformOrigin: 'top' }
                  : { scaleY: smoothProgress, transformOrigin: 'top' }
              }
            />
          </div>
          {memories.map((memory, index) => (
            <TimelineEntry
              key={`${memory.date}-${memory.title}`}
              memory={memory}
              index={index}
              scrollContainerRef={scrollContainerRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LorePanel() {
  return (
    <div className="content-panel lore-panel">
      <div className="panel-topline"><span>PLAYER PROFILE / LORE</span><span className="status-dot"><CircleDot size={12} /> ACTIVE</span></div>
      <PanelTitle kicker="ABOUT THE PLAYER" title="Still" accent=" becoming." />
      <div className="lore-layout">
        <div>
          <p className="lore-lead">Third-year B.Tech Computer Science student with hands-on full-stack development experience.</p>
          <p className="panel-lead">Across React, Django REST Framework, and MongoDB, I turn independent projects and practical experience into reliable products. I am actively seeking software development internship and full-time opportunities.</p>
        </div>
        <div className="lore-facts">
          <div><span>ORIGIN</span><b>KERALA, INDIA</b></div>
          <div><span>CLASS</span><b>FULL-STACK DEVELOPER</b></div>
          <div><span>INTERESTS</span><b>GAME DEV / AI + AUTOMATION / 3D</b></div>
          <div><span>ARMAMENT</span><b>REACT + PYTHON</b></div>
        </div>
      </div>
    </div>
  );
}

function SignalPanel() {
  return (
    <div className="content-panel signal-panel flex h-full min-h-0 flex-col justify-between overflow-hidden">
      <div className="panel-topline shrink-0">
        <span>COMMUNICATION / SIGNAL</span>
        <span className="status-dot"><CircleDot size={12} /> OPEN</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <PanelTitle kicker="OPEN CHANNEL" title="Send" accent=" a signal." />
            <p className="panel-lead signal-lead">
              Have a product, puzzle, or problem worth giving some attention to? The channel is open.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="signal-card">
              <Mail size={20} strokeWidth={1} />
              <div><span>PRIMARY CHANNEL</span><a href="mailto:akshay47suresh@gmail.com">akshay47suresh@gmail.com</a></div>
            </div>
            <div className="signal-card signal-card-secondary">
              <Mail size={20} strokeWidth={1} />
              <div><span>DIRECT LINE</span><a href="tel:+918075292781">+91 8075292781</a></div>
            </div>
          </div>
        </div>

        <div className="signal-footer shrink-0">
          <div className="signal-actions grid grid-cols-2 gap-4">
            <a className="game-action-button py-2" href="mailto:akshay47suresh@gmail.com"><Mail size={14} /> OPEN EMAIL</a>
            <a
              className="game-action-button py-2"
              href="/Akshay_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText size={14} /> VIEW RESUME
            </a>
            <a className="game-action-button py-2" href={profileLinks.github} target="_blank" rel="noreferrer"><Github size={14} /> GITHUB</a>
            <a className="game-action-button py-2" href={profileLinks.linkedin} target="_blank" rel="noreferrer"><Linkedin size={14} /> LINKEDIN</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainMenu({ onReturnToLanding }: { onReturnToLanding: () => void }) {
  const [menuIndex, setMenuIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [topTab, setTopTab] = useState('EQUIPMENT');
  const [showOptions, setShowOptions] = useState(false);

  const activeMenu = menuItems[menuIndex];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        setMenuIndex((current) => (current + 1) % menuItems.length);
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        setMenuIndex((current) => (current - 1 + menuItems.length) % menuItems.length);
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        if (activeMenu.id === 'projects') setProjectIndex((current) => (current + 1) % projects.length);
      }
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        if (activeMenu.id === 'projects') setProjectIndex((current) => (current - 1 + projects.length) % projects.length);
      }
      if (event.key === 'Escape') {
        setShowOptions(false);
        setTopTab('INVENTORY');
      }
      if (event.key === 'Enter' && activeMenu.id === 'signal') {
        window.location.href = 'mailto:akshay47suresh@gmail.com';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu.id]);

  return (
    <main className="game-screen">
      <div className="screen-vignette" />
      <div className="screen-scanlines" />
      <header className="game-header">
        <button className="edge-control" type="button" onClick={() => { setShowOptions(false); setTopTab('EQUIPMENT'); }}><ArrowLeft size={14} /> L1</button>
        <div className="top-tabs">
          {['EQUIPMENT', 'INVENTORY', 'OPTIONS'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={topTab === tab ? 'active' : ''}
              onClick={() => {
                if (tab === 'OPTIONS') {
                  setTopTab('OPTIONS');
                  setShowOptions(true);
                } else {
                  setShowOptions(false);
                  setTopTab(tab);
                }
              }}
              data-testid={`button-tab-${tab.toLowerCase()}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="edge-control" type="button" onClick={() => { setTopTab('OPTIONS'); setShowOptions(true); }}>R1 <ArrowRight size={14} /></button>
      </header>

      <div className={`game-body ${topTab === 'EQUIPMENT' ? 'is-equipment-view' : ''}`}>
        {topTab !== 'EQUIPMENT' && <aside className="menu-column">
          <div className="menu-heading"><Gamepad2 size={15} /><span>QUICK MENU</span></div>
          <div className="menu-buttons">
             {menuItems.map((item) => (
               <MenuButton key={item.id} item={item} selected={activeMenu.id === item.id} onSelect={() => { setShowOptions(false); setTopTab('INVENTORY'); setMenuIndex(menuItems.indexOf(item)); }} />
            ))}
          </div>
          <div className="menu-footer">
            <div><span className="health-label">VITALITY</span><span className="health-track"><i /></span><b>100</b></div>
            <div><span className="health-label">FOCUS</span><span className="focus-track"><i /></span><b>08</b></div>
          </div>
        </aside>}

        <section className={`inspect-column ${topTab === 'EQUIPMENT' ? 'is-equipment-view' : ''}`} aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${topTab}-${activeMenu.id}`}
              className="panel-wrapper"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22 }}
            >
               {topTab === 'EQUIPMENT' && <EquipmentPanel />}
               {topTab !== 'EQUIPMENT' && activeMenu.id === 'projects' && <ProjectPanel selectedProject={projectIndex} onProjectChange={setProjectIndex} />}
               {topTab !== 'EQUIPMENT' && activeMenu.id === 'attributes' && <AttributesPanel />}
               {topTab !== 'EQUIPMENT' && activeMenu.id === 'memories' && <MemoriesPanel />}
               {topTab !== 'EQUIPMENT' && activeMenu.id === 'lore' && <LorePanel />}
               {topTab !== 'EQUIPMENT' && activeMenu.id === 'signal' && <SignalPanel />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <footer className="game-footer">
        <div className="control-guide">
          <span><kbd>W</kbd><kbd>S</kbd> NAVIGATE</span>
          <span><kbd>ENTER</kbd> SELECT</span>
          <span><kbd>ESC</kbd> BACK</span>
        </div>
        <div className="footer-status"><ShieldCheck size={14} /> SYSTEM READY <span>© 2026 AS</span></div>
      </footer>

      <FruitArcade />

      <AnimatePresence>
        {showOptions && (
           <motion.div className="options-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowOptions(false); setTopTab('INVENTORY'); }}>
           <motion.div className="options-panel" initial={{ y: 12 }} animate={{ y: 0 }} onClick={(event) => event.stopPropagation()}>
              <div className="panel-topline"><span>OPTIONS</span><button type="button" onClick={() => { setShowOptions(false); setTopTab('INVENTORY'); }} aria-label="Close options"><X size={17} /></button></div>
              <div className="option-row"><span>INTERFACE</span><b>GAME MENU</b><Check size={15} /></div>
              <div className="option-row"><span>MOTION</span><b>ENABLED</b><Check size={15} /></div>
              <div className="option-row"><span>INPUT</span><b>WASD / ARROWS</b><Check size={15} /></div>
              <div className="options-actions">
                <BladeButton className="game-action-button primary close-options" type="button" onClick={() => { setShowOptions(false); setTopTab('INVENTORY'); }}>RETURN TO MENU</BladeButton>
                <button className="game-action-button close-options" type="button" onClick={onReturnToLanding}>RETURN TO LANDING</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Home() {
  const [screen, setScreen] = useState<'title' | 'menu'>('title');
  const [openTitleOptions, setOpenTitleOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const completeLoading = useCallback(() => setIsLoading(false), []);
  return (
    <div className="portfolio-app">
      <div className="portfolio-ui relative z-10 h-full min-h-0 bg-transparent">
        <SwordCursor />
        <AnimatePresence mode="wait">
          {screen === 'title' && !openTitleOptions && (
            <TitleScreen key="title" onContinue={() => setScreen('menu')} onOptions={() => setOpenTitleOptions(true)} />
          )}
          {screen === 'title' && openTitleOptions && (
            <motion.div className="title-options-backdrop" key="title-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="title-options">
                <div className="panel-topline"><span>SETTINGS</span><button type="button" onClick={() => setOpenTitleOptions(false)} aria-label="Close settings"><X size={17} /></button></div>
                <p>Interface motion and input are ready for the archive.</p>
                <BladeButton className="game-action-button primary" type="button" onClick={() => setOpenTitleOptions(false)}>RETURN</BladeButton>
              </div>
            </motion.div>
          )}
          {screen === 'menu' && (
            <MainMenu
              key="menu"
              onReturnToLanding={() => {
                setOpenTitleOptions(false);
                setScreen('title');
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {!isLoading && <AssetWarmup />}
      <AnimatePresence>{isLoading && <LoadingScreen key="loading" onComplete={completeLoading} />}</AnimatePresence>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Atmosphere />
          <div className="app-shell relative z-10 h-full min-h-0 bg-transparent">
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;