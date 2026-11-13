import { useEffect, useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import CountUp from '@/components/CountUp';
import FadeContent from '@/components/FadeContent';
import GradientText from '@/components/GradientText';
import Particles from '@/components/Particles';
import PillNav, { type PillNavItem } from '@/components/PillNav';
import SplitText from '@/components/SplitText';
import SpotlightCard from '@/components/SpotlightCard';
import { about, contact, memories, profile, projects, technicalSkills } from '@/portfolios/valorant/data.js';
import './landing.css';

const NAV: PillNavItem[] = [
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const STATS = [
  { label: 'CGPA', detail: 'VIT Vellore', to: 9.24, decimals: 2 },
  { label: 'Class XII', detail: 'CBSE', to: 97.4, decimals: 1, suffix: '%' },
  { label: 'JEE Main', detail: 'Percentile', to: 96.66, decimals: 2 },
] as const;

const FACT_LABELS: Record<string, string> = {
  ORIGIN: 'Origin',
  CLASS: 'Focus',
  INTERESTS: 'Interests',
  ARMAMENT: 'Stack',
};

const CHANNELS = [
  ...contact.channels,
  { label: 'GITHUB', value: 'github.com/Akshay0047', href: profile.github },
  { label: 'LINKEDIN', value: 'linkedin.com/in/akshay47suresh', href: profile.linkedin },
];

function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToSection(href: string) {
  const node = document.getElementById(href.slice(1));
  const scroller = document.getElementById('landing-scroll');
  if (!node || !scroller) return;
  const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 72;
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  window.requestAnimationFrame(() => {
    scroller.scrollTo({ top: Math.max(0, top), behavior });
  });
}

function SectionLink({ href, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || typeof href !== 'string' || !href.startsWith('#')) return;
        event.preventDefault();
        scrollToSection(href);
      }}
    >
      {children}
    </a>
  );
}

function useActiveSection() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const root = document.getElementById('landing-scroll');
    if (!root) return;
    const ids = NAV.map((item) => item.href?.slice(1)).filter((id): id is string => Boolean(id));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node instanceof HTMLElement);
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        const current = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0];
        setActive(current && current[1] > 0 ? `#${current[0]}` : '');
      },
      { root, rootMargin: '-18% 0px -55% 0px', threshold: [0, 0.2, 0.45, 0.7] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return [active, setActive] as const;
}

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

function warmupAllowed() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return connection.effectiveType !== '2g' && connection.effectiveType !== 'slow-2g';
}

function afterPaint() {
  return new Promise<void>((resolve) => {
    const wait = () => window.setTimeout(resolve, 1000);
    if ('requestIdleCallback' in window) window.requestIdleCallback(wait, { timeout: 1500 });
    else window.setTimeout(wait, 1500);
  });
}

