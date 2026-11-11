import { useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { useLang } from '../context/LanguageContext';
import { Reveal, SceneLabel, Split, Timecode } from './Reveal';

// Shown as typographic wordmarks in the site's own typeface (no logos, no certificate titles or dates).
const CERTS = ['Cisco', 'IBM', 'Google'];
const ARCHIVO = { fontFamily: 'Archivo, sans-serif' } as const;
const WORDMARK = { fontFamily: 'Archivo, sans-serif', fontStretch: '125%' } as const;

/** One small line drawing per highlight: film frame, rising line, shapes, connected nodes. */
function Glyph({ i }: { i: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`h-14 w-14 shrink-0 text-navy transition-transform duration-700 ease-cine group-hover:-translate-y-1.5 ${i === 1 ? 'rtl:-scale-x-100' : ''}`}
    >
      {i === 0 && (
        <>
          <rect x="6" y="14" width="52" height="36" />
          <path d="M6 22h52M6 42h52M16 14v8M26 14v8M38 14v8M48 14v8M16 42v8M26 42v8M38 42v8M48 42v8" />
          <path d="M28 27.5l9 4.5-9 4.5z" className="text-electric" fill="currentColor" />
        </>
      )}
      {i === 1 && (
        <>
          <path d="M8 54h48M8 54V10" />
          <path d="M8 46l14-9 10 5 12-17 12-11" className="text-electric" strokeWidth="2" />
          <circle cx="56" cy="14" r="3.5" className="text-electric" fill="currentColor" stroke="none" />
        </>
      )}
      {i === 2 && (
        <>
          <circle cx="24" cy="24" r="15" />
          <rect x="30" y="30" width="24" height="24" className="text-electric" fill="currentColor" stroke="none" />
          <path d="M10 56l12-21 12 21z" />
        </>
      )}
      {i === 3 && (
        <>
          <path d="M32 16L14 48h36z" />
          <circle cx="32" cy="16" r="6" fill="#fff" />
          <circle cx="14" cy="48" r="6" fill="#fff" />
          <circle cx="50" cy="48" r="6" className="text-electric" fill="currentColor" stroke="none" />
          <rect x="28" y="34" width="8" height="8" className="text-electric" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

/** THE PROFESSIONAL STORY: profile, journey highlights, education and certifications, closing statement. */
export default function Story() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();
  const c = t.story;

  useGsap(root, (s) => {
    const once = (trigger: string, start = 'top 85%') => ({ trigger, start, once: true });
    const scrub = (trigger: string) => ({ trigger, start: 'top bottom', end: 'bottom top', scrub: true });

    // A — title, cinematic background, portrait
    gsap.from('[data-title] .rv-line', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: once('[data-title]', 'top 88%') });
    gsap.fromTo('[data-deco]', { xPercent: 8 * s }, { xPercent: -18 * s, ease: 'none', scrollTrigger: scrub('[data-intro]') });
    gsap.fromTo('[data-glow]', { yPercent: -14 }, { yPercent: 30, ease: 'none', scrollTrigger: scrub('[data-intro]') });
    gsap.fromTo('[data-portrait]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: once('[data-portrait]') });
    gsap.fromTo('[data-portrait-img]', { scale: 1.24 }, { scale: 1.04, ease: 'none', scrollTrigger: scrub('[data-split]') });
    gsap.from('[data-overview]', { autoAlpha: 0, x: -18 * s, duration: 1, ease: 'expo.out', delay: 0.25, scrollTrigger: once('[data-overview]', 'top 90%') });
    gsap.from('[data-quote]', { autoAlpha: 0, x: -24 * s, duration: 1.2, ease: 'expo.out', scrollTrigger: once('[data-quote]', 'top 88%') });

    // B — the journey: the line draws, then each highlight arrives in order
    gsap.from('[data-track-line]', { scaleX: 0, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', duration: 1.8, ease: 'expo.inOut', scrollTrigger: once('[data-track]', 'top 80%') });
    gsap.from('[data-hl]', { autoAlpha: 0, y: 44, duration: 1.1, ease: 'expo.out', stagger: 0.14, scrollTrigger: once('[data-track]', 'top 80%') });

    // C — education and certifications
    gsap.from('[data-edu]', { autoAlpha: 0, y: 36, duration: 1.1, ease: 'expo.out', scrollTrigger: once('[data-edu]') });
    gsap.from('[data-cert] .rv-inner', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: once('[data-certs]') });

    // D — closing statement
    gsap.from('[data-closing] .rv-inner', { yPercent: 118, duration: 1.25, ease: 'expo.out', stagger: 0.07, scrollTrigger: once('[data-closing]', 'top 78%') });
    gsap.fromTo('[data-closing-glow]', { yPercent: 12 }, { yPercent: -18, ease: 'none', scrollTrigger: scrub('[data-outro]') });
  });

  return (
    <section ref={root} id="story" data-section className="relative">
      {/* A — who I am */}
      <div data-intro className="grain relative bg-navy text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div data-glow className="absolute -end-[12%] -top-[12%] h-[72vw] w-[72vw] rounded-full bg-[radial-gradient(closest-side,rgba(23,105,255,0.30),transparent)]" />
          <div className="absolute inset-0 grid grid-cols-4 px-5 md:px-10">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="border-s border-white/[0.05] last:border-e" />
            ))}
          </div>
          <div data-deco className="display absolute bottom-[1%] start-0 select-none whitespace-nowrap text-[26vw] text-white/[0.035]">
            {c.deco}
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1680px] px-5 py-28 md:px-10 md:py-44">
          <SceneLabel n={5} label={c.label} className="text-ice/80" />

          <h2 data-title className="display-2 mt-10 text-[clamp(1.5rem,10.5vw,3rem)] md:text-[clamp(3rem,7.8vw,9rem)]" aria-label={c.title.join(' ')}>
            {c.title.map((line, i) => (
              <span key={line} aria-hidden="true" className={`rv-mask block ${i === 1 ? 'ms-[8vw] text-electric' : ''}`}>
                <span className="rv-line block">{line}</span>
              </span>
            ))}
          </h2>

          <div data-split className="mt-16 grid gap-14 md:mt-28 md:grid-cols-12 md:gap-10">
            {/* Dedicated portrait area */}
            <figure className="md:sticky md:top-28 md:col-span-5 md:self-start">
              <div data-portrait className="relative aspect-[4/5] w-full overflow-hidden bg-navy-deep md:max-h-[calc(100svh-11rem)]">
                <div data-portrait-img className="absolute inset-0">
                  <img src="/images/sarmad-portrait.jpg" alt={t.fullName} width={1599} height={1504} loading="lazy" decoding="async" className="h-full w-full object-cover object-[45%_50%]" />
                </div>
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent via-35% to-transparent" />
                <span aria-hidden="true" className="absolute start-4 top-4 h-5 w-5 border-s border-t border-electric" />
                <span aria-hidden="true" className="absolute end-4 top-4 h-5 w-5 border-e border-t border-electric" />
                <span aria-hidden="true" className="absolute bottom-4 start-4 h-5 w-5 border-b border-s border-electric" />
                <span aria-hidden="true" className="absolute bottom-4 end-4 h-5 w-5 border-b border-e border-electric" />
                <div aria-hidden="true" dir="ltr" className="label latin absolute inset-x-9 top-7 flex justify-between text-navy/75">
                  <span className="flex items-center gap-2">
                    <span className="rec-dot" /> PORTRAIT
                  </span>
                  <Timecode />
                </div>
              </div>
              <figcaption className="label mt-4 flex justify-between gap-4 text-white/60">
                <span>{t.about.caption}</span>
                <span className="latin">4 : 5</span>
              </figcaption>
            </figure>

            {/* The professional summary, complete */}
            <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">
              <Reveal as="h3" text={c.question} stagger={0.06} className="display-2 text-[clamp(1.9rem,4.4vw,4.75rem)]" />
              <p data-overview className="mt-6 flex items-center gap-4 text-[clamp(1.05rem,1.5vw,1.4rem)] text-ice">
                <span aria-hidden="true" className="h-px w-10 shrink-0 bg-electric" />
                {c.overview}
              </p>

              <Reveal text={c.lead} stagger={0.012} className="mt-12 text-[clamp(1.3rem,2vw,1.9rem)] font-light leading-[1.45] text-white md:mt-16 rtl:leading-[1.75]" />

              <div className="mt-9 max-w-[60ch] space-y-6 text-[1.0625rem] leading-[1.8] text-white/75 md:text-lg rtl:leading-[2]">
                {c.paragraphs.map((p, i) => (
                  <Reveal key={i} text={p} stagger={0.006} />
                ))}
              </div>

              <div data-quote className="mt-12 border-s-2 border-electric ps-6 md:ps-8">
                <Reveal text={c.edge} stagger={0.01} className="max-w-[46ch] text-[clamp(1.15rem,1.6vw,1.5rem)] font-medium leading-[1.55] text-white rtl:leading-[1.85]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B — the journey in four highlights */}
      <div className="bg-white px-5 py-24 text-navy md:px-10 md:py-36">
        <div className="mx-auto max-w-[1680px]">
          <p className="label text-navy/60">{c.journeyLabel}</p>
          <Reveal as="h3" text={c.journeyHeading} stagger={0.06} className="display-2 mt-6 text-[clamp(1.9rem,5.4vw,6rem)]" />

          <div data-track className="relative mt-14 md:mt-20">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-px bg-navy/15 lg:block">
              <span data-track-line className="block h-full bg-electric" />
            </div>
            <ol className="grid md:grid-cols-2 md:gap-x-10 lg:grid-cols-4 lg:gap-x-0">
              {c.highlights.map((h, i) => (
                <li data-hl key={h.title} className={`group relative border-t border-navy/15 py-9 lg:border-t-0 lg:pb-6 lg:pe-6 lg:pt-12 ${i ? 'lg:border-s lg:ps-6' : ''}`}>
                  <span aria-hidden="true" className="absolute -top-[4px] start-0 hidden h-[9px] w-[9px] rounded-full bg-electric lg:block" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="display-film text-[clamp(4.5rem,7vw,7.5rem)] leading-none text-electric" style={ARCHIVO}>
                      0{i + 1}
                    </span>
                    <Glyph i={i} />
                  </div>
                  {h.latin && <p className="label latin mt-8 text-navy/60 rtl:text-right">{h.latin}</p>}
                  <h4 className={`display-2 text-[clamp(1.35rem,2.1vw,2.2rem)] ${h.latin ? 'mt-3' : 'mt-8'}`}>{h.title}</h4>
                  <p className="mt-4 max-w-[34ch] leading-relaxed text-navy/75 rtl:leading-[1.9]">{h.desc}</p>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-electric transition-transform duration-700 ease-cine group-hover:scale-x-100 rtl:origin-right" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* C — education and professional certifications */}
      <div className="bg-ice px-5 py-24 text-navy md:px-10 md:py-36">
        <div className="mx-auto max-w-[1680px]">
          <p className="label text-navy/70">{c.edu.label}</p>
          <Reveal as="h3" text={c.edu.heading} stagger={0.05} className="display-2 mt-6 max-w-[16ch] text-[clamp(1.7rem,5.4vw,6rem)]" />

          <div className="mt-14 grid gap-14 md:mt-20 md:grid-cols-12 md:gap-10">
            <div data-edu className="relative self-start border border-navy/20 p-7 md:col-span-5 md:p-10">
              <span aria-hidden="true" className="absolute -start-px -top-px h-6 w-6 border-s-2 border-t-2 border-electric" />
              <span aria-hidden="true" className="absolute -bottom-px -end-px h-6 w-6 border-b-2 border-e-2 border-electric" />
              <p className="label text-navy/70">{c.edu.educationLabel}</p>
              <p className="mt-6 font-display text-[clamp(1.6rem,2.7vw,2.75rem)] font-extrabold leading-[1.2] rtl:leading-[1.5]">{c.edu.degree}</p>
              <p className="mt-4 text-xl text-navy/75">{c.edu.university}</p>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <p className="label text-navy/70">{c.edu.certLabel}</p>
              <ul data-certs className="mt-6 border-t border-navy/20">
                {CERTS.map((name, i) => (
                  <li data-cert key={name} className="group flex items-baseline justify-between gap-6 border-b border-navy/20 py-5 md:py-7">
                    <span className="rv-mask">
                      <span
                        className="rv-inner latin text-[clamp(2.5rem,6.5vw,7rem)] font-extrabold leading-[1.1] tracking-[-0.04em] transition-colors duration-500 group-hover:text-electric"
                        style={WORDMARK}
                      >
                        {name}
                      </span>
                    </span>
                    <span className="label latin text-navy/70">0{i + 1}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-[48ch] text-navy/75">{c.edu.certNote}</p>
            </div>
          </div>
        </div>
      </div>

      {/* D — closing statement */}
      <div data-outro className="grain relative overflow-hidden bg-navy-deep px-5 py-28 text-white md:px-10 md:py-48">
        <div
          data-closing-glow
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-[55%] mx-auto h-[80vw] w-[80vw] rounded-full bg-[radial-gradient(closest-side,rgba(23,105,255,0.30),transparent)]"
        />
        <div className="relative z-10 mx-auto max-w-[1680px]">
          <p className="sr-only">{c.closing.join(' ')}</p>
          <p data-closing data-sound-reveal="closing" aria-hidden="true" className="display text-[clamp(1.75rem,6.4vw,7.5rem)]">
            {c.closing.map((line, i) => (
              <span key={line} className={`block ${i === 1 ? 'mt-[0.2em] text-electric' : ''}`}>
                <Split text={line} />
              </span>
            ))}
          </p>
          <p className="label mt-10 flex items-center gap-4 text-ice/70 md:mt-14">
            <span aria-hidden="true" className="h-px w-10 bg-current opacity-50" />
            {t.fullName}
          </p>
        </div>
      </div>
    </section>
  );
}
