import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Code, Compass, ShieldCheck, X, type LucideIcon } from 'lucide-react';
import { useOverlay } from '../lib/hooks';
import { sound } from '../lib/sound';
import { plural } from '../lib/text';
import { useLang } from '../context/LanguageContext';
import type { Certification, CertificationCategory, Remote } from '../lib/api';
import { LATIN_FACE } from '../lib/person';
import { scene } from '../lib/features';
import { Counter, Reveal, SceneLabel } from './Reveal';

const KEYS: CertificationCategory[] = ['security', 'web', 'business', 'leadership'];
const ICONS: Record<CertificationCategory, LucideIcon> = { security: ShieldCheck, web: Code, business: Briefcase, leadership: Compass };
const EASE = [0.16, 1, 0.3, 1] as const;
const two = (n: number) => String(n).padStart(2, '0');

/** A certification's text in the current language, falling back to the other one where a field is empty. */
function useText(cert: Certification) {
  const { lang } = useLang();
  const pick = (ar: string, en: string) => (lang === 'ar' ? ar || en : en || ar);
  return {
    name: pick(cert.name_ar, cert.name_en),
    issuer: pick(cert.issuer_ar, cert.issuer_en),
    country: pick(cert.country_ar, cert.country_en),
    desc: pick(cert.desc_ar, cert.desc_en),
    status: pick(cert.status_ar, cert.status_en),
  };
}

