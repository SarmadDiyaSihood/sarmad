import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useLang } from '../context/LanguageContext';
import { scene } from '../lib/features';
import { Reveal, SceneLabel } from './Reveal';

/**
 * FROM IDEA TO IMPACT.
 * Desktop: the section pins and the timeline is drawn by the scroll, stage by stage.
 * Mobile: a vertical timeline whose line fills as you scroll, each stage rising in on entry.
 */
export default function Process() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { t, lang, s } = useLang();

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px) and (min-height: 720px)', () => {
      const stages = q('[data-stage]');
      const nums = q('[data-num]');
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: q('[data-pin]')[0], start: 'top top', end: '+=220%', pin: true, scrub: 0.6, anticipatePin: 1 },
      });
      tl.fromTo(q('[data-line-h]'), { scaleX: 0 }, { scaleX: 1, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', ease: 'none', duration: 4 }, 0);
      gsap.set(stages.slice(1), { opacity: 0.28, y: 26 });
      gsap.set(nums.slice(1), { autoAlpha: 0, yPercent: 18 });
      stages.forEach((stage, i) => {
        if (i === 0) return;
        tl.to(stage, { opacity: 1, y: 0, duration: 0.5 }, i - 0.15);
        tl.to(q('[data-dot]')[i], { scale: 1, duration: 0.3 }, i - 0.15);
        tl.to(nums[i - 1], { autoAlpha: 0, yPercent: -18, duration: 0.35 }, i - 0.3);
        tl.to(nums[i], { autoAlpha: 1, yPercent: 0, duration: 0.45 }, i - 0.1);
      });
      gsap.set(q('[data-dot]').slice(1), { scale: 0.35 });
    });

    mm.add('(max-width: 1023.98px), (max-height: 719.98px)', () => {
      gsap.fromTo(
        q('[data-line-v]'),
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: { trigger: q('[data-stages]')[0], start: 'top 70%', end: 'bottom 60%', scrub: true } },
      );
      q('[data-stage]').forEach((stage) => {
        gsap.from(stage, { autoAlpha: 0, y: 36, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
      });
    });

    return () => mm.revert();
  }, [reduced, lang, s]);

  return (
    <section ref={root} id="process" data-section data-nav="work" className="on-electric relative overflow-hidden bg-electric text-white">
      <div data-pin className="relative flex min-h-[100svh] flex-col justify-between gap-16 px-5 pb-16 pt-28 md:px-10 lg:pb-14 lg:pt-28">
        {/* Oversized stage number */}
        <div aria-hidden="true" className="pointer-events-none absolute end-5 top-20 hidden h-[30vw] w-[40vw] lg:block">
          {t.process.stages.map((_, i) => (
            <span data-num key={i} className="display latin absolute end-0 top-0 text-[30vw] leading-none text-white/15" style={{ fontFamily: 'var(--font-display)' }}>
              0{i + 1}
            </span>
          ))}
        </div>

        <div className="relative">
          <SceneLabel n={scene(13)} label={t.process.label} className="text-white/85" />
          <Reveal as="h2" text={t.process.heading} stagger={0.07} className="display mt-8 max-w-[12ch] text-[clamp(2.6rem,min(8.4vw,14svh),9rem)]" />
        </div>

        <div data-stages className="relative">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-px bg-white/30 lg:block">
            <span data-line-h className="block h-full bg-white" />
          </div>
          <div aria-hidden="true" className="absolute bottom-0 start-[5px] top-0 w-px bg-white/30 lg:hidden">
            <span data-line-v className="block h-full w-full bg-white" />
          </div>

          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-8">
            {t.process.stages.map((stage, i) => (
              <li data-stage key={stage.title} className="relative ps-9 lg:ps-0 lg:pt-9">
                <span data-dot aria-hidden="true" className="absolute start-0 top-2 h-[11px] w-[11px] rounded-full bg-white lg:-top-[5px]" />
                <p className="label latin text-white/80">0{i + 1}</p>
                <h3 className="display-2 mt-3 text-[clamp(1.9rem,3vw,3rem)]">{stage.title}</h3>
                <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/90 md:text-base">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
