import { useRef } from 'react';
import { AppWindow, ArrowUpRight, Clapperboard, Globe, Megaphone, PenLine, Users } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { scrollToId } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';
import { LATIN_FACE } from '../lib/person';
import { Reveal, SceneLabel } from './Reveal';

const ICONS = [Megaphone, PenLine, Globe, AppWindow, Clapperboard, Users];

/** PROFESSIONAL SERVICES: six services on a ruled grid. Each cell floods with blue on hover. */
export default function Services() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();
  const c = t.services;

  useGsap(root, () => {
    gsap.from('[data-cell]', { autoAlpha: 0, y: 44, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: '[data-grid]', start: 'top 80%', once: true } });
    gsap.from('[data-cta]', { autoAlpha: 0, y: 20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '[data-cta]', start: 'top 92%', once: true } });
  });

  return (
    <section ref={root} id="services" data-section className="relative bg-white text-navy">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={8} label={c.label} className="text-navy/70" />
        <Reveal as="h2" text={c.heading} stagger={0.06} className="display-2 mt-10 text-[clamp(2.1rem,6.4vw,7rem)]" />

        <ul data-grid className="mt-14 grid border-s border-t border-navy/15 sm:grid-cols-2 md:mt-24 lg:grid-cols-3">
          {c.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <li
                data-cell
                key={item.title}
                className="group relative isolate flex min-h-[19rem] flex-col overflow-hidden border-b border-e border-navy/15 p-7 transition-colors duration-500 hover:text-white md:min-h-[24rem] md:p-10"
              >
                <span aria-hidden="true" className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-electric transition-transform duration-700 ease-cine group-hover:scale-y-100" />
                <span
                  aria-hidden="true"
                  style={LATIN_FACE}
                  className="pointer-events-none absolute -bottom-6 end-3 -z-10 text-[11rem] font-extrabold leading-none text-navy/[0.05] transition-all duration-700 ease-cine [font-stretch:62%] group-hover:-translate-y-3 group-hover:text-white/15"
                >
                  0{i + 1}
                </span>

                <div className="flex items-start justify-between gap-6">
                  <span className="label latin text-navy/60 transition-colors duration-500 group-hover:text-white">0{i + 1}</span>
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.1}
                    className="h-12 w-12 text-electric transition-all duration-700 ease-cine group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:text-white md:h-14 md:w-14"
                  />
                </div>

                <div className="mt-auto pt-12">
                  <span aria-hidden="true" className="block h-[2px] w-10 origin-left bg-electric transition-all duration-700 ease-cine group-hover:w-20 group-hover:bg-white rtl:origin-right" />
                  <h3 className="mt-5 font-display text-[clamp(1.35rem,1.9vw,1.9rem)] font-extrabold leading-[1.2] tracking-[var(--track-display)] rtl:leading-[1.5]">{item.title}</h3>
                  <p className="mt-4 max-w-[40ch] leading-relaxed text-navy/75 transition-colors duration-500 group-hover:text-white rtl:leading-[1.9]">{item.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <button data-cta type="button" onClick={() => scrollToId('contact')} className="btn label mt-12">
          {t.contact.cta}
          <ArrowUpRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
