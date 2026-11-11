import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { lockScroll } from '../lib/scroll';
import { SHOW_EXPERIENCE } from '../lib/features';
import { useLang, type Lang } from '../context/LanguageContext';
import { sound } from '../lib/sound';

const ALL_SECTION_IDS = ['home', 'about', 'story', 'specialties', 'services', 'experience', 'certifications', 'skills', 'work', 'contact'] as const;
export type SectionId = (typeof ALL_SECTION_IDS)[number];
// The Experience item is listed only while that section is shown.
export const SECTION_IDS: readonly SectionId[] = ALL_SECTION_IDS.filter((id) => SHOW_EXPERIENCE || id !== 'experience');

interface NavProps {
  active: SectionId;
  visible: boolean;
  onNavigate: (id: SectionId) => void;
  onSwitchLang: (lang: Lang) => void;
}

function LangSwitch({ onSwitchLang }: { onSwitchLang: (lang: Lang) => void }) {
  const { lang, t } = useLang();
  return (
    <div role="group" aria-label={t.nav.language} className="latin flex items-center text-[11px] font-medium tracking-[0.14em]">
      {(['en', 'ar'] as const).map((code, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="text-white/30">/</span>}
          <button
            type="button"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => onSwitchLang(code)}
            className={`grid h-10 min-w-9 place-items-center px-1.5 uppercase transition-colors duration-300 ${lang === code ? 'text-white' : 'text-white/45 hover:text-white'}`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}

export default function Nav({ active, visible, onNavigate, onSwitchLang }: NavProps) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false });

  // Active-section indicator: measured from the real button so it is correct in LTR and RTL.
  useLayoutEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const measure = () => {
      const el = ul.querySelector<HTMLElement>(`[data-id="${active}"]`);
      if (el && el.offsetWidth) setPill({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ul);
    return () => ro.disconnect();
  }, [active, lang]);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      sound.play('close');
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (id: SectionId) => {
    if (!open) return onNavigate(id);
    // Close the menu first: page scroll is locked while it is open.
    setOpen(false);
    window.setTimeout(() => onNavigate(id), 80);
  };

  return (
    <header>
      <a href="#main" className="skip-link label">
        {t.nav.skip}
      </a>

      <motion.nav
        aria-label={t.nav.aria}
        inert={!visible}
        initial={false}
        animate={{ y: visible ? 0 : -90, opacity: visible ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1], delay: visible && !reduced ? 0.5 : 0 }}
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-3 md:top-5"
      >
        <div className="pointer-events-auto flex w-full items-center justify-between gap-1 rounded-full border border-white/10 bg-navy/80 p-1.5 text-white shadow-[0_12px_40px_-12px_rgba(4,12,24,0.7)] backdrop-blur-md min-[1400px]:w-auto">
          <button type="button" data-sound="nav" onClick={() => go('home')} className="flex h-10 items-center gap-2.5 rounded-full ps-4 pe-3" aria-label={t.nav.items.home}>
            <span className="h-2 w-2 bg-electric" aria-hidden="true" />
            <span className="font-display text-[13px] font-extrabold tracking-[0.08em] [font-stretch:125%]">{t.brand}</span>
          </button>

          <ul ref={list} className="relative hidden items-center min-[1400px]:flex">
            {pill.ready && (
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-0 h-10 rounded-full bg-electric"
                initial={false}
                animate={{ x: pill.x, width: pill.w }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}
              />
            )}
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  data-id={id}
                  data-sound="nav"
                  onClick={() => go(id)}
                  aria-current={active === id ? 'true' : undefined}
                  className={`relative grid h-10 place-items-center whitespace-nowrap px-3 text-[11px] font-semibold uppercase tracking-[0.12em] 2xl:px-4 2xl:tracking-[0.16em] transition-colors duration-300 rtl:text-[13px] ${active === id ? 'text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {t.nav.items[id]}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center">
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-white/15 min-[1400px]:block" />
            <LangSwitch onSwitchLang={onSwitchLang} />
            <button
              type="button"
              onClick={() => {
                sound.play(open ? 'close' : 'open');
                setOpen((v) => !v);
              }}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.close : t.nav.menu}
              className="grid h-10 w-11 place-items-center rounded-full bg-white/10 min-[1400px]:hidden"
            >
              <span className="relative block h-2.5 w-5" aria-hidden="true">
                <span className={`absolute inset-x-0 top-0 h-px bg-white transition-transform duration-500 ease-cine ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-white transition-transform duration-500 ease-cine ${open ? '-translate-y-[4px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="grain fixed inset-0 z-[55] flex flex-col justify-between gap-8 overflow-y-auto bg-navy px-5 pb-8 pt-28 text-white min-[1400px]:hidden"
            initial={reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: reduced ? 0.2 : 0.75, ease: [0.87, 0, 0.13, 1] }}
          >
            <ul className="relative z-10">
              {SECTION_IDS.map((id, i) => (
                <li key={id} className="overflow-hidden border-b border-white/10">
                  <motion.button
                    type="button"
                    data-sound="nav"
                    onClick={() => go(id)}
                    initial={reduced ? false : { y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.06 }}
                    className={`display-2 flex w-full items-baseline gap-4 py-1.5 text-start text-[clamp(1.35rem,6.4vw,2.75rem)] ${active === id ? 'text-electric' : 'text-white'}`}
                  >
                    <span className="label latin text-white/50">{String(i + 1).padStart(2, '0')}</span>
                    {t.nav.items[id]}
                  </motion.button>
                </li>
              ))}
            </ul>
            <p className="label relative z-10 text-white/50">{t.fullName}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
