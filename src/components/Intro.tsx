import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { lockScroll } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';
import { sound } from '../lib/sound';
import { Split } from './Reveal';

interface IntroProps {
  /** Fired the moment the letterbox starts to open: the hero begins its entrance. */
  onReveal: () => void;
  /** Fired when the opening sequence has fully left the screen. */
  onDone: () => void;
}

export default function Intro({ onReveal, onDone }: IntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const reduced = useReducedMotion();
  const { t, lang, s } = useLang();

  useEffect(() => lockScroll(), []);

  useLayoutEffect(() => {
    if (reduced) return;
    const origin = s === 1 ? '0% 50%' : '100% 50%';
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('[data-sys]', { autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 0.1)
        .from('[data-name] .rv-inner', { yPercent: 118, xPercent: 26 * s, duration: 1.3, stagger: 0.075 }, 0.35)
        .from('[data-rule]', { scaleX: 0, transformOrigin: origin, duration: 1.1, ease: 'expo.inOut' }, 0.85)
        .from('[data-tag]', { autoAlpha: 0, x: 12 * s, duration: 0.6, stagger: 0.16 }, 1.3)
        .from('[data-quote] .rv-inner', { yPercent: 118, duration: 0.9, stagger: 0.05 }, 2.0)
        .from('[data-enter]', { autoAlpha: 0, y: 14, duration: 0.7 }, 2.5);
    }, root);
    return () => ctx.revert();
  }, [reduced, lang, s]);

  const leave = () => {
    const el = root.current;
    if (leaving.current || !el) return;
    leaving.current = true;
    sound.play('transition');
    const q = gsap.utils.selector(el);
    if (reduced) {
      onReveal();
      gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: onDone });
      return;
    }
    gsap
      .timeline({ onComplete: onDone })
      .to(q('[data-content]'), { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power3.in' })
      .to(q('[data-line]'), { scaleX: 1, duration: 0.55, ease: 'expo.inOut' }, '-=0.2')
      .call(onReveal)
      .to(q('[data-top]'), { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '+=0.05')
      .to(q('[data-bottom]'), { yPercent: 100, duration: 1.15, ease: 'expo.inOut' }, '<')
      .to(q('[data-line]'), { autoAlpha: 0, duration: 0.4 }, '<');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-[100] text-white" role="dialog" aria-modal="true" aria-label={t.intro.system}>
      <div data-top className="grain absolute inset-x-0 top-0 h-[calc(50%+1px)] bg-navy" />
      <div data-bottom className="grain absolute inset-x-0 bottom-0 h-1/2 bg-navy" />
      <div data-line className="absolute inset-x-0 top-1/2 h-px bg-electric" style={{ transform: 'scaleX(0)' }} />

      <div data-content className="relative z-10 flex h-full flex-col justify-between px-5 py-6 md:px-10 md:py-8">
        <div className="flex items-start justify-between gap-6">
          <p data-sys className="label flex items-center gap-3 text-ice/80">
            <span className="rec-dot" aria-hidden="true" />
            {t.intro.system}
          </p>
          <button data-sys type="button" onClick={leave} className="label link-line -my-2 py-2 text-white/70 hover:text-white">
            {t.intro.skip}
          </button>
        </div>

        <div>
          <h1 data-name className="display intro-name" aria-label={t.intro.name}>
            <span aria-hidden="true">
              <Split text={t.intro.name} by="char" />
            </span>
          </h1>
          <div data-rule className="mt-5 h-px w-full bg-white/25 md:mt-8" />
          <p className="label mt-5 flex flex-wrap gap-x-6 gap-y-1 text-ice">
            {t.intro.tags.map((tag) => (
              <span data-tag key={tag}>
                {tag}
              </span>
            ))}
          </p>
        </div>

        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <p data-quote className="max-w-[20ch] text-[clamp(1.35rem,2.6vw,2.4rem)] font-light leading-[1.25]">
            <Split text={`\u201c${t.intro.quote}\u201d`} />
          </p>
          <button data-enter type="button" onClick={leave} className="btn label self-start md:self-auto">
            {t.intro.enter}
            <ArrowUpRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
