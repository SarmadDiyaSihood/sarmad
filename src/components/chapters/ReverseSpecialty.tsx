import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useGsap } from '../../lib/hooks';
import { useLang } from '../../context/LanguageContext';
import { LATIN_FACE } from '../../lib/person';
import { Reveal } from '../Reveal';

// An ordinary x86 function as a disassembler lists it: address, machine code, instruction. Illustration only.
const LISTING: Array<[address: string, bytes: string, mnemonic: string, operands: string]> = [
  ['00401000', '55', 'push', 'ebp'],
  ['00401001', '8B EC', 'mov', 'ebp, esp'],
  ['00401003', '83 EC 10', 'sub', 'esp, 0x10'],
  ['00401006', 'E8 15 00 00 00', 'call', '0x401020'],
  ['0040100B', '85 C0', 'test', 'eax, eax'],
  ['0040100D', '74 05', 'jz', '0x401014'],
  ['0040100F', '33 C0', 'xor', 'eax, eax'],
  ['00401011', 'C9', 'leave', ''],
  ['00401012', 'C3', 'ret', ''],
];

/** Software Reverse Engineering: a specialty inside the Technology & Development chapter. */
export default function ReverseSpecialty() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const r = t.reverse;

  useGsap(root, (s) => {
    const once = (trigger: string, start = 'top 82%') => ({ trigger, start, once: true });
    gsap.from('[data-re-rule]', { scaleX: 0, transformOrigin: s === 1 ? '0% 50%' : '100% 50%', duration: 1.5, ease: 'expo.inOut', scrollTrigger: once('[data-re-rule]', 'top 90%') });
    gsap.from('[data-re-row]', { autoAlpha: 0, y: 26, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: once('[data-re-text]') });
    gsap.from('[data-re-panel]', { autoAlpha: 0, y: 50, duration: 1.3, ease: 'expo.out', scrollTrigger: once('[data-re-panel]', 'top 85%') });
    gsap.from('[data-re-line]', { autoAlpha: 0, x: -14, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.4, scrollTrigger: once('[data-re-panel]', 'top 85%') });
    // The reading bar steps down the listing one instruction at a time, as a debugger does.
    gsap.to('[data-re-scan]', { yPercent: (LISTING.length - 1) * 100, duration: LISTING.length * 0.8, ease: `steps(${LISTING.length - 1})`, repeat: -1, repeatDelay: 1.2, delay: 1.6 });
    gsap.from('[data-re-cell]', { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: once('[data-re-cells]', 'top 88%') });
  });

  return (
    <div ref={root} className="relative z-10 mt-20 md:mt-32">
      <span data-re-rule aria-hidden="true" className="block h-px bg-white/20" />

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-center">
        <div data-re-text className="md:col-span-5">
          <p data-re-row className="label text-electric">
            {r.label}
          </p>
          <h4 data-re-row lang="en" dir="ltr" style={LATIN_FACE} className="latin mt-5 text-[clamp(1.75rem,3.1vw,3.25rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] rtl:text-right">
            Software <span className="text-electric">Reverse</span> Engineering
          </h4>
          {r.title && (
            <p data-re-row className="mt-4 font-display text-[clamp(1.2rem,1.7vw,1.6rem)] font-bold leading-[1.5]">
              {r.title}
            </p>
          )}
          <Reveal text={r.desc} stagger={0.01} className="mt-6 max-w-[52ch] text-[1.0625rem] leading-[1.75] text-white/80 md:text-lg rtl:leading-[2]" />
        </div>

        {/* A disassembly listing, drawn in type. */}
        <figure className="min-w-0 md:col-span-6 md:col-start-7" aria-hidden="true">
          <div data-re-panel dir="ltr" className="overflow-hidden rounded-xl border border-white/15 bg-navy shadow-[0_40px_90px_-30px_rgba(23,105,255,0.45)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="flex gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <i className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <i className="h-2.5 w-2.5 rounded-full bg-electric" />
              </span>
              <span className="latin text-[11px] tracking-[0.08em] text-white/60">disassembly</span>
              <span className="latin ms-auto text-[11px] tracking-[0.08em] text-white/40">x86</span>
            </div>
            <div className="latin relative px-4 py-4 text-[11.5px] leading-[1.9] md:px-6 md:py-5 md:text-[13px]">
              <span data-re-scan className="absolute inset-x-0 block h-[1.9em] border-s-2 border-electric bg-electric/15" />
              {LISTING.map(([address, bytes, mnemonic, operands]) => (
                <div data-re-line key={address} className="relative flex gap-4 whitespace-nowrap md:gap-6">
                  <span className="text-white/35">{address}</span>
                  <span className="hidden w-[13ch] text-ice/60 min-[440px]:block">{bytes}</span>
                  <span className="w-[5ch] text-electric">{mnemonic}</span>
                  <span className="text-white/85">{operands}</span>
                </div>
              ))}
            </div>
          </div>
          <figcaption className="label mt-3 text-white/55">{r.listingNote}</figcaption>
        </figure>
      </div>

      {/* The seven skills, set like the cells of the skills matrix. */}
      <div data-re-cells className="mt-12 grid border-s border-t border-white/10 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
        <div data-re-cell className="flex min-h-[7.5rem] items-end justify-between gap-5 border-b border-e border-electric bg-electric p-5 md:p-6">
          <p className="label">{r.skillsLabel}</p>
          <span aria-hidden="true" style={LATIN_FACE} className="text-[4.5rem] font-extrabold leading-[0.8] [font-stretch:62%]">
            {String(r.skills.length).padStart(2, '0')}
          </span>
        </div>
        <ol className="contents">
          {r.skills.map((skill, i) => (
            <li data-re-cell key={skill.name} className="group relative isolate flex min-h-[7.5rem] flex-col justify-between gap-5 overflow-hidden border-b border-e border-white/10 p-5 md:p-6">
              <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-electric transition-transform duration-500 ease-cine group-hover:scale-x-100 rtl:origin-right" />
              <span className="flex items-center gap-3">
                <span className="label latin text-ice/70 transition-colors duration-300 group-hover:text-white">0{i + 1}</span>
                <span aria-hidden="true" dir="ltr" className="latin text-sm text-electric transition-colors duration-300 group-hover:text-white">
                  &gt;_
                </span>
              </span>
              <span>
                <span className="block font-display text-lg font-bold leading-[1.3] rtl:leading-[1.6]">{skill.name}</span>
                {skill.latin && (
                  <span lang="en" className="latin mt-1 block text-[12.5px] tracking-[0.02em] text-ice/75 transition-colors duration-300 group-hover:text-white rtl:text-right">
                    {skill.latin}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
