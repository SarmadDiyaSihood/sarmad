import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import type { Channel, Remote } from '../lib/api';
import { ARABIC_FACE, LATIN_FACE, NAME_AR, NAME_EN } from '../lib/person';
import { SceneLabel } from './Reveal';
import ChannelValue from './ChannelValue';

/** The name in one script. The current language's script is the large line; the other sits beneath it. */
function Name({ script, primary, align }: { script: 'ar' | 'en'; primary: boolean; align: string }) {
  if (script === 'ar') {
    return (
      <span
        data-name="ar"
        lang="ar"
        dir="rtl"
        style={ARABIC_FACE}
        className={`block font-extrabold leading-[1.4] ${align} ${primary ? 'text-[clamp(2.2rem,9vw,9.5rem)] text-navy' : 'mt-2 text-[clamp(1.6rem,4.6vw,4.75rem)] text-electric'}`}
      >
        {NAME_AR}
      </span>
    );
  }
  return (
    <span
      data-name="en"
      lang="en"
      dir="ltr"
      style={LATIN_FACE}
      className={`latin block font-extrabold uppercase leading-[1.05] tracking-[-0.035em] ${align} ${primary ? 'text-[clamp(1.5rem,7.2vw,8.5rem)] text-navy' : 'mt-3 text-[clamp(1.5rem,3.4vw,3.75rem)] text-electric'}`}
    >
      {NAME_EN}
    </span>
  );
}

/** PROFESSIONAL IDENTITY: the name in both scripts, the professional titles one by one, and direct contact. */
export default function Identity({ channels }: { channels: Remote<Channel[]> }) {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { t, lang } = useLang();
  const c = t.identity;
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The highlight walks through the titles one at a time while the list is on screen.
  useEffect(() => {
    if (reduced || !visible) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % c.titles.length), 2200);
    return () => window.clearInterval(id);
  }, [reduced, visible, c.titles.length]);

  useGsap(root, (s) => {
    const once = (trigger: string, start = 'top 85%') => ({ trigger, start, once: true });
    const wipe = { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' };
    gsap.fromTo('[data-name="en"]', { clipPath: 'inset(0% 100% 0% 0%)' }, { ...wipe, delay: s === 1 ? 0 : 0.2, scrollTrigger: once('[data-names]') });
    gsap.fromTo('[data-name="ar"]', { clipPath: 'inset(0% 0% 0% 100%)' }, { ...wipe, delay: s === 1 ? 0.2 : 0, scrollTrigger: once('[data-names]') });
    gsap.from('[data-rule]', { scaleX: 0, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', duration: 1.5, ease: 'expo.inOut', scrollTrigger: once('[data-rule]', 'top 90%') });
    gsap.from('[data-title-row]', { autoAlpha: 0, x: -36 * s, duration: 0.9, ease: 'expo.out', stagger: 0.2, scrollTrigger: once('[data-titles]', 'top 82%') });
    gsap.from('[data-contact]', { autoAlpha: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: once('[data-contacts]', 'top 88%') });
  });

  const align = lang === 'ar' ? 'text-right' : 'text-left';
  const scripts = lang === 'ar' ? (['ar', 'en'] as const) : (['en', 'ar'] as const);

  return (
    <section ref={root} id="identity" data-section data-nav="home" className="relative overflow-hidden bg-ice text-navy">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-4 px-5 md:px-10">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="border-s border-navy/[0.06] last:border-e" />
        ))}
      </div>

      <div className="relative mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={2} label={c.label} className="text-navy/70" />

        <h2 data-names className="mt-10 md:mt-14" aria-label={`${NAME_AR} — ${NAME_EN}`}>
          {scripts.map((script, i) => (
            <Name key={script} script={script} primary={i === 0} align={align} />
          ))}
        </h2>

        <div data-rule className="mt-12 h-px bg-navy/25 md:mt-20" />

        <div className="mt-12 grid gap-14 md:mt-16 md:grid-cols-12 md:gap-10">
          <div data-titles className="md:col-span-7">
            <p className="label text-navy/70">{c.titlesLabel}</p>
            <ol ref={list} className="mt-6 border-t border-navy/15">
              {c.titles.map((title, i) => {
                const on = !reduced && i === active;
                return (
                  <li data-title-row key={title} onMouseEnter={() => setActive(i)} className="flex items-center gap-4 border-b border-navy/15 py-4 md:py-5">
                    <span className={`label latin w-7 shrink-0 transition-colors duration-500 ${on ? 'text-navy' : 'text-navy/50'}`}>0{i + 1}</span>
                    <span aria-hidden="true" className={`h-[2px] shrink-0 bg-electric transition-[width] duration-700 ease-cine ${on ? 'w-8 md:w-16' : 'w-0'}`} />
                    <span
                      className={`min-w-0 font-display text-[clamp(1.5rem,3.3vw,3.4rem)] font-extrabold leading-[1.15] tracking-[var(--track-display)] transition-colors duration-500 rtl:leading-[1.45] ${on ? 'text-electric' : 'text-navy'}`}
                    >
                      {title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div data-contacts className="md:col-span-4 md:col-start-9">
            <p className="label text-navy/70">{c.contactLabel}</p>
            <dl className="mt-6 border-t border-navy/15">
              <div data-contact className="border-b border-navy/15 py-5">
                <dt className="label text-navy/60">{c.email}</dt>
                <dd className="mt-2 text-lg font-medium md:text-xl">
                  <ChannelValue channels={channels} kind="email" />
                </dd>
              </div>
              <div data-contact className="border-b border-navy/15 py-5">
                <dt className="label text-navy/60">{c.phone}</dt>
                <dd className="mt-2 text-lg font-medium md:text-xl">
                  <ChannelValue channels={channels} kind="phone" />
                </dd>
              </div>
              <div data-contact className="border-b border-navy/15 py-5">
                <dt className="label text-navy/60">{c.location}</dt>
                <dd className="mt-2 text-lg font-medium md:text-xl">{c.locationValue}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
