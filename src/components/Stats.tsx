import { useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import { LATIN_FACE } from '../lib/person';

// The three figures supplied by the site owner. Nothing else is counted here.
const STATS = [
  { value: 8, unit: 'Years' },
  { value: 17, unit: 'Certifications' },
  { value: 200, unit: 'Projects' },
];

/** PROFESSIONAL STATISTICS: three figures that count up when they scroll into view. */
export default function Stats() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();

  useGsap(root, () => {
    const trigger = { trigger: root.current, start: 'top 75%', once: true };
    gsap.from('[data-stat]', { autoAlpha: 0, y: 36, duration: 1.1, ease: 'expo.out', stagger: 0.15, scrollTrigger: trigger });
    gsap.from('[data-count]', { textContent: 0, duration: 2.2, ease: 'power3.out', snap: { textContent: 1 }, stagger: 0.15, scrollTrigger: trigger });
    gsap.from('[data-stat-rule]', { scaleX: 0, duration: 1.6, ease: 'expo.inOut', stagger: 0.15, scrollTrigger: trigger });
  });

  return (
    <section ref={root} id="numbers" data-section data-nav="about" className="grain relative overflow-hidden bg-navy text-white">
      <div className="relative z-10 mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-32">
        <h2 className="label flex items-center gap-4 text-ice/80">
          <span aria-hidden="true" className="h-px w-10 bg-current opacity-50" />
          {t.stats.label}
        </h2>

        <ul data-sound-reveal="numbers" className="mt-12 grid gap-14 md:mt-16 md:grid-cols-3 md:gap-10">
          {STATS.map((stat, i) => (
            <li data-stat key={stat.unit}>
              <span data-stat-rule aria-hidden="true" className="block h-px origin-left bg-white/30 rtl:origin-right" />
              <p className="sr-only">
                {stat.value}+ {stat.unit} — {t.stats.items[i]}
              </p>
              <div aria-hidden="true">
                <p className="label latin mt-6 text-ice/80 rtl:text-right">{stat.unit}</p>
                <p dir="ltr" style={LATIN_FACE} className="mt-3 text-[clamp(6rem,13vw,14rem)] font-extrabold leading-[0.9] tracking-[-0.02em] [font-stretch:62%] rtl:text-right">
                  <span data-count className="tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-electric">+</span>
                </p>
                <p className="mt-5 max-w-[24ch] text-lg leading-relaxed text-white/80 md:text-xl">{t.stats.items[i]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
