import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Code2,
  Github,
  Gamepad2,
  Linkedin,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
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
  description: string;
  stack: string[];
  detail: string;
  metric: string;
};

const projects: Project[] = [
  {
    index: '01',
    title: 'Authentication & Profile',
    type: 'FULL-STACK SYSTEM',
    year: '2025',
    description: 'Secure registration, login, profile viewing, and profile editing with a responsive React frontend.',
    stack: ['React', 'Django REST', 'MongoDB', 'JWT'],
    detail: 'Manual JWT validation protected API endpoints while working around MongoDB ObjectId compatibility with Django ORM.',
    metric: 'SECURE ACCESS',
  },
  {
    index: '02',
    title: 'User Management',
    type: 'ADMINISTRATION TOOL',
    year: '2025',
    description: 'A full CRUD system for managing users, roles, and permissions.',
    stack: ['React', 'Redux Toolkit', 'Django REST', 'MongoDB'],
    detail: 'Added bcrypt hashing, httpOnly cookies, and an Axios token-refresh interceptor. Identified and fixed broken access control.',
    metric: 'FULL CRUD',
  },
  {
    index: '03',
    title: 'AI Discord Chatbot',
    type: 'CONVERSATIONAL TOOL',
    year: '2024',
    description: 'A multifunctional Discord bot with intelligent queries, reminders, timers, and moderation.',
    stack: ['Python', 'Discord.py', 'Gemini API'],
    detail: 'Combined AI-assisted responses with reminders, timers, automated replies, music playback, utility commands, and server moderation.',
    metric: 'AI / AUTOMATION',
  },
  {
    index: '04',
    title: 'Emotion-Based Song Recommender',
    type: 'COMPUTER VISION',
    year: '2024',
    description: 'Real-time emotion detection that turns facial signals into music recommendations.',
    stack: ['Python', 'Machine Learning', 'Computer Vision'],
    detail: 'Used webcam input and facial landmark mapping to train a model that classifies emotions and triggers dynamic YouTube searches.',
    metric: 'REAL-TIME ML',
  },
  {
    index: '05',
    title: 'JavaScript Games',
    type: 'INTERACTION STUDIES',
    year: '2023–24',
    description: 'Browser games built to sharpen logic, event handling, and interaction design.',
    stack: ['JavaScript', 'Node.js', 'DOM'],
    detail: 'Created multiple browser games focused on JavaScript logic, event handling, DOM manipulation, problem solving, and user interaction design.',
    metric: 'GAME LOGIC',
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

function Particles({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        left: `${(index * 37 + 4) % 100}%`,
        top: `${(index * 61 + 7) % 100}%`,
        size: 1 + (index % 3),
        delay: `${(index % 8) * 0.72}s`,
        duration: `${6 + (index % 5)}s`,
      })),
    [count],
  );

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          className="particle"
          key={`particle-${index}`}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 4, 94));
    }, 70);
    const finish = window.setTimeout(() => setProgress(100), 1810);
    const loaded = window.setTimeout(onComplete, 2110);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(finish);
      window.clearTimeout(loaded);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Loading portfolio"
    >
      <Particles count={36} />
      <div className="loading-vignette" />
      <div className="loading-mark">
        <div className="loading-kanji">葦</div>
        <Crest />
        <div className="loading-name">AKSHAY SURESH</div>
        <div className="loading-subtitle">FIELD ARCHIVE / INITIALIZING</div>
      </div>
      <div className="loading-progress">
        <div className="loading-progress-label">
          <span>LOADING MEMORY</span>
          <span>{String(progress).padStart(2, '0')}%</span>
        </div>
        <div className="loading-track">
          <motion.div
            className="loading-fill"
            initial={{ width: '4%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.12, ease: 'linear' }}
          />
        </div>
      </div>
      <motion.div
        className="katana-slash"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 1, 0] }}
        transition={{ delay: 1.45, duration: 0.55, times: [0, 0.16, 0.6, 1] }}
      />
    </motion.div>
  );
}

function SwordCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailPoints = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const [pointer, setPointer] = useState({ x: -100, y: -100, visible: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handleMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const last = trailPoints.current[trailPoints.current.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) < 2) return;
      setPointer({ x, y, visible: true });
      trailPoints.current.push({ x, y, time: performance.now() });
      if (trailPoints.current.length > 20) trailPoints.current.shift();
    };

    const handleLeave = () => {
      trailPoints.current = [];
      setPointer((current) => ({ ...current, visible: false }));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    let animationFrame = 0;
    const renderTrail = (time: number) => {
      const points = trailPoints.current;
      while (points.length && time - points[0].time > 520) points.shift();

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (points.length > 1) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        for (let index = 1; index < points.length; index += 1) {
          const point = points[index - 1];
          const nextPoint = points[index];
          const age = time - nextPoint.time;
          const ageOpacity = Math.max(0, 1 - age / 520);
          const progress = index / (points.length - 1);
          context.strokeStyle = `rgba(255, 255, 255, ${ageOpacity * (0.16 + progress * 0.84)})`;
          context.lineWidth = 1.5 + progress * 8.5;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(nextPoint.x, nextPoint.y);
          context.stroke();
        }
      }
      animationFrame = window.requestAnimationFrame(renderTrail);
    };
    animationFrame = window.requestAnimationFrame(renderTrail);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="sword-cursor-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="sword-trail-canvas" />
      <span
        className={`sword-cursor ${pointer.visible ? 'is-visible' : ''}`}
        style={{
          left: pointer.x,
          top: pointer.y,
          transform: 'translate(-10%, -8%)',
        }}
      >
      </span>
    </div>
  );
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

type ArcadeMark = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
};