export default function Landing() {
  const [active, setActive] = useActiveSection();
  const [reduced, setReduced] = useState(false);
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const valorantBoosted = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setPhone(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!warmupAllowed()) return undefined;
    let cancelled = false;
    const phoneQuery = window.matchMedia('(max-width: 767px)');
    void (async () => {
      try {
        await afterPaint();
        if (cancelled) return;
        const { warmValorantAssets } = await import('@/portfolios/valorant/assetPreload.js');
        if (cancelled) return;
        await warmValorantAssets('map');
        if (cancelled || phoneQuery.matches) return;
        await warmValorantAssets('entry');
        if (cancelled || phoneQuery.matches) return;
        await warmValorantAssets('rest');
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const boostValorant = () => {
    if (valorantBoosted.current || !warmupAllowed()) return;
    valorantBoosted.current = true;
    void import('@/portfolios/valorant/assetPreload.js')
      .then(({ warmValorantAssets }) => warmValorantAssets('entry').then(() => warmValorantAssets('rest')))
      .catch((error) => console.error(error));
    void import('@/portfolios/valorant/ValorantPortfolio.jsx').catch((error) => console.error(error));
  };

  const onItemClick = (item: PillNavItem, _index: number, event: MouseEvent) => {
    if (!item.href) return;
    event.preventDefault();
    setActive(item.href);
    scrollToSection(item.href);
  };

  return (
    <div id="landing-scroll" className="landing relative h-full overflow-y-auto" data-testid="landing">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Particles
          className="pointer-events-none"
          particleCount={phone ? 40 : 110}
          particleSpread={11}
          speed={0.08}
          particleColors={['#f4f1ea', '#e4d5c2', '#b7a898']}
          moveParticlesOnHover={!phone}
          particleHoverFactor={phone ? 0 : 0.4}
          particleBaseSize={110}
          sizeRandomness={0.8}
          cameraDistance={18}
          disableRotation
          shape="circle"
          glow={0.4}
          twinkle={0.28}
          connections={false}
          hoverEffect="parallax"
          clickBurst={false}
          drift="none"
          opacity={0.8}
          paused={reduced}
          pixelRatio={1}
        />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,8,0.12)_58%,rgba(7,7,8,0.55)_100%)]"
        aria-hidden="true"
      />

      <header className="sticky top-0 z-30 bg-[#070708]/50 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex w-full max-w-6xl md:justify-between">
          <PillNav
            className="w-full md:w-auto"
            logo={<span className="text-[12px] font-medium tracking-[0.2em]">AS</span>}
            logoAlt="Akshay Suresh"
            logoHref="#top"
            items={NAV}
            activeHref={active}
            onItemClick={onItemClick}
            linkComponent={SectionLink}
            theme="dark"
            layout="split"
            size="sm"
            surface="glass"
            itemStyle="plain"
            hoverEffect="fill"
            indicator="dot"
            collapse="auto"
            highlightColor="#f4f1ea"
            highlightTextColor="#111111"
            ariaLabel="Page sections"
          />
        </div>
      </header>

      <main className="relative z-10">
        <section id="top" className="flex min-h-[calc(100%-4.25rem)] flex-col justify-end px-6 pb-16 md:px-10">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.42em] text-[#cbbba4]">{profile.location}</p>
            <SplitText
              text={profile.name}
              tag="h1"
              trigger="load"
              effect="rise"
              splitType="chars"
              delay={28}
              duration={0.9}
              textAlign="left"
              hoverEffect="none"
              className="landing-name mt-6 text-[#f4f1ea]"
            />
            <div className="role-line mt-6 max-w-xl text-xl leading-snug md:text-2xl">
              <GradientText
                colors={['#f7f3ec', '#e0d0ba', '#9a9086']}
                animationSpeed={16}
                yoyo
                variant="linear"
              >
                {profile.role}
              </GradientText>
            </div>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#f4f1ea]/70 md:text-lg">{about.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex h-11 items-center rounded-full bg-[#f4f1ea] px-5 text-sm font-medium text-[#111111] transition-colors hover:bg-white"
                href={`mailto:${profile.email}`}
              >
                Email
              </a>
              <a
                className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm text-[#f4f1ea] transition-colors hover:border-white/40"
                href={assetUrl(profile.resume)}
              >
                Resume
              </a>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6 sm:gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-[#f4f1ea]/45 sm:tracking-[0.18em]">{stat.label}</dt>
                  <dd className="mt-2 text-xl tracking-tight text-[#f4f1ea] sm:text-2xl md:text-3xl">
                    <CountUp to={stat.to} decimals={stat.decimals} suffix={'suffix' in stat ? stat.suffix : ''} duration={1.6} />
                  </dd>
                  <dd className="mt-1 text-xs text-[#f4f1ea]/45">{stat.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="work" className="px-6 py-16 md:py-24 md:px-10">
          <FadeContent container="#landing-scroll" className="mx-auto max-w-6xl" duration={0.8} blur={8}>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#cbbba4]">Selected work</p>
            <h2 className="mt-3 max-w-xl text-4xl tracking-tight md:text-5xl">Projects built to be used.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <SpotlightCard
                  key={project.title}
                  className="flex h-full flex-col !p-5 md:!p-8"
                  spotlightColor="#e7d7c3"
                  intensity={0.2}
                  spotlightSize={260}
                  softness={0.85}
                  borderGlow={0.45}
                  theme="dark"
                  style={{ ['--spotlight-card-surface' as string]: '#121211' }}
                >
                  <div className="flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-[#f4f1ea]/45">
                    <span>{project.type}</span>
                    <span>{project.year}</span>
                  </div>
                  <h3 className="mt-5 text-2xl tracking-tight">{project.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#f4f1ea]/70">{project.description}</p>
                  <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-[#f4f1ea]/40">
                    {project.stack.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {project.repoUrl ? (
                    <a
                      className="mt-8 inline-flex text-sm text-[#f4f1ea] underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-white"
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View repository
                    </a>
                  ) : null}
                </SpotlightCard>
              ))}
            </div>
          </FadeContent>
        </section>

        <section id="experience" className="px-6 py-16 md:py-24 md:px-10">
          <FadeContent container="#landing-scroll" className="mx-auto max-w-6xl" duration={0.8} blur={8}>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#cbbba4]">Experience</p>
            <h2 className="mt-3 text-4xl tracking-tight md:text-5xl">Study, work, and the record so far.</h2>
            <ol className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {memories.map((memory) => (
                <li key={`${memory.date}-${memory.title}`} className="grid gap-2 py-6 md:grid-cols-[11rem_9rem_1fr] md:gap-8">
                  <div className="flex items-baseline justify-between gap-3 md:contents">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#f4f1ea]/45">{memory.date}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#cbbba4]">{memory.category}</p>
                  </div>
                  <div>
                    <h3 className="text-lg tracking-tight">{memory.title}</h3>
                    {memory.subtitle ? <p className="mt-1 text-sm text-[#f4f1ea]/70">{memory.subtitle}</p> : null}
                    {memory.detail ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#f4f1ea]/55">{memory.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </FadeContent>
        </section>

        <section id="skills" className="px-6 py-16 md:py-24 md:px-10">
          <FadeContent container="#landing-scroll" className="mx-auto max-w-6xl" duration={0.8} blur={8}>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#cbbba4]">Skills</p>
            <h2 className="mt-3 max-w-xl text-4xl tracking-tight md:text-5xl">What I use to ship.</h2>
            <ul className="mt-12 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {technicalSkills.map((skill) => (
                <li key={skill.name} className="border-t border-white/10 py-4">
                  <p className="text-sm tracking-wide">{skill.name}</p>
                  <p className="mt-1 text-xs text-[#f4f1ea]/45">{skill.note}</p>
                </li>
              ))}
            </ul>
          </FadeContent>
        </section>

        <section id="about" className="px-6 py-16 md:py-24 md:px-10">
          <FadeContent container="#landing-scroll" className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_0.8fr]" duration={0.8} blur={8}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#cbbba4]">About</p>
              <h2 className="mt-3 text-4xl tracking-tight md:text-5xl">Open to internship and full-time roles.</h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#f4f1ea]/75 md:text-lg">{about.body}</p>
            </div>
            <dl className="grid content-end gap-6 sm:grid-cols-2 md:grid-cols-1">
              {about.facts.map((fact) => (
                <div key={fact.label} className="border-t border-white/10 pt-4">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-[#f4f1ea]/45">
                    {FACT_LABELS[fact.label] ?? fact.label}
                  </dt>
                  <dd className="mt-2 text-sm tracking-wide">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </FadeContent>
        </section>

        <section id="contact" className="px-6 py-16 md:py-24 md:px-10">
          <FadeContent container="#landing-scroll" className="mx-auto max-w-6xl" duration={0.8} blur={8}>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#cbbba4]">Contact</p>
            <h2 className="mt-3 max-w-xl text-4xl tracking-tight md:text-5xl">If there is a product to build, write.</h2>
            <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {CHANNELS.map((channel) => {
                const external = channel.href.startsWith('http');
                return (
                  <li key={channel.label}>
                    <a
                      className="flex min-w-0 flex-col gap-1 py-5 transition-colors hover:text-white md:flex-row md:items-baseline md:justify-between"
                      href={channel.href}
                      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    >
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#f4f1ea]/45">{channel.label}</span>
                      <span className="min-w-0 break-words text-lg tracking-tight md:text-2xl">{channel.value}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </FadeContent>
        </section>

        <section className="px-6 pb-20 pt-8 md:px-10" aria-label="Interactive experiences">
          <div className="mx-auto max-w-6xl border-t border-white/10 pt-16">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#f4f1ea]/45">Interactive experiences</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link
                to="/sekiro"
                className="group flex flex-col gap-3 rounded-3xl border border-white/10 px-6 py-8 transition-colors hover:border-[#d59b58]/50"
              >
                <span className="text-[11px] tracking-[0.22em] text-[#f4f1ea]/40">01</span>
                <span className="text-3xl tracking-tight transition-colors group-hover:text-[#d59b58] md:text-4xl">
                  Sekiro
                </span>
                <span className="text-sm text-[#f4f1ea]/55">Shadows Die Twice</span>
              </Link>
              <Link
                to="/valorant"
                className="group flex flex-col gap-3 rounded-3xl border border-white/10 px-6 py-8 transition-colors hover:border-[#ff4655]/50"
                onPointerEnter={boostValorant}
                onFocus={boostValorant}
              >
                <span className="text-[11px] tracking-[0.22em] text-[#f4f1ea]/40">02</span>
                <span className="text-3xl tracking-tight transition-colors group-hover:text-[#ff4655] md:text-4xl">
                  Valorant
                </span>
                <span className="text-sm text-[#f4f1ea]/55">Protocol</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
