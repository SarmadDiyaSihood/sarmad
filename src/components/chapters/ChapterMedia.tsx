import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useGsap } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { Counter, Reveal, Timecode } from '../Reveal';
import { ExploreButton, MEDIA_CAMERA, MEDIA_STUDIO, OpenBadge, entryFor, titleOf, type ChapterProps } from './shared';

/**
 * Film-strip frames: details of the two photographs. Each frame opens the photograph it is taken from.
 * x / y = top-left corner of the detail and w = its width, as fractions of the photo (frames and photos are both 16:9).
 */
const STRIP = [
  { of: MEDIA_CAMERA, x: 0.09, y: 0.25, w: 0.4 }, // the camera and the hand on the lens
  { of: MEDIA_STUDIO, x: 0.45, y: 0.1, w: 0.36 }, // in front of the camera
  { of: MEDIA_STUDIO, x: 0, y: 0.018, w: 0.235 }, // the studio light
  { of: MEDIA_CAMERA, x: 0.32, y: 0.1, w: 0.36 }, // behind the camera
  { of: MEDIA_STUDIO, x: 0.78, y: 0.6, w: 0.22 }, // the director's chair
  { of: MEDIA_CAMERA, x: 0.73, y: 0.73, w: 0.27 }, // the clapperboard
];

/** Chapter 01: a film still. Letterbox bars open on the studio photograph, shown whole; a film strip of details runs underneath. */
export default function ChapterMedia({ index, chapter, onExplore, pieces, onOpenProject }: ChapterProps) {
  const root = useRef<HTMLElement>(null);
  const { t, lang } = useLang();
  const studio = entryFor(pieces, MEDIA_STUDIO.slug);

  useGsap(root, (s) => {
    const open = { trigger: '[data-frame]', start: 'top 78%', once: true };
    gsap.fromTo('[data-bar="top"]', { scaleY: 1 }, { scaleY: 0, transformOrigin: '50% 0%', duration: 1.5, ease: 'expo.inOut', scrollTrigger: open });
    gsap.fromTo('[data-bar="bottom"]', { scaleY: 1 }, { scaleY: 0, transformOrigin: '50% 100%', duration: 1.5, ease: 'expo.inOut', scrollTrigger: open });
    gsap.fromTo(
      '[data-frame] img',
      { scale: 1.1 },
      // Settles before the frame reaches the middle of the screen, so the whole photograph is then in view.
      { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-frame]', start: 'top bottom', end: 'center 60%', scrub: true } },
    );
    gsap.fromTo(
      '[data-strip]',
      { xPercent: s === 1 ? -4 : -26 },
      { xPercent: s === 1 ? -26 : -4, ease: 'none', scrollTrigger: { trigger: '[data-strip]', start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    gsap.from('[data-title] .rv-line', {
      yPercent: 110,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-title]', start: 'top 88%', once: true },
    });
  });

  return (
    <article ref={root} id="chapter-1" className="grain relative overflow-hidden bg-navy py-24 text-white md:py-36">
      <div className="relative z-10 px-5 md:px-10">
        <div className="label flex items-center justify-between text-ice/70">
          <span>
            {t.expertise.chapter} <Counter value={1} className="latin" />
          </span>
          <span className="latin hidden sm:block">REEL A — 24 FPS — 16 : 9</span>
        </div>

        {/* The studio photograph. Clicking it opens the photograph in the viewer. */}
        <button
          type="button"
          data-frame
          disabled={!studio}
          data-cursor={studio ? 'view' : undefined}
          data-cursor-label={t.work.view}
          aria-label={`${t.work.view}: ${studio ? titleOf(studio, lang) : chapter.title}`}
          onClick={(e) => studio && onOpenProject?.(studio.slug, e.currentTarget.getBoundingClientRect())}
          className="group relative mx-auto mt-8 block aspect-video w-full overflow-hidden bg-navy-deep text-start disabled:pointer-events-none"
          style={{ maxWidth: 'calc(86svh * 16 / 9)' }}
        >
          <span className="block h-full w-full transition-transform duration-[1200ms] ease-cine group-hover:scale-[1.03]">
            <img src={MEDIA_STUDIO.src} alt={`${t.fullName} — ${chapter.title}`} width={MEDIA_STUDIO.width} height={MEDIA_STUDIO.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </span>
          <span data-bar="top" aria-hidden="true" className="absolute inset-x-0 top-0 block h-[51%] bg-navy" style={{ transform: 'scaleY(0)' }} />
          <span data-bar="bottom" aria-hidden="true" className="absolute inset-x-0 bottom-0 block h-[51%] bg-navy" style={{ transform: 'scaleY(0)' }} />
          <span className="label latin pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-white/80 md:p-6" aria-hidden="true">
            <span className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="rec-dot" /> REC
              </span>
              <Timecode />
            </span>
            {/* On phones the photograph is small: keep its lower half clear. */}
            <span className="hidden justify-between sm:flex">
              <span>SC 01 / TK 01</span>
              <span>ISO 800 — T2.8</span>
            </span>
          </span>
          {/* On the side edge: the corners carry the frame's labels and the chapter title crosses the bottom. */}
          <OpenBadge className="end-4 top-[calc(50%-1.375rem)]" />
        </button>

        {/* The title crosses the bottom of the photograph: it lets clicks through to it. */}
        <div className="pointer-events-none relative -mt-[7vw] grid gap-10 md:grid-cols-12 md:items-end">
          <h3 data-title className="display-film text-[clamp(3.6rem,12.6vw,14rem)] md:col-span-8" aria-label={chapter.title}>
            {chapter.lines.map((line) => (
              <span key={line} aria-hidden="true" className="rv-mask block">
                <span className="rv-line block">{line}</span>
              </span>
            ))}
          </h3>
          <div className="pointer-events-auto md:col-span-4 md:pb-6">
            <span aria-hidden="true" className="display-film block text-[5rem] leading-none text-electric md:text-[7rem]">
              01
            </span>
            <Reveal text={chapter.desc} stagger={0.012} className="mt-4 max-w-[38ch] text-lg leading-relaxed text-white/80" />
            <ExploreButton index={index} onExplore={onExplore} className="mt-8" />
          </div>
        </div>
      </div>

      {/* Film strip */}
      <div aria-hidden="true" className="relative z-10 mt-16 md:mt-24" dir="ltr">
        <div data-strip className="w-max">
          <div className="perfs" />
          <div className="flex gap-3 py-3">
            {STRIP.map((f, i) => {
              const entry = entryFor(pieces, f.of.slug);
              return (
                // Pointer only: the strip repeats the two photographs, which keyboard and screen-reader users open from the frame above and from the archive.
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  disabled={!entry}
                  data-cursor={entry ? 'view' : undefined}
                  data-cursor-label={t.work.view}
                  onClick={(e) => entry && onOpenProject?.(entry.slug, e.currentTarget.getBoundingClientRect())}
                  className="group relative block aspect-video w-[44vw] shrink-0 overflow-hidden bg-navy-deep disabled:pointer-events-none md:w-[22vw]"
                >
                  <img
                    src={f.of.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute max-w-none"
                    style={{ width: `${100 / f.w}%`, left: `${(-f.x / f.w) * 100}%`, top: `${(-f.y / f.w) * 100}%` }}
                  />
                  <span className="label latin absolute bottom-2 left-3 z-10 text-white/70">{String(i + 1).padStart(2, '0')}A</span>
                  <span className="absolute inset-0 border-2 border-electric opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
          <div className="perfs" />
        </div>
      </div>
    </article>
  );
}
