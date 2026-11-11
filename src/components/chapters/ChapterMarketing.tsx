import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useGsap } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { Counter, Reveal } from '../Reveal';
import { ExploreButton, SPECIALTY_PICTURES, SpecialtyPicture, entryFor, type ChapterProps } from './shared';

const CURVE = 'M0,214 C70,206 110,168 170,160 S270,176 330,122 S450,74 520,58 S575,36 600,26';
const NODES = [
  [0, 214],
  [170, 160],
  [330, 122],
  [520, 58],
];
const BARS = [100, 74, 50, 34];

/** Chapter 03: a strategy board. A drawn growth line, a funnel and an audience map: diagrams, not data. */
export default function ChapterMarketing({ index, chapter, onExplore, pieces, onOpenProject }: ChapterProps) {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();

  useGsap(root, (s) => {
    const path = root.current?.querySelector<SVGPathElement>('[data-curve]');
    const trigger = { trigger: '[data-board]', start: 'top 75%', once: true };
    if (path) {
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: trigger });
    }
    gsap.from('[data-area]', { autoAlpha: 0, duration: 1.4, delay: 1.2, scrollTrigger: trigger });
    gsap.from('[data-node]', { scale: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(2.4)', stagger: 0.45, delay: 0.2, scrollTrigger: trigger });
    gsap.from('[data-funnel]', {
      scaleX: 0,
      transformOrigin: s === 1 ? '0% 50%' : '100% 50%',
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-funnels]', start: 'top 88%', once: true },
    });
    gsap.from('[data-ring]', {
      scale: 0,
      transformOrigin: '50% 50%',
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.14,
      scrollTrigger: { trigger: '[data-rings]', start: 'top 88%', once: true },
    });
    gsap.to('[data-orbit]', { rotation: 360, svgOrigin: '100 100', duration: 26, ease: 'none', repeat: -1 });
    gsap.fromTo('[data-photo]', { clipPath: s === 1 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '[data-photo]', start: 'top 85%', once: true } });
    // Settles before the picture reaches the middle of the screen, so the whole picture is then in view.
    gsap.fromTo('[data-photo] img', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-photo]', start: 'top bottom', end: 'center 60%', scrub: true } });
  });

  return (
    <article ref={root} id="chapter-3" className="relative overflow-hidden bg-mist px-5 py-24 text-navy md:px-10 md:py-40">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="label flex items-baseline gap-4 text-navy/60">
            {t.expertise.chapter}
            <Counter value={3} className="font-display text-5xl font-extralight tracking-normal text-electric" />
          </p>
          <h3 className="mt-8 font-display text-[clamp(2.8rem,6.6vw,7.5rem)] uppercase leading-[var(--lh-display)] tracking-[var(--track-display)]" aria-label={chapter.title}>
            <span aria-hidden="true" className="block font-extralight">
              {chapter.lines[0]}
            </span>
            <span aria-hidden="true" className="block font-extrabold">
              {chapter.lines[1]}
            </span>
          </h3>
          <Reveal text={chapter.desc} stagger={0.012} className="mt-8 max-w-[40ch] text-lg leading-relaxed text-navy/80" />
          <ExploreButton index={index} onExplore={onExplore} className="mt-8" />
          <SpecialtyPicture picture={SPECIALTY_PICTURES.marketing} piece={entryFor(pieces, SPECIALTY_PICTURES.marketing.slug)} fallbackAlt={chapter.title} tone="light" onOpen={onOpenProject} className="mt-12 lg:mt-16" />
        </div>

        <div data-board className="lg:col-span-7">
          {/* Growth line */}
          <div className="border-y border-navy/15 py-6">
            <svg viewBox="0 0 600 240" className="h-auto w-full overflow-visible rtl:-scale-x-100" role="img" aria-label={t.expertise.illustrative}>
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1769FF" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#1769FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[60, 120, 180].map((y) => (
                <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#071426" strokeOpacity="0.1" strokeDasharray="2 6" />
              ))}
              <path data-area d={`${CURVE} L600,240 L0,240 Z`} fill="url(#area)" />
              <path data-curve d={CURVE} fill="none" stroke="#1769FF" strokeWidth="2.5" strokeLinecap="round" />
              {NODES.map(([x, y]) => (
                <g key={x} data-node>
                  <circle cx={x} cy={y} r="9" fill="#F3F5F8" stroke="#1769FF" strokeWidth="2" />
                  <circle cx={x} cy={y} r="3" fill="#071426" />
                </g>
              ))}
            </svg>
            <ol className="label mt-5 grid grid-cols-4 gap-2 text-navy/70">
              {t.expertise.funnel.map((label, i) => (
                <li key={label}>
                  <span className="latin block text-electric">0{i + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            {/* Funnel */}
            <ul data-funnels className="space-y-4">
              {t.expertise.funnel.map((label, i) => (
                <li key={label}>
                  <span className="label text-navy/70">{label}</span>
                  <span className="mt-2 block h-2 bg-navy/10">
                    <span data-funnel className="block h-full bg-electric" style={{ width: `${BARS[i]}%`, opacity: 1 - i * 0.16 }} />
                  </span>
                </li>
              ))}
            </ul>

            {/* Audience map */}
            <div data-rings className="relative mx-auto aspect-square w-full max-w-[280px]">
              <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible" aria-hidden="true">
                <circle data-ring cx="100" cy="100" r="96" fill="none" stroke="#071426" strokeOpacity="0.2" />
                <circle data-ring cx="100" cy="100" r="64" fill="none" stroke="#1769FF" strokeOpacity="0.6" />
                <circle data-ring cx="100" cy="100" r="30" fill="#1769FF" />
                <g data-orbit>
                  <circle cx="100" cy="4" r="4" fill="#071426" />
                  <circle cx="164" cy="100" r="3" fill="#1769FF" />
                  <circle cx="32" cy="168" r="3" fill="#071426" />
                </g>
              </svg>
              <span className="label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">{t.expertise.rings[0]}</span>
              <span className="label absolute left-1/2 top-[21%] -translate-x-1/2 text-navy/70">{t.expertise.rings[1]}</span>
              <span className="label absolute left-1/2 top-[4%] -translate-x-1/2 bg-mist px-2 text-navy/70">{t.expertise.rings[2]}</span>
            </div>
          </div>

          <p className="label mt-8 text-navy/50">{t.expertise.illustrative}</p>
        </div>
      </div>
    </article>
  );
}
