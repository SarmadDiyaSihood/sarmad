import { useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import { LATIN_FACE } from '../lib/person';
import { Reveal, SceneLabel, Timecode } from './Reveal';

const WAVE = [22, 48, 34, 70, 52, 88, 40, 64, 96, 58, 30, 76, 46, 84, 36, 60, 92, 44, 68, 28, 54, 80, 38, 62];
const BARS = [38, 58, 50, 84, 108, 138];
const NODES = [
  [60, 50],
  [252, 44],
  [282, 132],
  [190, 172],
  [68, 150],
];
const CODE: Array<[prompt: string, text: string]> = [
  ['>>>', 'stack = ['],
  ['...', '  "python", "web",'],
  ['...', '  "security",'],
  ['...', ']'],
  ['>>>', 'build(stack)'],
];

/** 01: a camera viewfinder with a live sound wave. */
function VisualMedia() {
  return (
    <div className="relative h-full w-full bg-navy text-white">
      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-white/60" />
      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-white/60" />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-white/60" />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-white/60" />
      <div className="label latin absolute inset-x-7 top-6 flex justify-between text-white/80">
        <span className="flex items-center gap-2">
          <span className="rec-dot" /> REC
        </span>
        <Timecode />
      </div>
      <div className="absolute inset-x-9 top-1/2 flex h-[38%] -translate-y-1/2 items-center justify-between">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-electric"
            style={{ height: `${h}%`, animation: `bars ${0.7 + (i % 5) * 0.13}s ease-in-out ${-(i % 7) * 0.17}s infinite alternate` }}
          />
        ))}
      </div>
    </div>
  );
}

/** 02: columns rising under a trend line. A drawing, not data. */
function VisualMarketing() {
  const tops = BARS.map((h, i) => `${47 + i * 45},${170 - h - 12}`).join(' ');
  return (
    <div className="relative h-full w-full border border-navy/15 bg-white">
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full">
        {[50, 90, 130].map((y) => (
          <line key={y} x1="24" x2="296" y1={y} y2={y} stroke="#071426" strokeOpacity="0.12" strokeDasharray="2 6" />
        ))}
        <line x1="24" x2="296" y1="170" y2="170" stroke="#071426" strokeOpacity="0.5" />
        {BARS.map((h, i) => (
          <rect data-bar key={i} x={36 + i * 45} y={170 - h} width="22" height={h} fill={i > 3 ? '#1769FF' : '#071426'} fillOpacity={i > 3 ? 1 : 0.16 + i * 0.12} />
        ))}
        <polyline data-draw points={tops} fill="none" stroke="#1769FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle data-pop cx={47 + 5 * 45} cy={170 - BARS[5] - 12} r="5" fill="#1769FF" />
      </svg>
    </div>
  );
}

