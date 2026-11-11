import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { scrollToId } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';
import { Split, Timecode } from './Reveal';

const pad4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');

export default function Hero({ started }: { started: boolean }) {
  const root = useRef<HTMLElement>(null);
  const finder = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { t, lang, dir } = useLang();

  // Entrance choreography (starts when the intro's letterbox opens) + scroll parallax.
  useGsap(
    root,
    (s) => {
      if (!started) return;
      gsap
        .timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
        .fromTo('[data-img]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, 0)
        .from('[data-img] img', { scale: 1.4, duration: 2.2 }, 0)
        .from('[data-block]', { scaleY: 0, transformOrigin: '50% 100%', duration: 1.2, ease: 'expo.inOut' }, 0.2)
        .from('[data-l1] .rv-inner', { yPercent: 118, xPercent: 18 * s, duration: 1.25, stagger: 0.06 }, 0.45)
        .from('[data-l2] .rv-inner', { yPercent: 118, duration: 1.1, stagger: 0.035 }, 0.75)
        .from('[data-role]', { autoAlpha: 0, x: -18 * s, duration: 0.8, stagger: 0.1 }, 1.0)
        .from('[data-statement] .rv-inner', { yPercent: 118, duration: 0.9, stagger: 0.03 }, 1.1)
        .from('[data-fade]', { autoAlpha: 0, duration: 1, stagger: 0.12 }, 1.3);

      const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('[data-img]', { yPercent: -10, ease: 'none', scrollTrigger: scrub });
      gsap.to('[data-block]', { yPercent: 26, ease: 'none', scrollTrigger: scrub });
      gsap.to('[data-title]', { yPercent: -7, ease: 'none', scrollTrigger: scrub });
      gsap.to('[data-orbit]', { rotate: 70 * s, ease: 'none', scrollTrigger: scrub });
    },
    [started],
  );

  // The portrait is a bright photo and the name crosses its lower part. Fade the photo into the navy from
  // the first line of text that actually crosses it (never above the collar): the lettering stays legible,
  // the face stays clear, and the photo is left untouched wherever nothing overlaps it.
  useLayoutEffect(() => {
    const section = root.current;
    const frame = section?.querySelector<HTMLElement>('[data-frame]');
    if (!section || !frame) return;
    // Layout position inside the section (ignores the parallax and entrance transforms).
    const place = (el: HTMLElement) => {
      let top = 0;
      let left = 0;
      for (let node: HTMLElement | null = el; node && node !== section; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop;
        left += node.offsetLeft;
      }
      return { top, left };
    };
    // Distance from a line's box to the top of its lettering. Arabic sits well below the top of its line box.
    const pen = document.createElement('canvas').getContext('2d');
    const inkOffset = (line: HTMLElement) => {
      if (!pen || line.hasAttribute('data-statement')) return 0;
      const style = getComputedStyle(line);
      pen.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = pen.measureText(line.textContent ?? '');
      const lineHeight = parseFloat(style.lineHeight);
      if (!Number.isFinite(lineHeight) || !m.fontBoundingBoxAscent) return 0;
      const baseline = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      return Math.max(0, Math.min(line.offsetHeight, baseline - m.actualBoundingBoxAscent));
    };
    const update = () => {
      const f = { ...place(frame), width: frame.offsetWidth, height: frame.offsetHeight };
      let first = Infinity;
      section.querySelectorAll<HTMLElement>('[data-l1], [data-l2], [data-statement]').forEach((line) => {
        if (!line.offsetWidth) return;
        const range = document.createRange();
        range.selectNodeContents(line);
        // The name lines are full-width blocks: only the lettering itself counts, measured from the reading side.
        const width = line.hasAttribute('data-statement') ? line.offsetWidth : Math.min(line.offsetWidth, range.getBoundingClientRect().width);
        const box = place(line);
        const start = dir === 'rtl' ? box.left + line.offsetWidth - width : box.left;
        const top = box.top + inkOffset(line);
        const crosses = start < f.left + f.width && start + width > f.left && top < f.top + f.height && box.top + line.offsetHeight > f.top;
        if (crosses) first = Math.min(first, top);
      });
      const at = Number.isFinite(first) ? ((first - f.top) / f.height) * 100 : 100;
      frame.style.setProperty('--fade', `${Math.min(100, Math.max(47, at)).toFixed(1)}%`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(section);
    void document.fonts?.ready.then(update);
    return () => observer.disconnect();
  }, [lang, dir]);

  // Mouse: 2D layered parallax + a viewfinder frame that trails the pointer.
  useEffect(() => {
    const el = root.current;
    const frame = finder.current;
    if (!el || !frame || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-px]')).map((node) => ({
      depth: Number(node.dataset.px),
      x: gsap.quickTo(node, 'x', { duration: 1, ease: 'power3' }),
      y: gsap.quickTo(node, 'y', { duration: 1, ease: 'power3' }),
    }));
    const fx = gsap.quickTo(frame, 'x', { duration: 0.55, ease: 'power3' });
    const fy = gsap.quickTo(frame, 'y', { duration: 0.55, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      layers.forEach((l) => {
        l.x((x / r.width - 0.5) * l.depth);
        l.y((y / r.height - 0.5) * l.depth);
      });
      fx(x);
      fy(y);
      if (coords.current) coords.current.textContent = `X ${pad4(x)}  Y ${pad4(y)}`;
    };
    const show = () => gsap.to(frame, { autoAlpha: 1, duration: 0.4 });
    const hide = () => gsap.to(frame, { autoAlpha: 0, duration: 0.4 });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerenter', show);
    el.addEventListener('pointerleave', hide);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerenter', show);
      el.removeEventListener('pointerleave', hide);
    };
  }, [reduced, lang]);

  return (
    <section ref={root} id="home" data-section className="grain relative isolate min-h-[100svh] overflow-hidden bg-navy text-white">
      {/* Swiss column grid */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 grid grid-cols-4 px-5 md:px-10">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="border-s border-white/[0.06] last:border-e" />
        ))}
      </div>
      <svg data-orbit aria-hidden="true" viewBox="0 0 100 100" className="absolute -bottom-[26vw] -start-[16vw] -z-10 h-[62vw] w-[62vw] text-electric">
        <circle cx="50" cy="50" r="49.6" fill="none" stroke="currentColor" strokeWidth="0.14" strokeDasharray="0.5 1.3" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.08" opacity="0.5" />
      </svg>

      {/* Image composition */}
      <div data-frame className="absolute end-5 top-24 h-[44svh] w-[min(60vw,40svh)] md:end-[7vw] md:top-[max(13svh,5.5rem)] md:h-[70svh] md:w-[clamp(31vw,42svh,52vw)]">
        <div data-px="-28" className="absolute -end-3 -top-3 h-[52%] w-[68%] md:-end-6 md:-top-6">
          <div data-block className="h-full w-full bg-electric" />
        </div>
        <div data-px="16" className="absolute inset-0">
          <div data-img className="relative h-full w-full overflow-hidden bg-navy-deep">
            <div className="kenburns relative h-full w-full">
              <img src="/images/sarmad-portrait.jpg" alt={t.fullName} width={1599} height={1504} fetchPriority="high" decoding="async" className="hero-portrait" />
            </div>
            <div aria-hidden="true" className="hero-fade pointer-events-none absolute inset-0" />
          </div>
        </div>
        <p data-fade className="label absolute -end-7 top-0 hidden gap-5 text-navy/70 [writing-mode:vertical-rl] md:flex">
          <span>{t.hero.frame}</span>
          <Timecode />
        </p>
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between gap-10 px-5 pb-7 pt-[max(7rem,calc(6rem+24svh))] md:px-10 md:pb-9 md:pt-32">
        <ul className="hidden space-y-1.5 md:block">
          {t.hero.roles.map((role, i) => (
            <li data-role key={role} className="flex items-baseline gap-4 text-[15px] text-white/85">
              <span className="label latin text-electric">0{i + 1}</span>
              {role}
            </li>
          ))}
        </ul>

        <div data-title className="mt-auto">
          <h1 className="display" aria-label={t.fullName}>
            <span aria-hidden="true" data-l1 className="hero-l1 block">
              <Split text={t.hero.line1} by="char" />
            </span>
            <span aria-hidden="true" data-l2 className="hero-l2 ms-[7vw] block text-electric">
              <Split text={t.hero.line2} by="char" />
            </span>
          </h1>

          <div className="mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-end md:justify-between">
            <ul className="space-y-1 md:hidden">
              {t.hero.roles.map((role, i) => (
                <li data-role key={role} className="flex items-baseline gap-3 text-sm text-white/85">
                  <span className="label latin text-electric">0{i + 1}</span>
                  {role}
                </li>
              ))}
            </ul>
            <button data-fade type="button" onClick={() => scrollToId('about')} className="label hidden items-center gap-4 text-white/70 hover:text-white md:flex">
              <span className="scroll-line" aria-hidden="true" />
              {t.hero.scroll}
            </button>
            <p data-statement className="max-w-[26ch] text-[clamp(1.1rem,1.75vw,1.65rem)] font-light leading-[1.3] md:text-end">
              <Split text={t.hero.statement} />
            </p>
            <button data-fade type="button" onClick={() => scrollToId('about')} className="label flex items-center gap-4 self-start text-white/70 md:hidden">
              <span className="scroll-line" aria-hidden="true" />
              {t.hero.scroll}
            </button>
          </div>
        </div>
      </div>

      {/* Mouse-following viewfinder */}
      <div ref={finder} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 z-20 opacity-0">
        <div className="relative h-[140px] w-[140px] text-ice/80" style={{ marginLeft: -70, marginTop: -70 }} dir="ltr">
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-current" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-current" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-current" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-current" />
          <span ref={coords} className="latin absolute -bottom-6 left-0 whitespace-pre text-[10px] tracking-[0.14em]">
            X 0000  Y 0000
          </span>
        </div>
      </div>
    </section>
  );
}
