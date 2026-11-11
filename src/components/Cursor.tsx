import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useMediaQuery } from '../lib/hooks';

type Mode = 'default' | 'link' | 'view';

/** Desktop-only custom cursor: a dot plus a trailing ring that grows over links and becomes a labelled disc over work. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('default');
  const [label, setLabel] = useState('');
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const active = fine && !reduced;

  useEffect(() => {
    if (!active || !dot.current || !ring.current) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    const els = [dot.current, ring.current];
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.1, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.1, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!shown) {
        shown = true;
        gsap.set(els, { x: e.clientX, y: e.clientY });
        gsap.to(els, { autoAlpha: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.('[data-cursor], a, button, input, textarea, label');
      if (!target) {
        setMode('default');
        return;
      }
      if (target.getAttribute('data-cursor') === 'view') {
        setLabel(target.getAttribute('data-cursor-label') ?? '');
        setMode('view');
      } else {
        setMode('link');
      }
    };
    const leave = () => {
      shown = false;
      gsap.to(els, { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseover', over);
    root.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseover', over);
      root.removeEventListener('mouseleave', leave);
      root.classList.remove('has-cursor');
    };
  }, [active]);

  if (!active) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      <div ref={ring} className="cursor-ring" data-mode={mode}>
        <i>
          <b>{label}</b>
        </i>
      </div>
      <div ref={dot} className="cursor-dot" data-mode={mode}>
        <i />
      </div>
    </div>
  );
}
