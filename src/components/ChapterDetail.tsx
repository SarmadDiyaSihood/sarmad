import { useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useOverlay } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import type { Project } from '../lib/api';
import { CHAPTER_KEYS, CHAPTER_PICTURES, SpecialtyPicture, entryFor, type Origin } from './chapters/shared';

interface Props {
  index: number;
  origin: Origin;
  projects: Project[];
  inert: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onOpenProject: (slug: string, rect: DOMRect) => void;
}

const EASE = [0.87, 0, 0.13, 1] as const;
// While moving to the next chapter the old panel simply holds still underneath the incoming one.
const hold = { opacity: 0.999, transition: { duration: 1.2 } };

const THEMES = [
  { panel: 'bg-navy text-white', bar: 'bg-navy/80', rule: 'border-white/15', soft: 'text-white/70', title: 'display-film text-[clamp(3.5rem,13vw,14rem)]' },
  { panel: 'bg-white text-navy', bar: 'bg-white/80', rule: 'border-navy/15', soft: 'text-navy/70', title: 'display text-[clamp(2.6rem,10vw,11rem)]' },
  { panel: 'text-navy', bar: 'bg-mist/80', rule: 'border-navy/15', soft: 'text-navy/70', title: 'font-display uppercase font-extralight leading-[var(--lh-display)] tracking-[var(--track-display)] text-[clamp(2.6rem,9vw,10rem)]' },
  { panel: 'bg-navy-deep text-white', bar: 'bg-navy-deep/80', rule: 'border-white/15', soft: 'text-white/70', title: 'display-2 text-[clamp(2.4rem,8vw,9rem)]' },
];

/** Each chapter opens with its own transition: letterbox, iris, rising columns, maximising window. */
function panelVariants(index: number, o: Origin, reduced: boolean): Variants {
  if (reduced) {
    return { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.25 } }, exit: (nav: boolean) => (nav ? hold : { opacity: 0, transition: { duration: 0.2 } }) };
  }
  if (index === 0) {
    const closed = 'inset(50% 0% 50% 0%)';
    return {
      initial: { clipPath: closed },
      animate: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.05, ease: EASE } },
      exit: (nav: boolean) => (nav ? hold : { clipPath: closed, transition: { duration: 0.75, ease: EASE } }),
    };
  }
  if (index === 1) {
    const radius = Math.hypot(Math.max(o.x, window.innerWidth - o.x), Math.max(o.y, window.innerHeight - o.y)) + 20;
    const closed = `circle(0px at ${o.x}px ${o.y}px)`;
    return {
      initial: { clipPath: closed },
      animate: { clipPath: `circle(${radius}px at ${o.x}px ${o.y}px)`, transition: { duration: 1.1, ease: EASE } },
      exit: (nav: boolean) => (nav ? hold : { clipPath: closed, transition: { duration: 0.8, ease: EASE } }),
    };
  }
  if (index === 2) {
    return {
      initial: {},
      animate: { transition: { staggerChildren: 0.07 } },
      exit: (nav: boolean) => (nav ? hold : { opacity: 0.999, transition: { staggerChildren: 0.05, staggerDirection: -1, duration: 0.9 } }),
    };
  }
  const closed = 'inset(40% 36% 40% 36% round 18px)';
  return {
    initial: { clipPath: closed, opacity: 0 },
    animate: { clipPath: 'inset(0% 0% 0% 0% round 0px)', opacity: 1, transition: { duration: 0.95, ease: EASE, opacity: { duration: 0.3 } } },
    exit: (nav: boolean) => (nav ? hold : { clipPath: closed, opacity: 0, transition: { duration: 0.7, ease: EASE, opacity: { duration: 0.3, delay: 0.4 } } }),
  };
}

const column: Variants = {
  initial: { scaleY: 0 },
  animate: { scaleY: 1, transition: { duration: 0.8, ease: EASE } },
  exit: (nav: boolean) => (nav ? { scaleY: 1, transition: { duration: 1.2 } } : { scaleY: 0, transition: { duration: 0.6, ease: EASE } }),
};

