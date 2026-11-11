import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from './gsap';
import { lockScroll } from './scroll';
import { useLang } from '../context/LanguageContext';

/**
 * Runs a GSAP setup function inside a scoped context and reverts it on cleanup.
 * Skipped entirely for prefers-reduced-motion, so the default (visible) CSS state is what shows.
 * `s` is +1 in LTR and -1 in RTL.
 */
export function useGsap(scope: RefObject<Element | null>, setup: (s: 1 | -1) => void, deps: unknown[] = []) {
  const reduced = useReducedMotion();
  const { lang, s } = useLang();
  useLayoutEffect(() => {
    if (reduced || !scope.current) return;
    const ctx = gsap.context(() => setup(s), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, lang, ...deps]);
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Stack of open overlays so Escape only closes the top-most one.
const stack: Array<() => void> = [];
let listening = false;
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && stack.length) {
    e.preventDefault();
    stack[stack.length - 1]();
  }
}

/** Overlay behaviour: locks page scroll, closes on Escape, moves focus in and restores it on close. */
export function useOverlay(onClose: () => void, container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    const close = () => onClose();
    stack.push(close);
    if (!listening) {
      window.addEventListener('keydown', onKey);
      listening = true;
    }
    container.current?.focus({ preventScroll: true });
    return () => {
      unlock();
      const i = stack.indexOf(close);
      if (i >= 0) stack.splice(i, 1);
      previous?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
