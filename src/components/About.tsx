import { useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import { Reveal, SceneLabel } from './Reveal';

export default function About() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();

  useGsap(root, (s) => {
    // Oversized decorative word drifts horizontally with the scroll.
    gsap.fromTo(
      '[data-deco]',
      { xPercent: 6 * s },
      { xPercent: -22 * s, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    gsap.from('[data-rule]', {
      scaleX: 0,
      transformOrigin: s === 1 ? '0% 50%' : '100% 50%',
      duration: 1.4,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: '[data-rule]', start: 'top 90%', once: true },
    });
    gsap.from('[data-row]', {
      autoAlpha: 0,
      y: 18,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: '[data-rows]', start: 'top 88%', once: true },
    });
  });

  return (
    <section ref={root} id="about" data-section className="relative overflow-hidden bg-white text-navy">
      <div aria-hidden="true" data-deco className="display pointer-events-none absolute start-0 top-[4%] select-none whitespace-nowrap text-[30vw] text-ice/70">
        {t.about.deco}
      </div>

      <div className="relative mx-auto max-w-[1680px] px-5 py-28 md:px-10 md:py-44">
        <SceneLabel n={3} label={t.about.label} className="text-navy/70" />

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-10">
          <div className="md:sticky md:top-32 md:col-span-6 md:self-start">
            <h2 className="display-2 text-[clamp(2.3rem,5.2vw,5.75rem)]">
              <Reveal as="span" className="block" text={t.about.heading[0]} stagger={0.06} />
              <Reveal as="span" className="block text-electric" text={t.about.heading[1]} stagger={0.06} delay={0.15} />
            </h2>
            <span data-rule aria-hidden="true" className="mt-10 block h-[3px] w-28 bg-electric md:mt-14" />
            <p className="label mt-5 text-navy/60">{t.about.caption}</p>
          </div>

          <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
            <div className="max-w-[56ch] space-y-6 text-[1.0625rem] leading-[1.75] text-navy/80 md:text-lg">
              {t.about.paragraphs.map((p, i) => (
                <Reveal key={i} text={p} stagger={0.008} className={i === 2 ? 'font-medium text-navy' : undefined} />
              ))}
            </div>

            <ul data-rows className="mt-14 border-t border-navy/15">
              {t.about.disciplines.map((d, i) => (
                <li data-row key={d} className="flex items-baseline justify-between gap-6 border-b border-navy/15 py-4">
                  <span className="font-display text-xl font-bold md:text-2xl">{d}</span>
                  <span className="label latin text-electric">0{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