export default function ChapterDetail({ index, origin, projects, inert, onClose, onNavigate, onOpenProject }: Props) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion() ?? false;
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(onClose, panel);

  const c = t.chapters[index];
  const theme = THEMES[index];
  // The chapter's picture: one of the owner's own pictures, shown whole in its own proportions.
  const picture = CHAPTER_PICTURES[index];
  const next = (index + 1) % t.chapters.length;
  const related = projects.filter((p) => p.category_key === CHAPTER_KEYS[index]);
  const num = `0${index + 1}`;

  const content: Variants = {
    initial: { opacity: 0, y: reduced ? 0 : 28 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : 0.55 } },
    exit: (nav: boolean) => (nav ? { opacity: 1, transition: { duration: 1.2 } } : { opacity: 0, transition: { duration: 0.25 } }),
  };

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={`${t.expertise.chapter} ${num}: ${c.title}`}
      tabIndex={-1}
      inert={inert}
      data-lenis-prevent
      className={`fixed inset-0 z-[80] overflow-y-auto overscroll-contain outline-none ${theme.panel}`}
      variants={panelVariants(index, origin, reduced)}
      custom={false}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {index === 2 && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} variants={column} className="h-full flex-1 bg-mist" style={{ transformOrigin: '50% 100%' }} />
          ))}
        </div>
      )}

      <motion.div variants={content} className="relative">
        <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3 backdrop-blur-md md:px-10 ${theme.bar} ${theme.rule}`}>
          <p className="label">
            {t.expertise.chapter} <span className="latin">{num}</span>
          </p>
          <button type="button" onClick={onClose} className="label flex min-h-11 items-center gap-3">
            {t.expertise.close}
            <span className={`grid h-9 w-9 place-items-center rounded-full border ${theme.rule}`}>
              <X size={15} strokeWidth={1.5} aria-hidden="true" />
            </span>
          </button>
        </div>

        <header className="px-5 pb-14 pt-16 md:px-10 md:pb-20 md:pt-24">
          <p aria-hidden="true" className="display-film text-[clamp(5rem,16vw,15rem)] leading-none text-electric">
            {num}
          </p>
          <h2 className={`mt-4 ${theme.title}`}>
            {c.lines.map((line, i) => (
              <span key={line} className={`block ${index === 2 && i === 1 ? 'font-extrabold' : ''} ${index === 1 && i === 1 ? 'text-electric' : ''}`}>
                {line}
              </span>
            ))}
          </h2>
          <p className={`mt-8 max-w-[52ch] text-lg leading-relaxed md:text-xl ${theme.soft}`}>{c.desc}</p>
        </header>

        <div className="px-5 md:px-10">
          <div className="mx-auto" style={{ maxWidth: `calc(80svh * ${picture.width} / ${picture.height})` }}>
            <SpecialtyPicture
              picture={picture}
              piece={entryFor(projects, picture.slug)}
              fallbackAlt={index === 1 ? t.designWorks.items[1].alt : c.title}
              tone={index === 0 || index === 3 ? 'dark' : 'light'}
              onOpen={onOpenProject}
            />
          </div>
        </div>

        <div className="grid gap-14 px-5 py-16 md:grid-cols-12 md:gap-10 md:px-10 md:py-24">
          <section className="md:col-span-5" aria-labelledby="focus-title">
            <h3 id="focus-title" className={`label ${theme.soft}`}>
              {t.expertise.focus}
            </h3>
            <ol className={`mt-6 border-t ${theme.rule}`}>
              {c.items.map((item, i) => (
                <li key={item} className={`flex items-baseline gap-5 border-b py-4 ${theme.rule}`}>
                  <span className="label latin text-electric">0{i + 1}</span>
                  <span className="font-display text-xl font-bold md:text-2xl">{item}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="md:col-span-6 md:col-start-7" aria-labelledby="approach-title">
            <h3 id="approach-title" className={`label ${theme.soft}`}>
              {t.expertise.approach}
            </h3>
            <p className="mt-6 text-[clamp(1.4rem,2.6vw,2.4rem)] font-light leading-[1.35]">{c.approach}</p>
          </section>
        </div>

        <section className="px-5 pb-16 md:px-10 md:pb-24" aria-labelledby="related-title">
          <h3 id="related-title" className={`label ${theme.soft}`}>
            {t.expertise.related}
          </h3>
          {related.length === 0 ? (
            <p className={`mt-6 border-t pt-6 ${theme.rule} ${theme.soft}`}>{t.expertise.noRelated}</p>
          ) : (
            <ul className={`mt-6 border-t ${theme.rule}`}>
              {related.map((p) => (
                <li key={p.slug} className={`border-b ${theme.rule}`}>
                  <button
                    type="button"
                    onClick={(e) => onOpenProject(p.slug, e.currentTarget.getBoundingClientRect())}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-start"
                  >
                    <span className="link-line font-display text-2xl font-bold md:text-4xl">{lang === 'ar' ? p.title_ar : p.title_en}</span>
                    <span className="flex items-center gap-4">
                      {p.is_sample && <span className={`label hidden sm:block ${theme.soft}`}>{t.work.sample}</span>}
                      <ArrowUpRight size={22} strokeWidth={1.25} className="transition-transform duration-500 ease-cine group-hover:-translate-y-1 rtl:-scale-x-100" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={() => onNavigate(next)}
          className={`group flex w-full flex-col gap-4 border-t px-5 py-12 text-start transition-colors duration-500 hover:bg-electric hover:text-white md:px-10 md:py-16 ${theme.rule}`}
        >
          <span className="label opacity-70">
            {t.expertise.next} <span className="latin">0{next + 1}</span>
          </span>
          <span className="display-2 flex items-center justify-between gap-6 text-[clamp(2rem,6vw,6rem)]">
            {t.chapters[next].title}
            <ArrowUpRight strokeWidth={1} className="h-[1em] w-[1em] shrink-0 rtl:-scale-x-100" aria-hidden="true" />
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}
