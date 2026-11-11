import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useGsap } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { LATIN_FACE } from '../../lib/person';
import { Reveal } from '../Reveal';
import { BLENDER_PICTURE, OpenBadge } from './shared';

/** Blender — 3D Modeling & Animation: a specialty inside the Creative Design chapter. */
export default function BlenderSpecialty({ onOpen }: { onOpen?: (slug: string, rect: DOMRect) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const b = t.blender;

  useGsap(root, (s) => {
    const once = (trigger: string, start = 'top 82%') => ({ trigger, start, once: true });
    gsap.from('[data-blender-rule]', { scaleX: 0, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', duration: 1.5, ease: 'expo.inOut', scrollTrigger: once('[data-blender-rule]', 'top 90%') });
    // The image wipes open from the reading side while the picture inside settles back.
    gsap.fromTo(
      '[data-blender-img]',
      { clipPath: s === 1 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: once('[data-blender-img]', 'top 85%') },
    );
    gsap.fromTo('[data-blender-img] img', { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-blender-img]', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('[data-blender-row]', { autoAlpha: 0, y: 26, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: once('[data-blender-text]') });
    gsap.from('[data-blender-cell]', { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: once('[data-blender-cells]', 'top 88%') });
  });

  return (
    <div ref={root} className="mt-20 md:mt-32">
      <span data-blender-rule aria-hidden="true" className="block h-px bg-navy/20" />

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-center">
        <figure className="md:col-span-7">
          <button
            type="button"
            data-cursor="view"
            data-cursor-label={t.work.view}
            aria-label={`${t.work.view}: ${b.name}`}
            onClick={(e) => onOpen?.(BLENDER_PICTURE.slug, e.currentTarget.getBoundingClientRect())}
            className="group block w-full text-start"
          >
            <span data-blender-img className="relative block aspect-[3/2] overflow-hidden bg-navy">
              <span className="block h-full w-full transition-transform duration-[1200ms] ease-cine group-hover:scale-[1.03]">
                <img src={BLENDER_PICTURE.src} alt="" width={BLENDER_PICTURE.width} height={BLENDER_PICTURE.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </span>
              <span aria-hidden="true" className="absolute start-4 top-4 h-5 w-5 border-s border-t border-white/70" />
              <span aria-hidden="true" className="absolute end-4 top-4 h-5 w-5 border-e border-t border-white/70" />
              <span aria-hidden="true" className="absolute bottom-4 start-4 h-5 w-5 border-b border-s border-white/70" />
              <span aria-hidden="true" className="absolute bottom-4 end-4 h-5 w-5 border-b border-e border-white/70" />
              <OpenBadge className="bottom-9 end-9" />
            </span>
          </button>
          <figcaption className="label mt-3 flex justify-between gap-4 text-navy/60">
            <span>{b.imageNote}</span>
            <span className="latin">3 : 2</span>
          </figcaption>
        </figure>

        <div data-blender-text className="md:col-span-5">
          <p data-blender-row className="label text-electric">
            {b.label}
          </p>
          <h4 data-blender-row lang="en" dir="ltr" style={LATIN_FACE} className="latin mt-5 text-[clamp(1.75rem,3.1vw,3.25rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] rtl:text-right">
            Blender <span className="text-electric">—</span> 3D Modeling &amp; Animation
          </h4>
          {b.title && (
            <p data-blender-row className="mt-4 font-display text-[clamp(1.2rem,1.7vw,1.6rem)] font-bold leading-[1.5]">
              {b.title}
            </p>
          )}
          <Reveal text={b.desc} stagger={0.01} className="mt-6 max-w-[52ch] text-[1.0625rem] leading-[1.75] text-navy/80 md:text-lg rtl:leading-[2]" />
        </div>
      </div>

      {/* The seven areas, on a ruled grid that opens with a heading cell. */}
      <div data-blender-cells className="mt-12 grid border-s border-t border-navy/15 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
        <div data-blender-cell className="flex min-h-[7.5rem] items-end justify-between gap-5 border-b border-e border-navy bg-navy p-5 text-white md:p-6">
          <p className="label text-ice">{b.fieldsLabel}</p>
          <span aria-hidden="true" style={LATIN_FACE} className="text-[4.5rem] font-extrabold leading-[0.8] text-electric [font-stretch:62%]">
            {String(b.fields.length).padStart(2, '0')}
          </span>
        </div>
        <ol className="contents">
          {b.fields.map((field, i) => (
            <li data-blender-cell key={field.name} className="group relative flex min-h-[7.5rem] flex-col justify-between gap-5 border-b border-e border-navy/15 p-5 md:p-6">
              <span className="label latin text-electric">0{i + 1}</span>
              <span>
                <span className="block font-display text-lg font-bold leading-[1.3] rtl:leading-[1.6]">{field.name}</span>
                {field.latin && (
                  <span lang="en" style={LATIN_FACE} className="latin mt-1 block text-[13px] tracking-[0.02em] text-navy/60 rtl:text-right">
                    {field.latin}
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-electric transition-transform duration-700 ease-cine group-hover:scale-x-100 rtl:origin-right" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
