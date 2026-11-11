import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { gsap } from '../../lib/gsap';
import { useGsap, useMediaQuery } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { Counter, Reveal } from '../Reveal';
import { ExploreButton, SPECIALTY_PICTURES, SpecialtyPicture, entryFor, type ChapterProps } from './shared';
import ReverseSpecialty from './ReverseSpecialty';

type Token = [text: string, tone?: 'k' | 's' | 'f' | 'c'];
const TONES = { k: 'text-electric', s: 'text-ice', f: 'text-white', c: 'text-white/35' } as const;
const CODE: Token[][] = [
  [['// every story begins with an idea', 'c']],
  [['const', 'k'], [' story '], ['= {']],
  [['  idea'], [': '], ['"meaningful"', 's'], [',']],
  [['  media'], [': ['], ['"film"', 's'], [', '], ['"sound"', 's'], [', '], ['"image"', 's'], ['],']],
  [['  strategy'], [': (audience) => '], ['listen', 'f'], ['(audience),']],
  [['  build'], [': () => '], ['experience', 'f'], ['({ fast: '], ['true', 'k'], [', clear: '], ['true', 'k'], [' }),']],
  [['};']],
  [['']],
  [['export default', 'k'], [' '], ['deliver', 'f'], ['(story);']],
];
const PALETTE = ['#071426', '#1769FF', '#FFFFFF', '#DCEAFF', '#F3F5F8'];