type ArcadeBurst = {
  x: number;
  y: number;
  angle: number;
  life: number;
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
  const bursts = useRef<ArcadeBurst[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const objectId = useRef(0);
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
      bursts.current = [];
      pointer.current = null;
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const addSplash = (item: ArcadeObject, angle: number) => {
      const splashColor = item.kind === 'bomb' ? '#d59b58' : item.color;
      marks.current.push({
        x: item.x,
        y: item.y,
        rotation: angle,
        scale: 0.72 + Math.random() * 0.34,
        color: splashColor,
      });
      for (let index = 0; index < 30; index += 1) {
        const direction = (Math.PI * 2 * index) / 30 + Math.random() * 0.55;
        const speed = 2.5 + Math.random() * 6.5;
        splashes.current.push({
          x: item.x,
          y: item.y,
          vx: Math.cos(direction) * speed,
          vy: Math.sin(direction) * speed - 2.5,
          life: 1.2,
          size: 2 + Math.random() * 5,
          color: splashColor,
        });
      }
      bursts.current.push({ x: item.x, y: item.y, angle, life: 1.2 });
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
      context.globalAlpha = 0.86;
      context.fillStyle = mark.color;
      context.shadowColor = mark.color;
      context.shadowBlur = 10;
      context.beginPath();
      context.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2);
      context.fill();
      for (let index = 0; index < 9; index += 1) {
        const direction = (Math.PI * 2 * index) / 9;
        const distance = 19 + (index % 3) * 6;
        const size = 2 + (index % 3) * 1.5;
        context.beginPath();
        context.arc(Math.cos(direction) * distance, Math.sin(direction) * distance, size, 0, Math.PI * 2);
        context.fill();
      }
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

      marks.current.forEach(drawMark);
      splashes.current.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.18 * delta;
        particle.vx *= 0.985;
        particle.life -= 0.018 * delta;
      });
      splashes.current = splashes.current.filter((particle) => particle.life > 0);

      bursts.current.forEach((burst) => {
        burst.life -= 0.028 * delta;
      });
      bursts.current = bursts.current.filter((burst) => burst.life > 0);

      objects.current.forEach(drawFruit);
      splashes.current.forEach((particle) => {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.globalAlpha = particle.life;
        context.shadowColor = particle.color;
        context.shadowBlur = 10;
        context.fill();
        context.globalAlpha = 1;
        context.shadowBlur = 0;
      });
      bursts.current.forEach((burst) => {
        context.save();
        context.translate(burst.x, burst.y);
        context.rotate(burst.angle);
        context.globalAlpha = burst.life;
        context.strokeStyle = '#fffdf3';
        context.shadowColor = '#ffffff';
        context.shadowBlur = 16;
        context.lineWidth = 3 + burst.life * 8;
        context.beginPath();
        context.moveTo(-88 * burst.life, 0);
        context.lineTo(88 * burst.life, 0);
        context.stroke();
        context.globalAlpha = burst.life * 0.72;
        context.lineWidth = 2.5;
        context.beginPath();
        context.arc(0, 0, 20 + (1 - burst.life) * 58, 0, Math.PI * 2);
        context.stroke();
        context.restore();
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
  }, []);

  const startArcade = () => {
    activeRef.current = true;
    objects.current = [];
    splashes.current = [];
    marks.current = [];
    bursts.current = [];
    pointer.current = null;
    setGameOver(false);
    setScore(0);
    setActive(true);
  };

  const toggleArcade = () => {
    if (active) {
      activeRef.current = false;
      setGameOver(false);
      setActive(false);
      return;
    }
    startArcade();
  };

  return (
    <>
      <canvas ref={canvasRef} className={`fruit-game-canvas ${active ? 'is-active' : ''}`} aria-hidden="true" />
      {active && gameOver && (
        <button className="fruit-game-over" type="button" onClick={startArcade}>
          <strong>GAME OVER</strong>
          <span>CLICK TO PLAY AGAIN</span>
        </button>
      )}
      <button
        className={`fruit-trigger ${active ? 'is-active' : ''}`}
        type="button"
        onClick={toggleArcade}
        aria-pressed={active}
        data-testid="button-fruit-mode"
      >
        <Apple size={18} strokeWidth={1.5} />
        <span>{active ? 'EXIT' : 'SLICE'}</span>
        <b>{String(score).padStart(2, '0')}</b>
      </button>
    </>
  );
}

function TitleScreen({ onContinue, onOptions }: { onContinue: () => void; onOptions: () => void }) {
  const [selected, setSelected] = useState(0);
  const titleActions = [
    { label: 'CONTINUE', hint: 'ENTER THE ARCHIVE' },
    { label: 'LOAD PROFILE', hint: 'REVIEW THE RECORD' },
    { label: 'SETTINGS', hint: 'INTERFACE OPTIONS' },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        setSelected((current) => (current + 1) % titleActions.length);
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        setSelected((current) => (current - 1 + titleActions.length) % titleActions.length);
      }
      if (event.key === 'Enter') {
        if (selected === 2) onOptions();
        else onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue, onOptions, selected, titleActions.length]);

  return (
    <motion.main
      className="title-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65 }}
    >
      <Particles count={22} />
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
                if (index === 2) onOptions();
                else onContinue();
              }}
            >
              <span>{action.label}</span>
              <small>{action.hint}</small>
            </button>
          ))}
        </nav>
      </div>
      <div className="title-footer"><span><kbd>W</kbd><kbd>S</kbd> SELECT</span><span><kbd>ENTER</kbd> CONFIRM</span><span>© 2026 AKSHAY SURESH</span></div>
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

