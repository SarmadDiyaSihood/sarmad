import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { sound } from './sound';

let lenis: Lenis | null = null;
let locks = 0;
let reducedMotion = false;

/** Smooth scrolling (Lenis) driven by the GSAP ticker. Skipped for reduced motion. */
export function initScroll(reduced: boolean) {
  reducedMotion = reduced;
  if (reduced) return () => {};
  const instance = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis = instance;
  instance.on('scroll', ScrollTrigger.update);
  const raf = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  if (locks > 0) instance.stop();
  return () => {
    gsap.ticker.remove(raf);
    instance.destroy();
    lenis = null;
  };
}

export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!immediate) sound.play('nav');
  if (lenis) {
    lenis.scrollTo(el, { immediate, force: true, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    el.scrollIntoView({ behavior: immediate || reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

/** Locks page scroll (used by the intro and overlays). Returns the unlock function. */
export function lockScroll() {
  locks += 1;
  document.documentElement.classList.add('is-locked');
  lenis?.stop();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.documentElement.classList.remove('is-locked');
      lenis?.start();
    }
  };
}

/** Jumps straight to a vertical position (used to restore the reading position after a language switch). */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}

// How fast the page is scrolling, measured from one scroll event to the next.
let speedY = window.scrollY;
let speedAt = 0;
let speed = 0;
window.addEventListener(
  'scroll',
  () => {
    const now = performance.now();
    if (now > speedAt) speed = (Math.abs(window.scrollY - speedY) / (now - speedAt)) * 1000;
    speedY = window.scrollY;
    speedAt = now;
  },
  { passive: true },
);

/** The page's current scrolling speed in pixels per second (0 once it has come to rest). */
export function scrollSpeed() {
  return performance.now() - speedAt > 250 ? 0 : speed;
}
