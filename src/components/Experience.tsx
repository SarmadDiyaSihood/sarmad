import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, RotateCcw } from 'lucide-react';
import { useLang, type Lang } from '../context/LanguageContext';
import type { Experience as Item, ExperienceCategory, Remote } from '../lib/api';
import { Reveal, SceneLabel } from './Reveal';

const KEYS: ExperienceCategory[] = ['training', 'media', 'marketing', 'hr'];
const EASE = [0.16, 1, 0.3, 1] as const;

/** "2022-03" becomes "Mar 2022" (Arabic month names in Arabic); a bare year stays as it is. */
function formatDate(value: string, lang: Lang) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 15)));
}

function Entry({ item, open, last, onToggle }: { item: Item; open: boolean; last: boolean; onToggle: () => void }) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const c = t.experience;
  // Show the current language, falling back to the other one when a field was only entered once.
  const pick = (ar: string, en: string) => (lang === 'ar' ? ar || en : en || ar);
  const title = pick(item.title_ar, item.title_en);
  const org = pick(item.org_ar, item.org_en);
  const type = pick(item.type_ar, item.type_en);
  const tasks = lang === 'ar' ? (item.resp_ar.length ? item.resp_ar : item.resp_en) : item.resp_en.length ? item.resp_en : item.resp_ar;
  const until = item.current ? c.present : item.end ? formatDate(item.end, lang) : '';
  const period = until ? `${formatDate(item.start, lang)} — ${until}` : formatDate(item.start, lang);
  const panelId = `experience-${item.id}`;

  const summary = (
    <>
      <span className="min-w-0">
        <span className="label block text-ice/80 md:hidden">{period}</span>
        <span className="mt-2 block font-display text-[clamp(1.25rem,2.1vw,2rem)] font-extrabold leading-[1.2] md:mt-0 rtl:leading-[1.5]">{title}</span>
        <span className="mt-1.5 block text-lg text-ice">{org}</span>
        <span className="mt-4 flex flex-wrap items-center gap-2">
          {item.current && (
            <span className="label flex items-center gap-2 rounded-full bg-electric px-3 py-1 text-white">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
              {c.current}
            </span>
          )}
          {type && <span className="label rounded-full border border-white/35 px-3 py-1 text-white/90">{type}</span>}
          <span className="label px-1 text-white/60">{c.categories[item.category]}</span>
        </span>
      </span>
      {tasks.length > 0 && (
        <span
          aria-hidden="true"
          className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition duration-500 ease-cine group-hover:border-electric group-hover:bg-electric ${open ? 'rotate-45 border-electric bg-electric' : 'border-white/35'}`}
        >
          <Plus size={18} strokeWidth={1.5} />
        </span>
      )}
    </>
  );

  return (
    <motion.li
      layout={reduced ? false : 'position'}
      initial={{ opacity: 0, y: reduced ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.9, ease: EASE }}
      className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[11.5rem_1.25rem_minmax(0,1fr)] md:gap-x-7"
    >
      <p className="label hidden pt-6 text-ice/80 md:block">{period}</p>

      {/* The line and this entry's marker */}
      <span aria-hidden="true" className="relative flex justify-center">
        <span className={`absolute top-0 w-px bg-white/20 ${last ? 'h-7' : 'bottom-0'}`} />
        <span className={`relative mt-6 block h-[11px] w-[11px] rounded-full ${item.current ? 'bg-electric' : 'border border-white/60 bg-navy'}`}>
          {item.current && <span className="absolute inset-0 animate-ping rounded-full bg-electric" />}
        </span>
      </span>

      <div className="border-b border-white/15">
        {tasks.length > 0 ? (
          <h3>
            <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle} className="group flex w-full items-start justify-between gap-5 py-5 text-start">
              {summary}
            </button>
          </h3>
        ) : (
          <h3 className="flex items-start justify-between gap-5 py-5">{summary}</h3>
        )}

        <AnimatePresence initial={false}>
          {open && tasks.length > 0 && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="label text-white/60">{c.responsibilities}</p>
              <ul className="mt-4 space-y-3 pb-7">
                {tasks.map((task, i) => (
                  <li key={i} className="flex gap-4 leading-relaxed text-white/85 rtl:leading-[1.9]">
                    <span className="label latin mt-1 shrink-0 text-electric">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">{task}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

/** PROFESSIONAL JOURNEY: a filterable timeline. Each entry opens to show its responsibilities. */
export default function Experience({ experiences }: { experiences: Remote<Item[]> }) {
  const { t } = useLang();
  const c = t.experience;
  const [filter, setFilter] = useState<ExperienceCategory | 'all'>('all');
  const [open, setOpen] = useState<string[]>([]);

  const all = experiences.data ?? [];
  const shown = filter === 'all' ? all : all.filter((e) => e.category === filter);
  const toggle = (id: string) => setOpen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const showAll = (
    <button type="button" onClick={() => setFilter('all')} className="label flex min-h-11 items-center gap-3 text-white">
      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/35">
        <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="link-line">{c.showAll}</span>
    </button>
  );

  return (
    <section id="experience" data-section className="grain relative overflow-hidden bg-navy text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-[20%] top-[8%] h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(23,105,255,0.22),transparent)]"
      />

      <div className="relative z-10 mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={9} label={c.label} className="text-ice/80" />
        <Reveal as="h2" text={c.heading} stagger={0.06} className="display-2 mt-10 text-[clamp(2.1rem,6.4vw,7rem)]" />

        {experiences.loading ? (
          <div className="mt-16 space-y-6" role="status" aria-label={c.loading}>
            <div className="h-20 animate-pulse bg-white/10" />
            <div className="h-20 animate-pulse bg-white/10" />
            <p className="label text-white/60">{c.loading}…</p>
          </div>
        ) : experiences.error ? (
          <div className="mt-16 flex flex-col items-start gap-6 border-t border-white/15 pt-10" role="alert">
            <p className="font-display text-2xl font-bold">{c.error}</p>
            <button type="button" onClick={experiences.reload} className="btn label">
              {t.work.retry}
            </button>
          </div>
        ) : (
          <>
            <div role="group" aria-label={c.filtersLabel} className="mt-12 flex flex-wrap gap-2 border-t border-white/15 pt-6 md:mt-16">
              {(['all', ...KEYS] as const).map((key) => {
                const count = key === 'all' ? all.length : all.filter((e) => e.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                    className={`label flex min-h-11 items-center gap-3 rounded-full border px-4 transition-colors duration-300 ${filter === key ? 'border-white bg-white text-navy' : 'border-white/30 text-white/85 hover:border-white hover:text-white'}`}
                  >
                    {key === 'all' ? c.all : c.categories[key]}
                    <span className="latin opacity-70">{String(count).padStart(2, '0')}</span>
                  </button>
                );
              })}
            </div>

            {all.length === 0 ? (
              <p className="mt-12 max-w-[44ch] border-s-2 border-electric ps-6 text-[clamp(1.2rem,1.9vw,1.7rem)] font-light leading-[1.5] text-white/85">{c.empty}</p>
            ) : (
              <>
                <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-x-8 gap-y-2">
                  <p className="label text-white/60" role="status">
                    {c.showing} <span className="latin">{shown.length}</span> {c.of} <span className="latin">{all.length}</span>
                  </p>
                  {filter !== 'all' && showAll}
                </div>

                {shown.length === 0 ? (
                  <p className="mt-10 text-lg text-white/75">{c.emptyFilter}</p>
                ) : (
                  <ol className="mt-8 md:mt-12">
                    <AnimatePresence initial={false}>
                      {shown.map((item, i) => (
                        <Entry key={item.id} item={item} open={open.includes(item.id)} last={i === shown.length - 1} onToggle={() => toggle(item.id)} />
                      ))}
                    </AnimatePresence>
                  </ol>
                )}

                {filter !== 'all' && shown.length > 3 && <div className="mt-10">{showAll}</div>}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