function ProjectPanel({
  selectedProject,
  onProjectChange,
}: {
  selectedProject: number;
  onProjectChange: (index: number) => void;
}) {
  const project = projects[selectedProject];
  return (
    <div className="content-panel project-panel">
      <div className="panel-topline">
        <span>ITEM INSPECT / PROJECT {project.index}</span>
        <span className="status-dot"><CircleDot size={12} /> READY</span>
      </div>
      <div className="project-inspect">
        <div className="item-emblem">
          <div className="emblem-diamond"><Code2 size={34} strokeWidth={1} /></div>
          <span>COMBAT ART</span>
        </div>
        <div className="item-copy">
          <span className="item-type">{project.type} / {project.year}</span>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
          <div className="metric-line"><span>ATTRIBUTE</span><b>{project.metric}</b></div>
          <div className="stack-list">
            {project.stack.map((tech) => <span key={tech}>{tech}</span>)}
          </div>
        </div>
      </div>
      <div className="project-detail">{project.detail}</div>
      <div className="project-switcher">
        {projects.map((entry, index) => (
          <button
            type="button"
            className={index === selectedProject ? 'selected' : ''}
            key={entry.index}
            onClick={() => onProjectChange(index)}
            aria-label={`Inspect ${entry.title}`}
            data-testid={`button-project-${index + 1}`}
          >
            {entry.index}
          </button>
        ))}
      </div>
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

function MemoriesPanel() {
  return (
    <div className="content-panel">
      <div className="panel-topline"><span>MEMORY FRAGMENTS / CHRONICLE</span><span className="status-dot"><CircleDot size={12} /> INDEXED</span></div>
      <PanelTitle kicker="RECORDED PATH" title="The" accent=" chronicle" />
      <div className="memory-list">
        <div className="memory-section-label">EXPERIENCE</div>
        <div className="memory-entry">
          <span className="memory-date">JUN — JUL 2026</span>
          <div><h2>Full-stack development intern</h2><p>Antlegs Technology Solutions Pvt. Ltd.</p><small>Built authentication, profile, and user management applications with React, Django REST Framework, and MongoDB.</small></div>
        </div>
        <div className="memory-section-label">EDUCATION</div>
        <div className="memory-entry">
          <span className="memory-date">2024 — PRESENT</span>
          <div><h2>Computer Science Engineering</h2><p>VIT Vellore · CGPA 9.24</p><small>Building a strong foundation across software engineering, algorithms, systems, and the practical craft of turning ideas into useful products.</small></div>
        </div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">JEE MAIN 2024</span>
          <div><h2>96.66 percentile</h2><p>Qualified</p></div>
        </div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">2024 / CBSE XII</span>
          <div><h2>Senior Secondary</h2><p>SFS Public School, Kottayam · 97.4%</p></div>
        </div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">2022 / ICSE X</span>
          <div><h2>Secondary</h2><p>Pallikoodam, Kottayam · 93%</p></div>
        </div>
        <div className="memory-section-label">CERTIFICATIONS</div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">CERTIFIED</span>
          <div><h2>Developer foundations</h2><p>Junior Developer Certification · App Developer Certification — WhiteHat Jr</p><small>HTML, CSS, JavaScript, React — Online Certification Course · Udemy</small></div>
        </div>
        <div className="memory-section-label">ACHIEVEMENTS / ACTIVITIES</div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">IEEE COMPUTER SOCIETY</span>
          <div><h2>3rd place — Where&apos;s The Flag</h2><p>CTF · 35+ teams</p></div>
        </div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">SCHOOL HONORS</span>
          <div><h2>Olympiad district qualifier</h2><p>SOF IEO and ISO · multiple-time school-level winner</p></div>
        </div>
        <div className="memory-entry compact-entry">
          <span className="memory-date">CUSAT</span>
          <div><h2>Summer Science Workshops</h2><p>Participated at Cochin University of Science and Technology</p></div>
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
    <div className="content-panel signal-panel">
      <div className="panel-topline"><span>COMMUNICATION / SIGNAL</span><span className="status-dot"><CircleDot size={12} /> OPEN</span></div>
      <PanelTitle kicker="OPEN CHANNEL" title="Send" accent=" a signal." />
      <p className="panel-lead signal-lead">Have a product, puzzle, or problem worth giving some attention to? The channel is open.</p>
      <div className="signal-card">
        <Mail size={24} strokeWidth={1} />
        <div><span>PRIMARY CHANNEL</span><a href="mailto:akshay47suresh@gmail.com">akshay47suresh@gmail.com</a></div>
      </div>
      <div className="signal-card signal-card-secondary">
        <Mail size={24} strokeWidth={1} />
        <div><span>DIRECT LINE</span><a href="tel:+918075292781">+91 8075292781</a></div>
      </div>
      <div className="signal-links">
        <a href={profileLinks.github} target="_blank" rel="noreferrer"><Github size={16} /><span>GITHUB</span><small>AKSHAY0047</small></a>
        <a href={profileLinks.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} /><span>LINKEDIN</span><small>AKSHAY47SURESH</small></a>
      </div>
      <div className="signal-actions">
        <a className="game-action-button primary" href="mailto:akshay47suresh@gmail.com"><Mail size={15} /> OPEN EMAIL</a>
        <a className="game-action-button" href={profileLinks.github} target="_blank" rel="noreferrer"><Github size={15} /> GITHUB</a>
        <a className="game-action-button" href={profileLinks.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} /> LINKEDIN</a>
      </div>
    </div>
  );
}

function EquipmentPanel() {
  const equipment = [
    { slot: 'PRIMARY ARM', title: 'REACT', detail: 'Component systems and interfaces built to feel immediate, clear, and alive.', icon: Code2 },
    { slot: 'SECONDARY ARM', title: 'PYTHON', detail: 'Automation, AI experiments, and service logic that keeps the experience moving.', icon: Sparkles },
    { slot: 'PROSTHETIC TOOL', title: 'DJANGO REST', detail: 'Structured APIs with authentication, permissions, and dependable data flow.', icon: ShieldCheck },
    { slot: 'CURRENT QUEST', title: 'VIT VELLORE', detail: 'Computer Science Engineering student with a 9.24 CGPA.', icon: CircleDot },
  ];

  return (
    <div className="content-panel equipment-panel">
      <div className="panel-topline"><span>EQUIPMENT / LOADOUT</span><span className="status-dot"><CircleDot size={12} /> EQUIPPED</span></div>
      <PanelTitle kicker="CURRENT ARMAMENT" title="The" accent=" arsenal" />
      <div className="equipment-grid">
        {equipment.map(({ slot, title, detail, icon: Icon }) => (
          <div className="equipment-card" key={slot}>
            <div className="equipment-icon"><Icon size={20} strokeWidth={1.3} /></div>
            <div><span>{slot}</span><h2>{title}</h2><p>{detail}</p></div>
            <b>READY</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function MainMenu({ onReturnToLanding }: { onReturnToLanding: () => void }) {
  const [menuIndex, setMenuIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [topTab, setTopTab] = useState('INVENTORY');
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
      <Particles />
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
                <button className="game-action-button primary close-options" type="button" onClick={() => { setShowOptions(false); setTopTab('INVENTORY'); }}>RETURN TO MENU</button>
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
  const [screen, setScreen] = useState<'loading' | 'title' | 'menu'>('loading');
  const [openTitleOptions, setOpenTitleOptions] = useState(false);
  return (
    <div className="portfolio-app">
      <SwordCursor />
      <AnimatePresence mode="wait">
        {screen === 'loading' && <LoadingScreen key="loading" onComplete={() => setScreen('title')} />}
        {screen === 'title' && !openTitleOptions && (
          <TitleScreen key="title" onContinue={() => setScreen('menu')} onOptions={() => setOpenTitleOptions(true)} />
        )}
        {screen === 'title' && openTitleOptions && (
          <motion.div className="title-options-backdrop" key="title-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="title-options">
              <div className="panel-topline"><span>SETTINGS</span><button type="button" onClick={() => setOpenTitleOptions(false)} aria-label="Close settings"><X size={17} /></button></div>
              <p>Interface motion and input are ready for the archive.</p>
              <button className="game-action-button primary" type="button" onClick={() => setOpenTitleOptions(false)}>RETURN</button>
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;