/** 03: a Python prompt. */
function VisualTech() {
  return (
    <div className="flex h-full w-full flex-col bg-navy-deep text-white">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <i className="h-2 w-2 rounded-full bg-white/25" />
        <i className="h-2 w-2 rounded-full bg-white/25" />
        <i className="h-2 w-2 rounded-full bg-electric" />
        <span className="latin ms-3 text-[10px] tracking-[0.12em] text-white/50">python</span>
      </div>
      <pre className="latin flex-1 overflow-hidden px-4 py-3 text-[clamp(10px,1vw,13px)] leading-[1.75] text-white/80">
        {CODE.map(([prompt, text], i) => (
          <div data-type-line key={i} className="flex gap-3">
            <span className="select-none text-electric">{prompt}</span>
            <code>
              {text}
              {i === CODE.length - 1 && <span className="caret ms-1" />}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

/** 04: an art director's board. Type specimen, palette and composition grid. */
function VisualArt({ specimen }: { specimen: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-ice text-navy">
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(7,20,38,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(7,20,38,0.09)_1px,transparent_1px)] [background-size:12.5%_25%]" />
      <span className="absolute left-[8%] top-[6%] font-display text-[clamp(3.25rem,6.5vw,6rem)] font-black leading-none">{specimen}</span>
      <span className="absolute right-[9%] top-[12%] aspect-square h-[40%] rounded-full bg-electric mix-blend-multiply transition-transform duration-700 ease-cine group-hover:scale-110" />
      <div className="absolute inset-x-[8%] bottom-[10%] flex h-[22%] gap-[2.5%]">
        {['#071426', '#1769FF', '#FFFFFF', '#F3F5F8'].map((hex, i) => (
          <span
            data-pop
            key={hex}
            className="flex-1 border border-navy/15 transition-transform duration-700 ease-cine group-hover:-translate-y-2"
            style={{ background: hex, transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** 05: one idea radiating into a connected concept. */
function VisualCreative() {
  return (
    <div className="relative h-full w-full bg-electric text-white">
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" fill="none" stroke="currentColor">
        <polygon data-draw points={NODES.map((n) => n.join(',')).join(' ')} strokeOpacity="0.35" strokeDasharray="3 6" />
        {NODES.map(([x, y]) => (
          <line data-draw key={`${x}-${y}`} x1="160" y1="104" x2={x} y2={y} strokeWidth="1.25" />
        ))}
        {NODES.map(([x, y]) => (
          <circle data-pop key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#1769FF" strokeWidth="1.5" />
        ))}
        <circle data-pop cx="160" cy="104" r="13" fill="#FFFFFF" stroke="none" />
        <circle cx="160" cy="104" r="24" strokeOpacity="0.5" />
      </svg>
    </div>
  );
}

/** PROFESSIONAL SPECIALTIES: five areas, each with its own drawn visual. */
export default function Specialties() {
  const root = useRef<HTMLElement>(null);
  const { t, lang } = useLang();
  const c = t.specialties;
  const visuals = [<VisualMedia />, <VisualMarketing />, <VisualTech />, <VisualArt specimen={lang === 'ar' ? 'أب' : 'Aa'} />, <VisualCreative />];

  useGsap(root, () => {
    root.current?.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
      const q = gsap.utils.selector(row);
      const st = { trigger: row, start: 'top 80%', once: true };
      gsap.from(q('[data-in]'), { autoAlpha: 0, y: 36, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: st });
      gsap.fromTo(q('[data-visual]'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: st });
      const bars = q('[data-bar]');
      if (bars.length) gsap.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.5, scrollTrigger: st });
      row.querySelectorAll<SVGGeometryElement>('[data-draw]').forEach((shape, i) => {
        const len = shape.getTotalLength();
        const dashed = shape.getAttribute('stroke-dasharray');
        gsap.fromTo(
          shape,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', delay: 0.6 + i * 0.08, scrollTrigger: st, onComplete: () => void (dashed && gsap.set(shape, { strokeDasharray: dashed })) },
        );
      });
      const pops = q('[data-pop]');
      if (pops.length) gsap.from(pops, { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)', stagger: 0.08, delay: 1, scrollTrigger: st });
      const typed = q('[data-type-line]');
      if (typed.length) gsap.from(typed, { autoAlpha: 0, x: -10, duration: 0.4, ease: 'power2.out', stagger: 0.16, delay: 0.7, scrollTrigger: st });
    });
  });

  return (
    <section ref={root} id="specialties" data-section className="relative bg-mist text-navy">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={6} label={c.label} className="text-navy/70" />
        <Reveal as="h2" text={c.heading} stagger={0.06} className="display-2 mt-10 text-[clamp(2.1rem,6.4vw,7rem)]" />

        <ol className="mt-14 border-b border-navy/15 md:mt-24">
          {c.items.map((item, i) => {
            const flip = i % 2 === 1;
            return (
              <li data-row key={item.title} className="group grid items-center gap-8 border-t border-navy/15 py-12 md:grid-cols-12 md:gap-10 md:py-16">
                <div className={`flex flex-col gap-4 md:col-span-7 md:flex-row md:gap-10 ${flip ? 'md:order-2 md:col-start-6' : ''}`}>
                  <span data-in aria-hidden="true" style={LATIN_FACE} className="shrink-0 text-[clamp(4rem,8vw,8.5rem)] font-extrabold leading-[0.85] text-electric [font-stretch:62%]">
                    0{i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 data-in className="display-2 text-[clamp(1.6rem,3.2vw,3.3rem)]">
                      {item.title}
                    </h3>
                    <p data-in className="mt-5 max-w-[56ch] text-[1.0625rem] leading-[1.75] text-navy/80 md:text-lg rtl:leading-[2]">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className={`md:col-span-4 ${flip ? 'md:order-1 md:col-start-1' : 'md:col-start-9'}`}>
                  <div data-visual dir="ltr" aria-hidden="true" className="aspect-[16/10] w-full overflow-hidden">
                    {visuals[i]}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
