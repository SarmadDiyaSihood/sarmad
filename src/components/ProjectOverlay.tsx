import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useOverlay } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import type { Project } from '../lib/api';

interface Props {
  project: Project;
  number: number;
  next: Project | null;
  rect: DOMRect;
  /** Closes the page (Escape, browser Back). */
  onClose: () => void;
  /** The "Back to archive" buttons: closes the page and returns to the archive. */
  onBack: () => void;
  onNavigate: (slug: string) => void;
}

const EASE = [0.87, 0, 0.13, 1] as const;
const SOFT = [0.16, 1, 0.3, 1] as const;

/** A block that rises into place when it scrolls into view inside the project page. */
function Rise({ root, className, children }: { root: RefObject<HTMLDivElement | null>; className?: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root, once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.9, ease: SOFT }}
    >
      {children}
    </motion.div>
  );
}

/** Immersive project page. It opens out of the frame that was clicked and has its own address (#project/…). */
export default function ProjectOverlay({ project, number, next, rect, onClose, onBack, onNavigate }: Props) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(onClose, panel);

  const ar = lang === 'ar';
  const title = ar ? project.title_ar : project.title_en;
  const category = t.work.categories[project.category_key];
  const responsibilities = (ar ? project.responsibilities_ar : project.responsibilities_en) ?? [];
  const responsibilitiesTitle = (ar ? project.responsibilities_title_ar : project.responsibilities_title_en) || t.work.responsibilities;
  const details = (ar ? project.details_ar : project.details_en) ?? [];
  const sections = (ar ? project.sections_ar : project.sections_en) ?? [];
  const outputs = (ar ? project.outputs_ar : project.outputs_en) ?? [];
  // Covers with a set ratio are complete pictures: they are shown whole, never cropped or covered by the title.
  const ratio = project.cover_ratio;

  // Moving to the next reel keeps the page open: just return to the top.
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const from = `inset(${Math.max(0, rect.top)}px ${Math.max(0, vw - rect.right)}px ${Math.max(0, vh - rect.bottom)}px ${Math.max(0, rect.left)}px)`;

  const heading = (
    <motion.h2
      initial={reduced ? false : { y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.1, ease: SOFT, delay: 0.45 }}
      className={`display-2 mt-4 ${ratio ? 'max-w-[18ch] text-[clamp(1.6rem,6vw,6.5rem)]' : 'max-w-[14ch] text-[clamp(2.6rem,9vw,9.5rem)]'}`}
    >
      {title}
    </motion.h2>
  );

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      data-lenis-prevent
      className="grain fixed inset-0 z-[95] overflow-y-auto overscroll-contain bg-navy text-white outline-none"
      initial={reduced ? { opacity: 0 } : { clipPath: from }}
      animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0px 0px 0px 0px)' }}
      exit={reduced ? { opacity: 0 } : { clipPath: `inset(${vh}px 0px 0px 0px)` }}
      transition={{ duration: reduced ? 0.25 : 0.95, ease: EASE }}
    >
      {/* On the long project pages the bar is opaque at the top and fades out below, so text scrolls under it cleanly. */}
      <div
        className={`sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-3 md:px-10 ${ratio ? 'bg-[linear-gradient(to_bottom,var(--color-navy)_0%,var(--color-navy)_78%,transparent_100%)] pb-5' : ''}`}
      >
        <p className="label text-white/80">
          {t.work.reel} <span className="latin">{String(number).padStart(2, '0')}</span>
          {project.is_sample && <span className="ms-4 border border-white/40 px-2 py-1">{t.work.sample}</span>}
        </p>
        <button type="button" onClick={onBack} aria-label={t.work.back} className="label flex min-h-11 items-center gap-3 rounded-full bg-navy/70 pe-4 ps-1 backdrop-blur-md">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25">
            <ArrowLeft size={15} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">{t.work.back}</span>
          <span className="sm:hidden">{t.work.backShort}</span>
        </button>
      </div>

      <motion.div
        key={project.slug}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`relative z-10 ${ratio ? '-mt-[76px]' : '-mt-[68px]'}`}
      >
        {ratio ? (
          <header className="pt-[76px]">
            <div className="bg-navy-deep">
              <motion.div
                className="relative mx-auto overflow-hidden"
                style={{ aspectRatio: ratio, maxWidth: `calc(76svh * ${ratio})` }}
                initial={reduced ? false : { clipPath: 'inset(0% 0% 100% 0%)' }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
              >
                <motion.img
                  src={project.cover_image}
                  alt={(ar ? project.cover_alt_ar : project.cover_alt_en) ?? ''}
                  className="h-full w-full object-cover"
                  initial={reduced ? false : { scale: 1.12 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.9, ease: SOFT, delay: 0.3 }}
                />
              </motion.div>
            </div>
            <div className="px-5 pt-10 md:px-10 md:pt-14">
              <p className="label text-ice">{category}</p>
              {heading}
              <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-white/75 md:text-xl rtl:leading-[1.9]">{ar ? project.summary_ar : project.summary_en}</p>
            </div>
          </header>
        ) : (
          <header className="relative flex min-h-[78svh] flex-col justify-end overflow-hidden px-5 pb-10 pt-32 md:px-10 md:pb-14">
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: SOFT }}
            >
              {project.cover_video ? (
                <video src={project.cover_video} poster={project.cover_image} autoPlay muted loop playsInline className="h-full w-full object-cover" />
              ) : (
                <img src={project.cover_image} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/30" />
            </motion.div>
            <div className="relative">
              <p className="label text-ice">{category}</p>
              {heading}
            </div>
          </header>
        )}

        <div className="grid gap-14 px-5 py-16 md:grid-cols-12 md:gap-10 md:px-10 md:py-24">
          <aside className={`md:col-span-4 ${ratio ? 'md:sticky md:top-24 md:self-start' : ''}`}>
            <h3 className="label text-white/55">{t.work.details}</h3>
            <dl className="mt-6 border-t border-white/15">
              <div className="flex justify-between gap-6 border-b border-white/15 py-4">
                <dt className="label shrink-0 pt-1 text-white/55">{t.work.category}</dt>
                <dd className="text-end">{category}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/15 py-4">
                <dt className="label shrink-0 pt-1 text-white/55">{t.work.role}</dt>
                <dd className="text-end">{ar ? project.role_ar : project.role_en}</dd>
              </div>
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-6 border-b border-white/15 py-4">
                  <dt className="label shrink-0 pt-1 text-white/55">{d.label}</dt>
                  <dd className="text-end">{d.value}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <div className="md:col-span-7 md:col-start-6">
            <h3 className="label text-white/55">{t.work.overview}</h3>
            <p className="mt-6 text-[clamp(1.3rem,2.3vw,2.1rem)] font-light leading-[1.4] rtl:leading-[1.7]">{ar ? project.description_ar : project.description_en}</p>

            {sections.map((section, i) => (
              <Rise key={section.title} root={panel} className="mt-14 border-t border-white/15 pt-8 md:mt-16">
                <h3 className="flex items-baseline gap-5">
                  <span className="label latin shrink-0 text-electric">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-[clamp(1.35rem,2.1vw,2rem)] font-extrabold leading-[1.25] tracking-[var(--track-display)] rtl:leading-[1.55]">{section.title}</span>
                </h3>
                <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-[1.8] text-white/80 md:text-lg rtl:leading-[2]">{section.body}</p>
              </Rise>
            ))}

            {responsibilities.length > 0 && (
              <Rise root={panel}>
                <h3 className="label mt-14 text-white/55 md:mt-16">{responsibilitiesTitle}</h3>
                <ol className="mt-6 border-t border-white/15">
                  {responsibilities.map((item, i) => (
                    <li key={item} className="flex items-baseline gap-5 border-b border-white/15 py-4">
                      <span className="label latin text-electric">0{i + 1}</span>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ol>
              </Rise>
            )}

            {outputs.length > 0 && (
              <Rise root={panel}>
                <h3 className="label mt-14 text-white/55 md:mt-16">{t.work.outputs}</h3>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {outputs.map((item) => (
                    <li key={item} className="border border-white/15 p-5 leading-relaxed text-white/90 rtl:leading-[1.9]">
                      <span aria-hidden="true" className="mb-4 block h-[3px] w-8 bg-electric" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Rise>
            )}
          </div>
        </div>

        <div className="px-5 pb-14 md:px-10 md:pb-20">
          <button type="button" onClick={onBack} className="btn btn-back label">
            <ArrowLeft size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
            {t.work.back}
          </button>
        </div>

        {next && (
          <button
            type="button"
            onClick={() => onNavigate(next.slug)}
            className="group flex w-full flex-col gap-4 border-t border-white/15 px-5 py-12 text-start transition-colors duration-500 hover:bg-electric md:px-10 md:py-16"
          >
            <span className="label text-white/70">{t.work.next}</span>
            <span className="display-2 flex items-center justify-between gap-6 text-[clamp(2rem,6vw,6rem)]">
              {ar ? next.title_ar : next.title_en}
              <ArrowUpRight strokeWidth={1} className="h-[1em] w-[1em] shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </span>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
