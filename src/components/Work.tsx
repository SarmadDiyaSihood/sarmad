import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from '../lib/gsap';
import { useLang } from '../context/LanguageContext';
import type { CategoryKey, Project, Remote } from '../lib/api';
import { SHOW_PROJECT_PAGES, scene } from '../lib/features';
import { Reveal, SceneLabel } from './Reveal';

interface Props {
  projects: Remote<Project[]>;
  onOpen: (slug: string, rect: DOMRect) => void;
}

// A filter appears only for categories that have at least one project ("Blender 3D" has none yet).
const KEYS: CategoryKey[] = ['media', 'design', 'marketing', 'technology', 'blender'];
// Editorial rhythm: column span, offset and frame ratio vary from entry to entry.
const LAYOUT = [
  { cell: 'md:col-span-7', ratio: 'aspect-[4/3]' },
  { cell: 'md:col-span-5 md:mt-32', ratio: 'aspect-[3/4]' },
  { cell: 'md:col-span-5', ratio: 'aspect-[4/5]' },
  { cell: 'md:col-span-7 md:mt-24', ratio: 'aspect-[16/10]' },
  { cell: 'md:col-span-8 md:col-start-3', ratio: 'aspect-[16/9]' },
  { cell: 'md:col-span-6 md:col-start-7', ratio: 'aspect-[4/3]' },
];

function Card({ project, i, onOpen }: { project: Project; i: number; onOpen: Props['onOpen'] }) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const frame = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const layout = LAYOUT[i % LAYOUT.length];
  const title = lang === 'ar' ? project.title_ar : project.title_en;
  const number = String(i + 1).padStart(2, '0');
  // The one-line summary belongs to the long project pages, and is hidden with them.
  const summary = SHOW_PROJECT_PAGES ? (lang === 'ar' ? project.summary_ar : project.summary_en) : '';
  // Covers with a set ratio are complete pictures (often with their own lettering): show them whole.
  const whole = Boolean(project.cover_ratio);

  return (
    <motion.li
      layout={reduced ? false : 'position'}
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={layout.cell}
    >
      <button
        type="button"
        data-cursor="view"
        data-cursor-label={t.work.view}
        onClick={() => frame.current && onOpen(project.slug, frame.current.getBoundingClientRect())}
        onMouseEnter={() => void video.current?.play().catch(() => {})}
        onMouseLeave={() => video.current?.pause()}
        className="duo-hover group block w-full text-start"
      >
        <motion.span
          ref={frame}
          initial={reduced ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          viewport={{ once: true, margin: '0px 0px -12% 0px' }}
          transition={{ duration: 1.3, ease: [0.87, 0, 0.13, 1] }}
          className={`block ${project.is_sample ? 'duo' : 'cover-plain'} ${whole ? '' : layout.ratio}`}
          style={whole ? { aspectRatio: project.cover_ratio } : undefined}
        >
          {project.cover_video ? (
            <video ref={video} src={project.cover_video} poster={project.cover_image} muted loop playsInline preload="none" className="h-full w-full object-cover" />
          ) : (
            <img src={project.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          )}
          {!whole && (
            <span className="label latin absolute start-4 top-4 z-10 text-white/85">
              {lang === 'ar' ? '' : `${t.work.reel} `}
              {number}
            </span>
          )}
          {project.is_sample && <span className="label absolute end-4 top-4 z-10 border border-white/50 px-2 py-1 text-white/85">{t.work.sample}</span>}
        </motion.span>

        <span className="mt-5 flex flex-col-reverse items-start justify-between gap-2 sm:flex-row sm:gap-6">
          <span>
            <span className="link-line font-display text-[clamp(1.5rem,2.6vw,2.5rem)] font-extrabold leading-[1.15] tracking-[var(--track-display)] group-hover:[background-size:100%_1px]">{title}</span>
            {summary && <span className="mt-2 block max-w-[46ch] text-[15px] leading-relaxed text-navy/65">{summary}</span>}
          </span>
          <span className="label flex shrink-0 gap-3 text-electric sm:pt-2">
            {whole && <span className="latin text-navy/60">{number}</span>}
            {t.work.categories[project.category_key]}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

export default function Work({ projects, onOpen }: Props) {
  const { t } = useLang();
  const [filter, setFilter] = useState<CategoryKey | 'all'>('all');
  const list = projects.data ?? [];
  const shown = filter === 'all' ? list : list.filter((p) => p.category_key === filter);
  const available = KEYS.filter((k) => list.some((p) => p.category_key === k));

  // The grid changes the page height: keep scroll-driven animation below it in sync.
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 700);
    return () => window.clearTimeout(id);
  }, [filter, projects.loading]);

  return (
    <section id="work" data-section className="relative bg-mist px-5 py-28 text-navy md:px-10 md:py-44">
      <SceneLabel n={scene(12)} label={t.work.label} className="text-navy/70" />
      <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
        <Reveal as="h2" text={t.work.heading} stagger={0.06} className="display text-[clamp(2.6rem,9vw,10rem)] md:col-span-8" />
        {list.some((p) => p.is_sample) && <p className="max-w-[44ch] text-[15px] leading-relaxed text-navy/65 md:col-span-4 md:pb-3">{t.work.note}</p>}
      </div>

      {projects.loading ? (
        <div className="mt-16 grid gap-8 md:grid-cols-12" role="status" aria-label={t.work.loading}>
          <div className="aspect-[4/3] animate-pulse bg-navy/10 md:col-span-7" />
          <div className="aspect-[3/4] animate-pulse bg-navy/10 md:col-span-5 md:mt-32" />
          <p className="label text-navy/50 md:col-span-12">{t.work.loading}…</p>
        </div>
      ) : projects.error ? (
        <div className="mt-16 flex flex-col items-start gap-6 border-t border-navy/15 pt-10" role="alert">
          <p className="font-display text-2xl font-bold">{t.work.error}</p>
          <button type="button" onClick={projects.reload} className="btn label">
            {t.work.retry}
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label={t.work.category} className="mt-12 flex flex-wrap gap-2 border-t border-navy/15 pt-6">
            {(['all', ...available] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                data-sound="step"
                onClick={() => setFilter(key)}
                className={`label min-h-11 rounded-full border px-4 transition-colors duration-300 ${filter === key ? 'border-navy bg-navy text-white' : 'border-navy/20 text-navy/70 hover:border-navy hover:text-navy'}`}
              >
                {key === 'all' ? t.work.all : t.work.categories[key]}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-16 text-navy/60">{t.work.empty}</p>
          ) : (
            <ul className="mt-14 grid gap-x-8 gap-y-16 md:mt-20 md:grid-cols-12 md:gap-x-10 md:gap-y-24">
              <AnimatePresence initial={false}>
                {shown.map((p, i) => (
                  <Card key={p.slug} project={p} i={i} onOpen={onOpen} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}
    </section>
  );
}