/** Keeps a Latin parenthetical such as "(HTML, CSS, JavaScript)" in its own left-to-right order inside Arabic text. */
function Name({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\([^()\u0600-\u06FF]+\))/).map((part, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Card({ cert, number, column, onOpen }: { cert: Certification; number: number; column: number; onOpen: () => void }) {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const text = useText(cert);
  const Icon = ICONS[cert.category] ?? BadgeCheck;

  return (
    <motion.li
      layout={reduced ? false : 'position'}
      initial={{ opacity: 0, y: reduced ? 0 : 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.9, ease: EASE, delay: reduced ? 0 : column * 0.08, layout: { duration: 0.5, ease: EASE } }}
    >
      <button
        type="button"
        onClick={onOpen}
        data-cursor="view"
        data-cursor-label={t.work.view}
        aria-label={`${t.certifications.details}: ${text.name}`}
        className="group relative flex h-full w-full flex-col border border-navy/15 bg-white p-6 text-start transition-[border-color,transform,box-shadow] duration-500 ease-cine hover:-translate-y-1.5 hover:border-electric hover:shadow-[0_30px_60px_-34px_rgba(23,105,255,0.55)] md:p-7"
      >
        <span aria-hidden="true" className="absolute -start-px -top-px h-5 w-5 border-s-2 border-t-2 border-electric opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span aria-hidden="true" className="absolute -bottom-px -end-px h-5 w-5 border-b-2 border-e-2 border-electric opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <span className="flex items-start justify-between gap-4">
          <span style={LATIN_FACE} className="text-[4.75rem] font-extrabold leading-[0.8] text-navy transition-colors duration-500 [font-stretch:62%] group-hover:text-electric">
            {two(number)}
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-navy/15 text-electric transition-colors duration-500 group-hover:border-electric group-hover:bg-electric group-hover:text-white">
            <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
          </span>
        </span>

        <span className="label mt-7 block text-navy/60">{t.certifications.categories[cert.category]}</span>
        <span className="mt-2 block font-display text-[clamp(1.15rem,1.5vw,1.45rem)] font-extrabold leading-[1.25] rtl:leading-[1.55]">
          <Name text={text.name} />
        </span>
        <span className="mt-3 block text-navy/80">
          {text.issuer}
          <span aria-hidden="true" className="mx-2 text-electric">
            /
          </span>
          {text.country}
        </span>
        <span className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-navy/70 rtl:leading-[1.85]">{text.desc}</span>

        <span className="mt-auto block pt-6">
          <span className="flex items-start gap-2.5 border-t border-navy/10 pt-4 text-sm font-medium text-navy">
            <BadgeCheck size={18} strokeWidth={1.6} className="mt-px shrink-0 text-electric" aria-hidden="true" />
            {text.status}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

interface PanelProps {
  cert: Certification;
  number: number;
  total: number;
  onClose: () => void;
  onStep: (direction: 1 | -1) => void;
}

/** Side panel with the full details of one certification. Rendered outside the page so the page behind can go inert. */
function Panel({ cert, number, total, onClose, onStep }: PanelProps) {
  const { t, s } = useLang();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(onClose, panel);
  const c = t.certifications;
  const text = useText(cert);
  const Icon = ICONS[cert.category] ?? BadgeCheck;

  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [cert.id]);

  const rows = [
    { label: c.issuer, value: text.issuer },
    { label: c.location, value: text.country },
    { label: c.category, value: c.categories[cert.category] },
  ];

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-navy-deep/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={text.name}
        tabIndex={-1}
        data-lenis-prevent
        className="grain fixed inset-y-0 end-0 z-[91] w-full max-w-[680px] overflow-y-auto overflow-x-hidden overscroll-contain bg-navy text-white shadow-[0_0_120px_rgba(4,12,24,0.8)] outline-none"
        initial={reduced ? { opacity: 0 } : { x: `${100 * s}%` }}
        animate={reduced ? { opacity: 1 } : { x: '0%' }}
        exit={reduced ? { opacity: 0 } : { x: `${100 * s}%` }}
        transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.87, 0, 0.13, 1] }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -end-[40%] -top-[10%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(23,105,255,0.32),transparent)]" />
        </div>

        {/* Extra room at the bottom on phones keeps the Next button clear of the sound control. */}
        <div className="relative z-10 flex min-h-full flex-col px-6 pb-20 pt-4 md:px-10 md:pb-7">
          <div className="flex items-center justify-between gap-4">
            <p className="label text-ice/80">
              {c.certificate}{' '}
              <span className="latin">
                {two(number)} / {two(total)}
              </span>
            </p>
            <button type="button" onClick={onClose} className="label flex min-h-11 items-center gap-3">
              {c.close}
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25">
                <X size={15} strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>
          </div>

          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.12 }}
            className="mt-10 flex-1"
          >
            <div className="flex items-end justify-between gap-6">
              <span aria-hidden="true" style={LATIN_FACE} className="text-[clamp(6.5rem,24vw,11rem)] font-extrabold leading-[0.78] text-electric [font-stretch:62%]">
                {two(number)}
              </span>
              <span className="relative grid h-16 w-16 shrink-0 place-items-center border border-white/25 text-ice">
                <span aria-hidden="true" className="absolute -start-px -top-px h-4 w-4 border-s-2 border-t-2 border-electric" />
                <span aria-hidden="true" className="absolute -bottom-px -end-px h-4 w-4 border-b-2 border-e-2 border-electric" />
                <Icon strokeWidth={1.1} className="h-8 w-8" aria-hidden="true" />
              </span>
            </div>

            <p className="label mt-9 text-ice/80">{c.categories[cert.category]}</p>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,3.4vw,2.75rem)] font-extrabold leading-[1.15] tracking-[var(--track-display)] rtl:leading-[1.5]">
              <Name text={text.name} />
            </h2>

            <div className="mt-7 flex items-start gap-3 border border-electric bg-electric/15 px-4 py-3.5">
              <BadgeCheck size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ice" aria-hidden="true" />
              <p>
                <span className="label block text-ice/80">{c.status}</span>
                <span className="mt-1 block font-medium">{text.status}</span>
              </p>
            </div>

            <dl className="mt-8 border-t border-white/15">
              {rows.map((row) => (
                <div key={row.label} className="grid gap-x-6 gap-y-1 border-b border-white/15 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline">
                  <dt className="label text-white/60">{row.label}</dt>
                  <dd className="text-lg font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <h3 className="label mt-8 text-white/60">{c.description}</h3>
            <p className="mt-4 text-[clamp(1.1rem,1.6vw,1.3rem)] font-light leading-[1.6] rtl:leading-[1.95]">{text.desc}</p>
          </motion.div>

          {total > 1 && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
              <button type="button" onClick={() => onStep(-1)} className="label flex min-h-11 items-center gap-3 text-white/85 hover:text-white">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25">
                  <ArrowLeft size={15} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
                </span>
                {c.prev}
              </button>
              <button type="button" onClick={() => onStep(1)} className="label flex min-h-11 items-center gap-3 text-white/85 hover:text-white">
                {c.next}
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25">
                  <ArrowRight size={15} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
                </span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

interface Props {
  certifications: Remote<Certification[]>;
  /** Tells the page a details panel is open, so the page behind it can be made inert. */
  onPanel: (open: boolean) => void;
}

/** PROFESSIONAL CERTIFICATIONS: a filterable gallery. Each certificate opens in a side panel. */
export default function Certifications({ certifications, onPanel }: Props) {
  const { t, lang } = useLang();
  const c = t.certifications;
  const [filter, setFilter] = useState<CertificationCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const all = certifications.data ?? [];
  const shown = filter === 'all' ? all : all.filter((x) => x.category === filter);
  const openIndex = openId ? all.findIndex((x) => x.id === openId) : -1;
  const isOpen = openIndex >= 0;

  useEffect(() => {
    onPanel(isOpen);
  }, [isOpen, onPanel]);
  useEffect(() => () => onPanel(false), [onPanel]);

  const open = (id: string) => {
    sound.play('open');
    setOpenId(id);
  };
  const close = () => {
    sound.play('close');
    setOpenId(null);
  };
  // Previous / next walk the full list in serial order, wrapping at both ends.
  const step = (direction: 1 | -1) => {
    if (openIndex < 0) return;
    sound.play('step');
    setOpenId(all[(openIndex + direction + all.length) % all.length].id);
  };

  return (
    <section id="certifications" data-section className="relative overflow-hidden bg-white text-navy">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-4 px-5 md:px-10">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="border-s border-navy/[0.05] last:border-e" />
        ))}
      </div>

      <div className="relative mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={scene(10)} label={c.label} className="text-navy/70" />

        <div className="mt-10 grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <Reveal as="h2" text={c.heading} stagger={0.06} className="display-2 max-w-[18ch] text-[clamp(1.5rem,5vw,5.5rem)]" />
            <Reveal text={c.desc} stagger={0.012} className="mt-6 max-w-[46ch] text-lg leading-relaxed text-navy/75 md:text-xl rtl:leading-[1.9]" />
          </div>
          {all.length > 0 && (
            <p data-sound-reveal="certifications" className="flex items-end gap-4 md:col-span-4 md:justify-end">
              <span dir="ltr" style={LATIN_FACE} className="text-[clamp(6.5rem,14vw,15rem)] font-extrabold leading-[0.78] text-electric [font-stretch:62%]">
                <Counter value={all.length} />
              </span>
              <span className="label pb-2 text-navy/70">{plural(all.length, c.unit, lang)}</span>
            </p>
          )}
        </div>

        {certifications.loading ? (
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label={c.loading}>
            <div className="h-64 animate-pulse bg-navy/10" />
            <div className="h-64 animate-pulse bg-navy/10" />
            <div className="hidden h-64 animate-pulse bg-navy/10 lg:block" />
            <p className="label text-navy/60 sm:col-span-2 lg:col-span-3">{c.loading}…</p>
          </div>
        ) : certifications.error ? (
          <div className="mt-16 flex flex-col items-start gap-6 border-t border-navy/15 pt-10" role="alert">
            <p className="font-display text-2xl font-bold">{c.error}</p>
            <button type="button" onClick={certifications.reload} className="btn label">
              {t.work.retry}
            </button>
          </div>
        ) : all.length === 0 ? (
          <p className="mt-12 max-w-[44ch] border-s-2 border-electric ps-6 text-[clamp(1.2rem,1.9vw,1.7rem)] font-light leading-[1.5] text-navy/80">{c.empty}</p>
        ) : (
          <>
            <div role="group" aria-label={c.filtersLabel} className="mt-12 flex flex-wrap gap-2 border-t border-navy/15 pt-6 md:mt-16">
              {(['all', ...KEYS] as const).map((key) => {
                const Icon = key === 'all' ? null : ICONS[key];
                const count = key === 'all' ? all.length : all.filter((x) => x.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={filter === key}
                    data-sound="step"
                    onClick={() => setFilter(key)}
                    className={`label flex min-h-11 items-center gap-2.5 rounded-full border px-4 transition-colors duration-300 ${filter === key ? 'border-navy bg-navy text-white' : 'border-navy/20 text-navy/80 hover:border-navy hover:text-navy'}`}
                  >
                    {Icon && <Icon size={15} strokeWidth={1.6} aria-hidden="true" />}
                    {key === 'all' ? c.all : c.categories[key]}
                    <span className="latin opacity-70">{two(count)}</span>
                  </button>
                );
              })}
            </div>

            <p className="label mt-6 text-navy/60" role="status">
              {t.experience.showing} <span className="latin">{shown.length}</span> {t.experience.of} <span className="latin">{all.length}</span>
            </p>

            {shown.length === 0 ? (
              <p className="mt-10 text-lg text-navy/75">{c.emptyFilter}</p>
            ) : (
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 min-[1700px]:grid-cols-4">
                <AnimatePresence initial={false}>
                  {shown.map((cert, i) => (
                    <Card key={cert.id} cert={cert} number={all.indexOf(cert) + 1} column={i % 3} onOpen={() => open(cert.id)} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {isOpen && <Panel key="panel" cert={all[openIndex]} number={openIndex + 1} total={all.length} onClose={close} onStep={step} />}
      </AnimatePresence>
    </section>
  );
}
