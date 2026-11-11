import { useRef, type ReactNode } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import type { Channel, Remote } from '../lib/api';
import { ARABIC_FACE, GRADUATION_YEAR, LATIN_FACE, NAME_AR, NAME_EN } from '../lib/person';
import { Reveal, SceneLabel } from './Reveal';
import ChannelValue from './ChannelValue';

/** PERSONAL INFORMATION: an editorial fact sheet, one fact per ruled line. */
export default function Profile({ channels }: { channels: Remote<Channel[]> }) {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();
  const c = t.profile;

  useGsap(root, (s) => {
    const trigger = { trigger: '[data-rows]', start: 'top 82%', once: true };
    gsap.from('[data-row]', { autoAlpha: 0, y: 22, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: trigger });
    gsap.from('[data-row-rule]', { scaleX: 0, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', duration: 1.3, ease: 'expo.inOut', stagger: 0.07, scrollTrigger: trigger });
    gsap.from('[data-tab]', { autoAlpha: 0, y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-tab]', start: 'top 88%', once: true } });
  });

  const rows: Array<{ label: string; value: ReactNode }> = [
    {
      label: c.rows.name,
      value: (
        <span lang="ar" dir="rtl" style={ARABIC_FACE} className="inline-block leading-[1.5]">
          {NAME_AR}
        </span>
      ),
    },
    {
      label: c.rows.englishName,
      value: (
        <span lang="en" style={LATIN_FACE} className="latin inline-block">
          {NAME_EN}
        </span>
      ),
    },
    { label: c.rows.location, value: t.identity.locationValue },
    { label: c.rows.email, value: <ChannelValue channels={channels} kind="email" /> },
    { label: c.rows.phone, value: <ChannelValue channels={channels} kind="phone" /> },
    { label: c.rows.qualification, value: c.qualification },
    { label: c.rows.university, value: c.university },
    { label: c.rows.graduation, value: <span className="latin" style={{ fontFamily: 'inherit' }}>{GRADUATION_YEAR}</span> },
  ];

  return (
    <section ref={root} id="profile" data-section data-nav="about" className="relative bg-mist text-navy">
      <div className="mx-auto grid max-w-[1680px] gap-14 px-5 py-24 md:grid-cols-12 md:gap-10 md:px-10 md:py-40">
        <div className="md:sticky md:top-32 md:col-span-5 md:self-start">
          <SceneLabel n={4} label={c.label} className="text-navy/70" />
          <Reveal as="h2" text={c.heading} stagger={0.07} className="display-2 mt-10 max-w-[9ch] text-[clamp(2.1rem,5vw,5.5rem)]" />

          {/* File tab: a quiet graphic anchor for the fact sheet */}
          <div data-tab aria-hidden="true" dir="ltr" className="relative mt-12 hidden w-56 border border-navy/20 p-5 md:block">
            <span className="absolute -left-px -top-px h-5 w-5 border-l-2 border-t-2 border-electric" />
            <span className="absolute -bottom-px -right-px h-5 w-5 border-b-2 border-r-2 border-electric" />
            <p className="label latin text-navy/60">File 01 — Profile</p>
            <div className="mt-5 flex items-end justify-between">
              <span className="h-12 w-12 bg-electric" />
              <span className="flex h-12 items-end gap-[3px]">
                {[10, 22, 6, 30, 14, 38, 8, 26, 18, 44, 12, 32].map((h, i) => (
                  <i key={i} className="block w-[3px] bg-navy" style={{ height: h }} />
                ))}
              </span>
            </div>
          </div>
        </div>

        <dl data-rows className="md:col-span-7">
          {rows.map((row) => (
            <div data-row key={row.label} className="relative grid gap-x-8 gap-y-1 py-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline md:py-6">
              <span data-row-rule aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-navy/20" />
              <dt className="label text-navy/60">{row.label}</dt>
              <dd className="min-w-0 font-display text-[clamp(1.2rem,1.9vw,1.75rem)] font-bold leading-[1.3] rtl:leading-[1.6]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
