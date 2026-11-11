import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useGsap } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { Counter, Reveal } from '../Reveal';
import { DESIGN_WORKS, ExploreButton, OpenBadge, entryFor, titleOf, type ChapterProps } from './shared';
import BlenderSpecialty from './BlenderSpecialty';

/** Chapter 02: a graphic poster. Oversized type, then the two identity pieces as cards. Each card opens its picture in the viewer. */
export default function ChapterDesign({ index, chapter, onExplore, pieces, onOpenProject }: ChapterProps) {
  const root = useRef<HTMLElement>(null);
  const { t, lang } = useLang();

  useGsap(root, (s) => {
    gsap.from('[data-word]', {
      xPercent: (i: number) => (i === 0 ? -12 : 12) * s,
      autoAlpha: 0,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-words]', start: 'top 82%', once: true },
    });
    gsap.from('[data-disc]', { scale: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '[data-disc]', start: 'top 90%', once: true } });
    // Each card's picture wipes open as it scrolls into view, then its caption rises.
    root.current?.querySelectorAll<HTMLElement>('[data-work]').forEach((frame, i) => {
      const st = { trigger: frame, start: 'top 85%', once: true };
      gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: i * 0.15, clearProps: 'clipPath', scrollTrigger: st });
      const caption = frame.parentElement?.querySelector('[data-work-caption]');
      if (caption) gsap.from(caption, { autoAlpha: 0, y: 18, duration: 0.9, ease: 'expo.out', delay: 0.55 + i * 0.15, scrollTrigger: st });
    });
  });

  return (
    <article ref={root} id="chapter-2" className="relative overflow-hidden bg-white px-5 py-24 text-navy md:px-10 md:py-40">
      <p className="label text-navy/60">
        {t.expertise.chapter} <span className="latin">02</span>
      </p>

      <h3 data-words className="display mt-8 text-[clamp(3rem,13vw,15rem)]" aria-label={chapter.title}>
        <span data-word aria-hidden="true" className="block">
          {chapter.lines[0]}
        </span>
        <span data-word aria-hidden="true" className="block text-end text-electric">
          {chapter.lines[1]}
        </span>
      </h3>

      <div className="mt-14 flex flex-col gap-10 md:mt-20 md:flex-row md:items-center md:gap-12">
        <div data-disc className="grid h-[34vw] max-h-56 w-[34vw] max-w-56 shrink-0 place-items-center rounded-full bg-electric text-white">
          <Counter value={2} className="display text-[clamp(3rem,9vw,6.5rem)]" />
        </div>
        <Reveal text={chapter.desc} stagger={0.012} className="max-w-[34ch] text-lg leading-relaxed text-navy/80 md:text-[clamp(1.15rem,1.6vw,1.5rem)] md:leading-[1.5] rtl:md:leading-[1.8]" />
        <ExploreButton index={index} onExplore={onExplore} className="shrink-0 self-start md:ms-auto md:self-center" />
      </div>

      {/* The two pieces: the owner's own pictures, shown whole (3:2). */}
      <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-20 md:gap-x-10">
        {DESIGN_WORKS.map((work, i) => {
          const item = t.designWorks.items[i];
          // The card's archive entry: what the viewer shows. Until the archive has loaded there is nothing to open.
          const entry = entryFor(pieces, work.slug);
          return (
            <li key={work.slug}>
              <button
                type="button"
                disabled={!entry}
                data-cursor={entry ? 'view' : undefined}
                data-cursor-label={t.work.view}
                onClick={(e) => entry && onOpenProject?.(entry.slug, (e.currentTarget.querySelector('[data-work]') ?? e.currentTarget).getBoundingClientRect())}
                className="group block w-full text-start disabled:pointer-events-none"
              >
                <span
                  data-work
                  className="relative block aspect-[3/2] overflow-hidden border border-navy/15 bg-mist transition-[border-color,box-shadow,transform] duration-700 ease-cine group-hover:-translate-y-1.5 group-hover:border-electric group-hover:shadow-[0_34px_70px_-36px_rgba(23,105,255,0.6)] group-focus-visible:border-electric"
                >
                  <img
                    src={work.src}
                    alt={item.alt}
                    width={1536}
                    height={1024}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-cine group-hover:scale-[1.04]"
                  />
                  <OpenBadge />
                </span>

                <span data-work-caption className="mt-5 block">
                  <span className="label flex items-center gap-3">
                    <span className="latin text-navy/60">0{i + 1}</span>
                    <span className="text-electric">{chapter.title}</span>
                  </span>
                  <span className="mt-2 block">
                    <span className="link-line font-display text-[clamp(1.3rem,2vw,2.1rem)] font-extrabold leading-[1.25] tracking-[var(--track-display)] group-hover:[background-size:100%_1px] rtl:leading-[1.55]">
                      {entry ? titleOf(entry, lang) : item.title}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <BlenderSpecialty onOpen={onOpenProject} />
    </article>
  );
}
