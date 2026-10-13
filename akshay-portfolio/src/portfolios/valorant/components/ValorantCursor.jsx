import { useEffect, useRef } from 'react';

const BASE_GAP = 6;
const FIRE_GAP = 18;

/**
 * Tactical crosshair. The system cursor is hidden for the whole /valorant
 * route (see `.valorant-route` in valorant.css); this component is mounted
 * only there. Gap opens on mousedown and closes on mouseup, like recoil.
 */
export default function ValorantCursor() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('valorant-route');
    return () => document.documentElement.classList.remove('valorant-route');
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let gap = BASE_GAP;
    let gapTarget = BASE_GAP;
    let raf = 0;

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      root.dataset.visible = 'true';
    };
    const onDown = (event) => {
      if (event.button === 0) gapTarget = FIRE_GAP;
    };
    const onUp = () => {
      gapTarget = BASE_GAP;
    };
    const onLeave = () => {
      root.dataset.visible = 'false';
    };
    const onOver = (event) => {
      const interactive = event.target instanceof Element && event.target.closest('a, button, [role="tab"]');
      root.dataset.hover = interactive ? 'true' : 'false';
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.45;
      current.y += (target.y - current.y) * 0.45;
      gap += (gapTarget - gap) * (gapTarget > gap ? 0.55 : 0.22);
      root.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      root.style.setProperty('--gap', `${gap.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} className="vc-crosshair" data-visible="false" data-hover="false" data-testid="valorant-crosshair" aria-hidden="true">
      <i className="vc-dot" />
      <i className="vc-line vc-top" />
      <i className="vc-line vc-bottom" />
      <i className="vc-line vc-left" />
      <i className="vc-line vc-right" />
    </div>
  );
}
