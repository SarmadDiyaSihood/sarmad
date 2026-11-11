import { createElement, Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useLang } from '../context/LanguageContext';

const ARABIC = /[\u0600-\u06FF]/;

/**
 * Splits text into masked pieces for clip reveals.
 * Arabic is never split into letters (that would break the joined script): it is split by word.
 */
export function Split({ text, by = 'word' }: { text: string; by?: 'word' | 'char' }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          {by === 'char' && !ARABIC.test(word) ? (
            <span className="inline-block whitespace-nowrap">
              {[...word].map((ch, j) => (
                <span key={j} className="rv-mask">
                  <span className="rv-inner">{ch}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className="rv-mask">
              <span className="rv-inner">{word}</span>
            </span>
          )}
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

interface RevealProps {
  text: string;
  as?: 'p' | 'h2' | 'h3' | 'span' | 'div';
  className?: string;
  delay?: number;
  stagger?: number;
  start?: string;
}

/** Scroll-triggered word reveal: each word rises out of its own mask. */
export function Reveal({ text, as = 'p', className, delay = 0, stagger = 0.022, start = 'top 88%' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const { lang } = useLang();

  useLayoutEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('.rv-inner'), {
        yPercent: 118,
        duration: 1.05,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: { trigger: el, start, once: true },
      });
    });
    return () => ctx.revert();
  }, [reduced, lang, text, delay, stagger, start]);

  return createElement(as, { ref, className }, <Split text={text} />);
}

const pad = (n: number) => String(Math.round(n)).padStart(2, '0');

/** Section / chapter number that counts up when it scrolls into view. */
export function Counter({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { lang } = useLang();

  useLayoutEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const state = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        v: value,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = pad(state.v);
        },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
    return () => {
      ctx.revert();
      el.textContent = pad(value);
    };
  }, [reduced, lang, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {pad(value)}
    </span>
  );
}

/** Slate-style section label: SC.02 — label. */
export function SceneLabel({ n, label, className = '' }: { n: number; label: string; className?: string }) {
  return (
    <div className={`label flex items-center gap-4 ${className}`}>
      <span className="latin">
        SC.<Counter value={n} />
      </span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
      <span>{label}</span>
    </div>
  );
}

/** Running film timecode (HH:MM:SS:FF at 24 fps) since the component mounted. */
export function Timecode({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const startTime = performance.now();
    let raf = 0;
    let last = -1;
    const loop = (now: number) => {
      const frames = Math.floor(((now - startTime) / 1000) * 24);
      if (frames !== last) {
        last = frames;
        const secs = Math.floor(frames / 24);
        el.textContent = `00:${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}:${pad(frames % 24)}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <span ref={ref} className={`latin tabular-nums ${className}`}>
      00:00:00:00
    </span>
  );
}
