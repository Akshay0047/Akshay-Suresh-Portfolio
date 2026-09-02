import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronRight,
  CircleDot,
  Code2,
  Crosshair,
  Layers3,
  Mail,
  Menu,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Project = {
  index: string;
  title: string;
  type: string;
  year: string;
  description: string;
  stack: string[];
  detail: string;
};

const projects: Project[] = [
  {
    index: '01',
    title: 'Authentication & Profile Management',
    type: 'FULL-STACK SYSTEM',
    year: '2025',
    description: 'A considered account layer: secure access, profile state, and the quiet mechanics behind a good first session.',
    stack: ['React', 'Django REST Framework', 'MongoDB'],
    detail: 'Designed the boundary between identity and experience with token-aware flows, editable profile state, and a focused React surface. Built to make complex account actions feel legible.',
  },
  {
    index: '02',
    title: 'User Management',
    type: 'ADMINISTRATION TOOL',
    year: '2025',
    description: 'A deliberate interface for the people, roles, and permissions that keep a product moving.',
    stack: ['React', 'Redux Toolkit', 'Django REST Framework'],
    detail: 'Explored data-dense interaction patterns with predictable state, role-aware views, and a workflow that stays readable under pressure.',
  },
  {
    index: '03',
    title: 'AI Discord Chatbot',
    type: 'CONVERSATIONAL TOOL',
    year: '2024',
    description: 'A responsive bot layer for turning a Discord channel into a more useful room.',
    stack: ['Python', 'JavaScript'],
    detail: 'Built the service around fast responses and a clear command vocabulary, keeping the technical machinery out of the way of the conversation.',
  },
  {
    index: '04',
    title: 'Emotion-Based Song Recommendation',
    type: 'EXPERIMENTAL PRODUCT',
    year: '2024',
    description: 'A small study in translating feeling into an actionable listening direction.',
    stack: ['Python', 'JavaScript'],
    detail: 'Connected emotion-led inputs to a music discovery experience, treating recommendation as a human moment rather than a list of results.',
  },
  {
    index: '05',
    title: 'JavaScript Games',
    type: 'INTERACTION STUDIES',
    year: '2023–24',
    description: 'Small games built to understand timing, feedback, and why a good interaction feels inevitable.',
    stack: ['JavaScript'],
    detail: 'A collection of browser experiments that sharpened instincts around game loops, input, pacing, and the satisfying weight of a well-made button.',
  },
];

const attributes = [
  { name: 'REACT', value: 89, note: 'interfaces / systems' },
  { name: 'PYTHON', value: 84, note: 'logic / services' },
  { name: 'DJANGO REST', value: 81, note: 'apis / architecture' },
  { name: 'JAVASCRIPT', value: 86, note: 'interaction / web' },
  { name: 'MONGODB', value: 73, note: 'data / modeling' },
  { name: 'REDUX TOOLKIT', value: 77, note: 'state / scale' },
];

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Projects' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'chronicle', label: 'Chronicle' },
  { id: 'contact', label: 'Contact' },
];

function Crest({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'flex-col gap-2'}`} aria-label="AS monogram crest">
      <div className="relative grid h-11 w-11 place-items-center border border-[#b77950]/70 text-[#e4bd76]">
        <span className="display-font text-[23px] leading-none">AS</span>
        <span className="absolute -bottom-[4px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 border-b border-r border-[#b77950]/70 bg-[#11100e]" />
      </div>
      {!compact && <span className="mono-font text-[9px] tracking-[.34em] text-[#857d70]">FIELD NOTES</span>}
    </div>
  );
}

function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        left: `${(index * 37) % 100}%`,
        top: `${(index * 61 + 8) % 100}%`,
        size: 1 + (index % 3),
        delay: `${(index % 7) * 1.1}s`,
        duration: `${7 + (index % 5)}s`,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          className="ember"
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

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="mono-font text-[10px] tracking-[.24em] text-[#af4c2f]">{number}</span>
      <div className="h-px w-12 bg-[#af4c2f]/60" />
      <span className="section-marker">{children}</span>
    </div>
  );
}

function ScrollTo({ id, children, className = '', onClick }: { id: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <a
      className={className}
      href={`#${id}`}
      data-testid={`link-scroll-${id}`}
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}