/** Chapter 04: an interface. A draggable browser window with a code tab and a live preview tab. */
export default function ChapterTech({ index, chapter, onExplore, pieces, onOpenProject }: ChapterProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'code' | 'preview'>('code');
  const [swatch, setSwatch] = useState(1);
  const reduced = useReducedMotion();
  const canDrag = useMediaQuery('(hover: hover) and (pointer: fine)') && !reduced;
  const { t } = useLang();

  useGsap(root, () => {
    const trigger = { trigger: '[data-window]', start: 'top 80%', once: true };
    gsap.from('[data-window]', { y: 60, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: trigger });
    gsap.from('[data-code-line]', { autoAlpha: 0, x: -14, duration: 0.5, ease: 'power2.out', stagger: 0.11, delay: 0.5, scrollTrigger: trigger });
    gsap.from('[data-inspector]', { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', delay: 0.35, scrollTrigger: trigger });
    gsap.fromTo('[data-photo]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '[data-photo]', start: 'top 85%', once: true } });
    // Settles before the picture reaches the middle of the screen, so the whole picture is then in view.
    gsap.fromTo('[data-photo] img', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-photo]', start: 'top bottom', end: 'center 60%', scrub: true } });
    gsap.from('[data-title] .rv-line', {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '[data-title]', start: 'top 88%', once: true },
    });
  });

  return (
    <article ref={root} id="chapter-4" className="grain relative overflow-hidden bg-navy-deep px-5 py-24 text-white md:px-10 md:py-40">
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#DCEAFF_1px,transparent_1px),linear-gradient(to_bottom,#DCEAFF_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative z-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-6">
          <p className="label latin text-electric">
            {'<'}chapter n="<Counter value={4} />" {'/>'}
          </p>
          <h3 data-title className="display-2 mt-8 text-[clamp(2rem,4.5vw,5.2rem)]" aria-label={chapter.title}>
            {chapter.lines.map((line) => (
              <span key={line} aria-hidden="true" className="rv-mask block">
                <span className="rv-line block">{line}</span>
              </span>
            ))}
          </h3>
          <Reveal text={chapter.desc} stagger={0.012} className="mt-8 max-w-[38ch] text-lg leading-relaxed text-white/75" />
          <ExploreButton index={index} onExplore={onExplore} className="mt-8" />
        </div>

        <div ref={stage} className="relative min-w-0 lg:col-span-6" dir="ltr">
          <div data-window className="relative z-10 min-w-0">
          <motion.div
            drag={canDrag}
            dragConstraints={stage}
            dragElastic={0.18}
            dragSnapToOrigin
            whileDrag={{ scale: 1.015 }}
            className="overflow-hidden rounded-xl border border-white/15 bg-navy shadow-[0_40px_90px_-30px_rgba(23,105,255,0.45)]"
          >
            <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-3 ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}>
              <span aria-hidden="true" className="flex gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <i className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <i className="h-2.5 w-2.5 rounded-full bg-electric" />
              </span>
              <div role="tablist" className="latin flex text-[11px] tracking-[0.08em]">
                {(['code', 'preview'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`min-h-9 rounded-md px-3 transition-colors duration-300 ${tab === id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    {t.expertise.tabs[id]}
                  </button>
                ))}
              </div>
              {canDrag && <span className="label ms-auto hidden text-white/35 sm:block">{t.expertise.drag}</span>}
            </div>

            <div role="tabpanel" className="min-h-[300px] md:min-h-[340px]">
              {tab === 'code' ? (
                <pre className="latin overflow-x-auto p-5 text-[12px] leading-[1.9] text-white/70 md:p-7 md:text-[13.5px]">
                  {CODE.map((line, i) => (
                    <div data-code-line key={i} className="flex gap-5">
                      <span className="w-4 shrink-0 select-none text-end text-white/25">{i + 1}</span>
                      <code>
                        {line.map(([text, tone], j) => (
                          <span key={j} className={tone ? TONES[tone] : undefined}>
                            {text}
                          </span>
                        ))}
                        {i === CODE.length - 1 && <span className="caret ms-1" aria-hidden="true" />}
                      </code>
                    </div>
                  ))}
                </pre>
              ) : (
                <motion.div
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex min-h-[300px] flex-col justify-between p-5 transition-colors duration-500 md:min-h-[340px] md:p-7"
                  style={{ background: PALETTE[swatch], color: swatch >= 2 ? '#071426' : '#FFFFFF' }}
                >
                  <span className="flex items-center justify-between text-[10px] tracking-[0.2em]">
                    <span>S — D — S</span>
                    <span>{PALETTE[swatch]}</span>
                  </span>
                  <span className="block font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.03em] [font-stretch:125%]">
                    Idea
                    <br />
                    to impact
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
          </div>

          {/* Inspector fragment: the site palette, clickable, drives the preview tab. */}
          <div data-inspector className="relative z-20 -mt-6 ms-auto w-[78%] rounded-xl border border-white/15 bg-navy/90 p-4 backdrop-blur md:-mt-12 md:me-[-2%] md:w-[46%]">
            <p className="label text-white/50" dir="auto">
              {t.expertise.tokens}
            </p>
            <div className="mt-3 flex gap-2">
              {PALETTE.map((hex, i) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={swatch === i}
                  onClick={() => {
                    setSwatch(i);
                    setTab('preview');
                  }}
                  className={`h-11 flex-1 rounded-md border transition-transform duration-300 ease-cine hover:-translate-y-1 ${swatch === i ? 'border-electric ring-2 ring-electric/60' : 'border-white/20'}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
            <p className="latin mt-3 text-[11px] tracking-[0.1em] text-white/60">--color: {PALETTE[swatch]};</p>
          </div>
        </div>
      </div>

      {/* Whole, in its own proportions: as wide as the chapter, but never taller than the screen or larger than the picture itself. */}
      <div className="relative z-10 mx-auto mt-16 md:mt-24" style={{ maxWidth: `min(${SPECIALTY_PICTURES.technology.width}px, calc(86svh * ${SPECIALTY_PICTURES.technology.width} / ${SPECIALTY_PICTURES.technology.height}))` }}>
        <SpecialtyPicture picture={SPECIALTY_PICTURES.technology} piece={entryFor(pieces, SPECIALTY_PICTURES.technology.slug)} fallbackAlt={chapter.title} tone="dark" onOpen={onOpenProject} />
      </div>

      <ReverseSpecialty />
    </article>
  );
}