function Home() {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-24% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const submitSignal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main className="portfolio-shell">
      <Particles />
      <div className="scanline pointer-events-none fixed left-0 top-0 z-[1] h-16 w-full bg-gradient-to-b from-transparent via-[#b77950]/[.05] to-transparent" />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#d8c8aa]/10 bg-[#11100e]">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
          <ScrollTo id="home" className="text-left">
            <Crest compact />
          </ScrollTo>
          <div className="hidden items-center gap-1 md:flex">
            {sections.map((section) => (
              <ScrollTo
                key={section.id}
                id={section.id}
                className={`nav-link px-4 py-3 mono-font text-[10px] uppercase tracking-[.2em] ${activeSection === section.id ? 'text-[#e4bd76]' : 'text-[#81786b]'}`}
              >
                <span className="mr-2 text-[#af4c2f]">{activeSection === section.id ? '◆' : '◇'}</span>
                {section.label}
              </ScrollTo>
            ))}
          </div>
          <button
            className="grid h-10 w-10 place-items-center border border-[#d8c8aa]/20 text-[#d8c8aa] md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            data-testid="button-toggle-navigation"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#d8c8aa]/10 bg-[#151310] px-5 pb-4 pt-2 md:hidden"
            >
              {sections.map((section) => (
                <ScrollTo
                  key={section.id}
                  id={section.id}
                  className="nav-link block border-b border-[#d8c8aa]/10 py-4 mono-font text-[10px] uppercase tracking-[.2em] text-[#aaa08f]"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mr-3 text-[#af4c2f]">0{sections.indexOf(section) + 1}</span>
                  {section.label}
                </ScrollTo>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section id="home" className="relative flex min-h-[720px] items-center overflow-hidden px-5 pb-20 pt-32 sm:px-8 lg:min-h-[850px] lg:px-14">
        <div className="vignette" />
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="relative z-10">
            <div className="mb-7 flex items-center gap-3 mono-font text-[10px] uppercase tracking-[.26em] text-[#a69b88]">
              <span className="inline-block h-2 w-2 animate-[pulseMark_2s_ease-in-out_infinite] rounded-full bg-[#af4c2f]" />
              Available for thoughtful builds
            </div>
            <h1 className="display-font max-w-[800px] text-[clamp(4.5rem,12vw,10.5rem)] font-medium leading-[.76] tracking-[-.055em] text-[#e5d8bd]">
              Akshay
              <span className="block pl-[.16em] text-[#af4c2f]">Suresh</span>
            </h1>
            <div className="mt-10 max-w-xl border-l border-[#af4c2f]/70 pl-5 sm:pl-7">
              <p className="display-font text-2xl leading-tight text-[#cbbda4] sm:text-3xl">
                Full-stack developer
                <br />
                <em className="text-[#8d8579]">with a strategist&apos;s patience.</em>
              </p>
              <p className="mt-5 max-w-md mono-font text-[11px] leading-6 text-[#847b6e]">
                Third-year Computer Science student at VIT Vellore. I build digital systems that hold their shape under pressure.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ScrollTo id="work" className="group flex items-center gap-3 bg-[#af4c2f] px-5 py-3 mono-font text-[10px] uppercase tracking-[.18em] text-[#170f0b] transition-colors hover:bg-[#d0784f]" >
                Inspect the work <ArrowDown size={14} className="transition-transform group-hover:translate-y-1" />
              </ScrollTo>
              <ScrollTo id="contact" className="flex items-center gap-2 border border-[#d8c8aa]/25 px-5 py-3 mono-font text-[10px] uppercase tracking-[.18em] text-[#c3b69d] transition-colors hover:border-[#e4bd76] hover:text-[#e4bd76]">
                <Mail size={14} /> Send a signal
              </ScrollTo>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: .2 }} className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute -inset-10 bg-[radial-gradient(circle,rgba(175,76,47,.13),transparent_66%)]" />
            <div className="bracket relative aspect-square border border-[#d8c8aa]/20 bg-[#181613]/65 p-6 sm:p-10">
              <div className="absolute left-6 top-6 mono-font text-[9px] tracking-[.2em] text-[#756d62]">CREST / 01</div>
              <div className="absolute right-6 top-6 flex items-center gap-2 mono-font text-[9px] tracking-[.15em] text-[#756d62]"><CircleDot size={11} className="text-[#af4c2f]" /> ONLINE</div>
              <div className="grid h-full place-items-center">
                <div className="relative grid h-[70%] w-[70%] place-items-center border border-[#d8c8aa]/25 rotate-45">
                  <div className="absolute inset-[12%] border border-[#af4c2f]/70" />
                  <div className="-rotate-45 text-center">
                    <span className="display-font block text-[clamp(5rem,14vw,9rem)] leading-[.7] text-[#e4bd76]">AS</span>
                    <span className="mt-7 block mono-font text-[9px] tracking-[.35em] text-[#988c79]">VIT / CSE</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div className="mono-font text-[9px] leading-5 text-[#756d62]">KERALA, INDIA<br />12° 31&apos; N / 76° 57&apos; E</div>
                <Crosshair size={20} strokeWidth={1} className="text-[#af4c2f]" />
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-5 flex items-center gap-4 sm:left-8 lg:left-14">
          <span className="mono-font text-[9px] tracking-[.22em] text-[#756d62]">SCROLL TO ENTER</span>
          <div className="h-px w-16 bg-[#d8c8aa]/30" />
        </div>
      </section>

      <section id="work" className="relative border-t border-[#d8c8aa]/10 px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
        <div className="mx-auto max-w-[1440px]">
          <SectionLabel number="01">Project archive</SectionLabel>
          <div className="mb-14 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <h2 className="display-font text-6xl leading-[.84] text-[#e5d8bd] sm:text-8xl">Built<br /><span className="text-[#af4c2f]">with intent.</span></h2>
            <div className="max-w-lg lg:justify-self-end">
              <p className="mono-font text-[11px] leading-6 text-[#958b7b]">A growing archive of systems, experiments, and small acts of stubbornness. Select an entry to inspect the thinking behind it.</p>
              <div className="mt-7 flex items-center gap-3 mono-font text-[9px] uppercase tracking-[.2em] text-[#af4c2f]"><Layers3 size={14} /> {projects.length} records indexed</div>
            </div>
          </div>
          <div className="border-y border-[#d8c8aa]/20">
            {projects.map((project, index) => (
              <button
                key={project.index}
                className="project-row group grid w-full grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-[#d8c8aa]/15 px-2 py-6 text-left last:border-b-0 sm:grid-cols-[60px_1fr_180px_110px_20px] sm:gap-6 sm:px-4 sm:py-7"
                onClick={() => setSelectedProject(project)}
                data-testid={`button-project-${index + 1}`}
              >
                <span className="mono-font text-[11px] text-[#af4c2f]">{project.index}</span>
                <span className="min-w-0">
                  <span className="display-font block truncate text-2xl text-[#d7c9b1] transition-colors group-hover:text-[#e4bd76] sm:text-3xl">{project.title}</span>
                  <span className="mt-2 block mono-font text-[9px] uppercase tracking-[.16em] text-[#756d62] sm:hidden">{project.type}</span>
                </span>
                <span className="hidden mono-font text-[9px] uppercase tracking-[.16em] text-[#81786b] sm:block">{project.type}</span>
                <span className="hidden mono-font text-[10px] text-[#81786b] sm:block">{project.year}</span>
                <ChevronRight size={17} className="text-[#756d62] transition-transform group-hover:translate-x-1 group-hover:text-[#e4bd76]" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="attributes" className="relative overflow-hidden border-t border-[#d8c8aa]/10 bg-[#151310] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionLabel number="02">Technical attributes</SectionLabel>
            <h2 className="display-font text-6xl leading-[.83] text-[#e5d8bd] sm:text-8xl">Tools of<br /><span className="text-[#af4c2f]">the trade.</span></h2>
            <p className="mt-9 max-w-sm mono-font text-[11px] leading-6 text-[#958b7b]">The stack is a means, never the identity. These are the instruments I reach for when a problem needs to become a reliable experience.</p>
            <div className="mt-12 flex items-center gap-4 border-l border-[#af4c2f] pl-5">
              <Code2 size={22} strokeWidth={1} className="text-[#e4bd76]" />
              <span className="mono-font text-[10px] leading-5 text-[#aa9e89]">CURRENT LOADOUT<br /><b className="font-normal text-[#e4bd76]">WEB / API / STATE</b></span>
            </div>
          </div>
          <div className="bracket self-center p-6 sm:p-10">
            <div className="mb-9 flex items-center justify-between border-b border-[#d8c8aa]/15 pb-4 mono-font text-[9px] uppercase tracking-[.2em] text-[#756d62]"><span>Proficiency matrix</span><span>0 — 100</span></div>
            <div className="space-y-7">
              {attributes.map((attribute, index) => (
                <div key={attribute.name}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="mono-font text-[10px] tracking-[.12em] text-[#d2c4aa]">{attribute.name}</span>
                    <span className="mono-font text-[9px] text-[#756d62]">{attribute.note} / {attribute.value}</span>
                  </div>
                  <div className="h-[3px] bg-[#302b25]">
                    <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .9, delay: index * .08 }} className="attribute-fill h-full bg-[#af4c2f]" style={{ width: `${attribute.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-between mono-font text-[8px] uppercase tracking-[.18em] text-[#655f56]"><span>learning never stops</span><Sparkles size={13} className="text-[#af4c2f]" /></div>
          </div>
        </div>
      </section>

      <section id="chronicle" className="relative px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
        <div className="mx-auto max-w-[1440px]">
          <SectionLabel number="03">The chronicle</SectionLabel>
          <div className="grid gap-16 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <h2 className="display-font max-w-2xl text-6xl leading-[.82] text-[#e5d8bd] sm:text-8xl">Still<br /><span className="text-[#af4c2f]">becoming.</span></h2>
              <p className="mt-10 max-w-xl display-font text-2xl leading-tight text-[#c2b49b] sm:text-3xl">I am interested in the space where engineering discipline meets the feeling of discovery.</p>
              <p className="mt-7 max-w-lg mono-font text-[11px] leading-6 text-[#8b8274]">From Kerala to Vellore, the work has always been a way to ask better questions. I study Computer Science at VIT Vellore, then test what I learn by making things people can actually use.</p>
            </div>
            <div className="relative border-l border-[#af4c2f]/60 pl-7 sm:pl-12">
              <div className="absolute -left-[5px] top-1 h-[9px] w-[9px] rotate-45 bg-[#af4c2f]" />
              <div className="mb-14">
                <span className="mono-font text-[10px] tracking-[.2em] text-[#af4c2f]">JUN — JUL 2026</span>
                <h3 className="mt-3 display-font text-4xl text-[#e2d4b8]">Full-stack intern</h3>
                <p className="mt-2 mono-font text-[10px] uppercase tracking-[.16em] text-[#756d62]">Antlegs Technology Solutions</p>
                <p className="mt-5 max-w-md mono-font text-[11px] leading-6 text-[#8b8274]">An upcoming chapter in building production-minded systems with a team.</p>
              </div>
              <div>
                <span className="mono-font text-[10px] tracking-[.2em] text-[#af4c2f]">DISTINCTION / 2024</span>
                <h3 className="mt-3 display-font text-4xl text-[#e2d4b8]">3rd place — IEEE CTF</h3>
                <p className="mt-5 max-w-md mono-font text-[11px] leading-6 text-[#8b8274]">A competitive reminder that the most useful skill is staying curious when the obvious path closes.</p>
                <div className="mt-6 flex items-center gap-3 text-[#e4bd76]"><Trophy size={19} strokeWidth={1} /><span className="mono-font text-[9px] uppercase tracking-[.18em]">Signal acquired</span></div>
              </div>
            </div>
          </div>
          <div className="mt-24 grid border-y border-[#d8c8aa]/15 py-8 sm:grid-cols-3 sm:divide-x sm:divide-[#d8c8aa]/15">
            <div className="py-3 sm:px-8 sm:first:pl-0"><span className="display-font text-5xl text-[#e4bd76]">9.24</span><span className="ml-3 mono-font text-[9px] uppercase tracking-[.18em] text-[#756d62]">CGPA / VIT</span></div>
            <div className="py-3 sm:px-8"><span className="display-font text-5xl text-[#e4bd76]">05</span><span className="ml-3 mono-font text-[9px] uppercase tracking-[.18em] text-[#756d62]">Project records</span></div>
            <div className="py-3 sm:px-8"><span className="display-font text-5xl text-[#e4bd76]">01</span><span className="ml-3 mono-font text-[9px] uppercase tracking-[.18em] text-[#756d62]">CTF distinction</span></div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative border-t border-[#d8c8aa]/10 bg-[#191512] px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[1fr_.85fr]">
          <div>
            <SectionLabel number="04">Open channel</SectionLabel>
            <h2 className="display-font text-6xl leading-[.82] text-[#e5d8bd] sm:text-8xl">Make<br /><span className="text-[#af4c2f]">contact.</span></h2>
            <p className="mt-9 max-w-md mono-font text-[11px] leading-6 text-[#958b7b]">Have a product, puzzle, or problem worth giving some attention to? Leave a signal. I read every one.</p>
            <a href="mailto:" className="mt-8 inline-flex items-center gap-3 text-[#e4bd76] transition-colors hover:text-[#f0d9a7]" data-testid="link-email-contact"><Mail size={17} /> <span className="mono-font text-[11px] tracking-[.12em]">Open email channel</span><ArrowUpRight size={14} /></a>
          </div>
          <form onSubmit={submitSignal} className="bracket p-6 sm:p-10" data-testid="form-contact-signal">
            <div className="mb-8 flex items-center justify-between mono-font text-[9px] uppercase tracking-[.2em] text-[#756d62]"><span>Transmit a message</span><Radio size={14} className={sent ? 'text-[#e4bd76]' : 'text-[#af4c2f]'} /></div>
            {sent ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <ShieldCheck size={34} strokeWidth={1} className="mb-5 text-[#e4bd76]" />
                <h3 className="display-font text-4xl text-[#e4bd76]">Signal received.</h3>
                <p className="mt-3 mono-font text-[10px] leading-5 text-[#8b8274]">The channel is open. I&apos;ll be in touch.</p>
                <button type="button" onClick={() => setSent(false)} className="mt-8 mono-font text-[9px] uppercase tracking-[.18em] text-[#af4c2f] hover:text-[#e4bd76]" data-testid="button-send-another">Transmit another</button>
              </div>
            ) : (
              <>
                <label className="mb-7 block"><span className="mb-2 block mono-font text-[9px] uppercase tracking-[.18em] text-[#81786b]">Your name</span><input required name="name" className="w-full border-b border-[#d8c8aa]/25 bg-transparent px-0 py-3 mono-font text-[12px] text-[#e5d8bd] outline-none transition-colors placeholder:text-[#514c45] focus:border-[#af4c2f]" placeholder="Identify yourself" data-testid="input-contact-name" /></label>
                <label className="mb-7 block"><span className="mb-2 block mono-font text-[9px] uppercase tracking-[.18em] text-[#81786b]">Your email</span><input required type="email" name="email" className="w-full border-b border-[#d8c8aa]/25 bg-transparent px-0 py-3 mono-font text-[12px] text-[#e5d8bd] outline-none transition-colors placeholder:text-[#514c45] focus:border-[#af4c2f]" placeholder="name@domain.com" data-testid="input-contact-email" /></label>
                <label className="mb-8 block"><span className="mb-2 block mono-font text-[9px] uppercase tracking-[.18em] text-[#81786b]">The brief</span><textarea required name="message" rows={3} className="w-full resize-none border-b border-[#d8c8aa]/25 bg-transparent px-0 py-3 mono-font text-[12px] text-[#e5d8bd] outline-none transition-colors placeholder:text-[#514c45] focus:border-[#af4c2f]" placeholder="What are we building?" data-testid="input-contact-message" /></label>
                <button type="submit" className="group flex items-center gap-3 bg-[#af4c2f] px-5 py-3 mono-font text-[10px] uppercase tracking-[.18em] text-[#170f0b] hover:bg-[#d0784f]" data-testid="button-submit-contact">Send signal <Send size={14} className="transition-transform group-hover:translate-x-1" /></button>
              </>
            )}
          </form>
        </div>
      </section>

      <footer className="border-t border-[#d8c8aa]/10 px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><Crest compact /><span className="mono-font text-[9px] tracking-[.18em] text-[#756d62]">AKSHAY SURESH / PORTFOLIO</span></div>
          <div className="flex items-center gap-5 mono-font text-[9px] uppercase tracking-[.18em] text-[#756d62]"><span>Built in Kerala</span><span className="text-[#af4c2f]">◆</span><a href="mailto:" className="hover:text-[#e4bd76]" data-testid="link-email-footer">Email</a></div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#090807]/85 p-5" role="dialog" aria-modal="true" aria-label={`${selectedProject.title} details`} onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="bracket relative w-full max-w-2xl border border-[#d8c8aa]/30 bg-[#1a1713] p-7 sm:p-12" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => setSelectedProject(null)} className="absolute right-5 top-5 text-[#81786b] hover:text-[#e4bd76]" aria-label="Close project details" data-testid="button-close-project"><X size={18} /></button>
              <div className="mb-7 flex items-center gap-4 mono-font text-[9px] uppercase tracking-[.2em] text-[#af4c2f]"><span>{selectedProject.index}</span><span className="h-px w-8 bg-[#af4c2f]/60" /><span>{selectedProject.type}</span></div>
              <h3 className="display-font max-w-xl text-5xl leading-[.88] text-[#e5d8bd] sm:text-6xl">{selectedProject.title}</h3>
              <p className="mt-7 max-w-xl display-font text-2xl leading-tight text-[#c4b69e]">{selectedProject.description}</p>
              <p className="mt-6 max-w-xl mono-font text-[11px] leading-6 text-[#958b7b]">{selectedProject.detail}</p>
              <div className="mt-9 flex flex-wrap gap-2">{selectedProject.stack.map((tech) => <span key={tech} className="border border-[#d8c8aa]/20 px-3 py-2 mono-font text-[9px] uppercase tracking-[.14em] text-[#a69b88]">{tech}</span>)}</div>
              <div className="mt-10 flex items-center gap-3 text-[#756d62]"><Terminal size={15} /><span className="mono-font text-[9px] uppercase tracking-[.17em]">Inspection complete / {selectedProject.year}</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
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