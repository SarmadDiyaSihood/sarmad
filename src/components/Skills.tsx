import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clapperboard, Code, Layers, Megaphone, Palette, Plus, Search, Users, X, type LucideIcon } from 'lucide-react';
import { useMediaQuery } from '../lib/hooks';
import { sound } from '../lib/sound';
import { normalize, plural } from '../lib/text';
import { useLang } from '../context/LanguageContext';
import type { Remote, Skill, SkillGroup } from '../lib/api';
import { LATIN_FACE } from '../lib/person';
import { scene } from '../lib/features';
import { Reveal, SceneLabel } from './Reveal';

/** Each group has its own symbol and tile colour. The design and technical groups are picked out visually. */
interface Look {
  Icon: LucideIcon;
  tile: string;
  featured?: 'design' | 'tech';
}
const LOOKS: Record<string, Look> = {
  marketing: { Icon: Megaphone, tile: 'bg-electric text-white' },
  media: { Icon: Clapperboard, tile: 'bg-ice text-navy' },
  design: { Icon: Palette, tile: 'bg-white text-electric', featured: 'design' },
  tech: { Icon: Code, tile: 'border border-electric bg-navy text-ice', featured: 'tech' },
  management: { Icon: Users, tile: 'bg-white/10 text-white' },
};
const FALLBACK: Look = { Icon: Layers, tile: 'bg-white/10 text-white' };
const SHAPES = ['bg-electric', 'rounded-full bg-ice', 'rotate-45 border border-electric'];
const EASE = [0.16, 1, 0.3, 1] as const;
const two = (n: number) => String(n).padStart(2, '0');

function Cell({ skill, number, featured }: { skill: Skill; number: number; featured?: Look['featured'] }) {
  const { lang } = useLang();
  const arabic = lang === 'ar' && Boolean(skill.ar);
  const name = arabic ? skill.ar : skill.en || skill.ar;

  return (
    <li className="group/cell relative isolate flex min-h-[4.5rem] items-start gap-3 overflow-hidden border-b border-e border-white/10 px-4 py-4">
      <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-electric transition-transform duration-500 ease-cine group-hover/cell:scale-x-100 rtl:origin-right" />
      <span className="label latin mt-1 w-6 shrink-0 text-ice/70 transition-colors duration-300 group-hover/cell:text-white">{two(number)}</span>
      {featured === 'design' && (
        <span aria-hidden="true" className={`mt-[0.45rem] block h-2.5 w-2.5 shrink-0 transition-colors duration-300 group-hover/cell:border-white group-hover/cell:bg-white ${SHAPES[(number - 1) % SHAPES.length]}`} />
      )}
      {featured === 'tech' && (
        <span aria-hidden="true" dir="ltr" className="latin mt-0.5 shrink-0 text-sm text-electric transition-colors duration-300 group-hover/cell:text-white">
          &gt;_
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-medium leading-[1.4] text-white rtl:leading-[1.7]">{name}</span>
        {arabic && skill.latin && (
          <span lang="en" style={featured === 'tech' ? undefined : LATIN_FACE} className="latin mt-1 block text-[12.5px] leading-[1.5] tracking-[0.02em] text-ice/75 transition-colors duration-300 group-hover/cell:text-white rtl:text-right">
            {skill.latin}
          </span>
        )}
      </span>
    </li>
  );
}

/** SKILLS & COMPETENCIES MATRIX: five groups that open and close, with a search across every skill. */
export default function Skills({ skills }: { skills: Remote<SkillGroup[]> }) {
  const { t, lang } = useLang();
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 768px)');
  const c = t.skills;

  const [query, setQuery] = useState('');
  // null = the visitor has not opened or closed anything yet: every group is open on larger screens, the first one on phones.
  const [chosen, setChosen] = useState<string[] | null>(null);

  const groups = skills.data ?? [];
  const total = groups.reduce((sum, g) => sum + g.skills.length, 0);
  const open = chosen ?? (wide ? groups.map((g) => g.id) : groups.slice(0, 1).map((g) => g.id));
  const allOpen = groups.length > 0 && groups.every((g) => open.includes(g.id));

  // Search: every typed word must appear in the skill's Arabic name, English name or Latin term.
  const words = normalize(query).split(' ').filter(Boolean);
  const searching = words.length > 0;
  const matches = (skill: Skill) => {
    const haystack = normalize(`${skill.ar} ${skill.en} ${skill.latin}`);
    return words.every((word) => haystack.includes(word));
  };
  const visible = groups
    .map((group) => ({ group, items: group.skills.map((skill, i) => ({ skill, number: i + 1 })).filter((item) => !searching || matches(item.skill)) }))
    .filter((entry) => !searching || entry.items.length > 0);
  const found = visible.reduce((sum, entry) => sum + entry.items.length, 0);

  const toggle = (id: string) => {
    sound.play(open.includes(id) ? 'close' : 'open');
    setChosen(open.includes(id) ? open.filter((x) => x !== id) : [...open, id]);
  };

  return (
    <section id="skills" data-section className="grain relative overflow-hidden bg-navy-deep text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-[25%] top-[4%] h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(23,105,255,0.2),transparent)]"
      />

      <div className="relative z-10 mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-40">
        <SceneLabel n={scene(11)} label={c.label} className="text-ice/80" />
        <Reveal as="h2" text={c.heading} stagger={0.06} className="display-2 mt-10 max-w-[16ch] text-[clamp(1.5rem,5vw,5.5rem)]" />
        <Reveal text={c.desc} stagger={0.012} className="mt-6 max-w-[46ch] text-lg leading-relaxed text-white/80 md:text-xl rtl:leading-[1.9]" />

        {skills.loading ? (
          <div className="mt-16 space-y-4" role="status" aria-label={c.loading}>
            <div className="h-20 animate-pulse bg-white/10" />
            <div className="h-20 animate-pulse bg-white/10" />
            <div className="h-20 animate-pulse bg-white/10" />
            <p className="label text-white/60">{c.loading}…</p>
          </div>
        ) : skills.error ? (
          <div className="mt-16 flex flex-col items-start gap-6 border-t border-white/15 pt-10" role="alert">
            <p className="font-display text-2xl font-bold">{c.error}</p>
            <button type="button" onClick={skills.reload} className="btn label">
              {t.work.retry}
            </button>
          </div>
        ) : groups.length === 0 ? (
          <p className="mt-12 max-w-[44ch] border-s-2 border-electric ps-6 text-[clamp(1.2rem,1.9vw,1.7rem)] font-light leading-[1.5] text-white/85">{c.empty}</p>
        ) : (
          <>
            <div role="search" className="mt-12 flex flex-col gap-6 md:mt-16 md:flex-row md:items-end md:justify-between">
              <div className="w-full max-w-xl">
                <label htmlFor="skill-search" className="label text-white/70">
                  {c.searchLabel}
                </label>
                <div className="relative mt-2">
                  <Search size={18} strokeWidth={1.6} aria-hidden="true" className="pointer-events-none absolute start-0 top-1/2 -translate-y-1/2 text-electric" />
                  <input
                    id="skill-search"
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={c.searchPlaceholder}
                    className="block w-full border-b border-white/30 bg-transparent py-3 pe-12 ps-8 text-lg text-white outline-none transition-colors duration-300 placeholder:text-white/40 focus:border-electric"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label={c.clear} className="absolute end-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-white/70 hover:text-white">
                      <X size={18} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex min-h-11 flex-wrap items-center gap-x-8 gap-y-2">
                <p className="label text-ice/80" role="status">
                  {searching ? (
                    <>
                      <span className="latin">{found}</span> {plural(found, c.resultUnit, lang)}
                    </>
                  ) : (
                    <>
                      <span className="latin">{total}</span> {plural(total, c.skillUnit, lang)}
                      <span aria-hidden="true" className="mx-3 text-electric">
                        /
                      </span>
                      <span className="latin">{groups.length}</span> {plural(groups.length, c.groupUnit, lang)}
                    </>
                  )}
                </p>
                {!searching && (
                  <button type="button" data-sound={allOpen ? 'close' : 'open'} onClick={() => setChosen(allOpen ? [] : groups.map((g) => g.id))} className="label link-line min-h-11 text-white">
                    {allOpen ? c.collapseAll : c.expandAll}
                  </button>
                )}
              </div>
            </div>

            {searching && found === 0 ? (
              <div className="mt-12 flex flex-col items-start gap-6 border-t border-white/15 pt-10">
                <p className="text-[clamp(1.2rem,1.9vw,1.7rem)] font-light text-white/85">{c.noResults}</p>
                <button type="button" onClick={() => setQuery('')} className="btn label">
                  {c.clear}
                </button>
              </div>
            ) : (
              <ol className="mt-10 border-b border-white/15 md:mt-14">
                {visible.map(({ group, items }) => {
                  const look = LOOKS[group.id] ?? FALLBACK;
                  const isOpen = searching || open.includes(group.id);
                  const title = lang === 'ar' ? group.title_ar || group.title_en : group.title_en || group.title_ar;
                  const panelId = `skills-${group.id}`;
                  return (
                    <motion.li
                      key={group.id}
                      initial={{ opacity: 0, y: reduced ? 0 : 32 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                      transition={{ duration: 0.9, ease: EASE }}
                      className={`relative border-t border-white/15 ${look.featured ? 'bg-white/[0.04]' : ''}`}
                    >
                      {look.featured && <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-electric" />}

                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          disabled={searching}
                          onClick={() => toggle(group.id)}
                          className="group flex w-full items-center gap-4 px-4 py-6 text-start disabled:cursor-default md:gap-7 md:px-7 md:py-8"
                        >
                          <span className="label latin hidden w-7 shrink-0 text-ice/70 sm:block">{two(groups.indexOf(group) + 1)}</span>
                          <span className={`grid h-12 w-12 shrink-0 place-items-center md:h-16 md:w-16 ${look.tile}`}>
                            <look.Icon strokeWidth={1.3} className="h-6 w-6 md:h-8 md:w-8" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-[clamp(1.2rem,2.4vw,2.4rem)] font-extrabold leading-[1.2] tracking-[var(--track-display)] rtl:leading-[1.5]">{title}</span>
                            <span className="label mt-2 block text-ice/80">
                              <span className="latin">{items.length}</span> {plural(items.length, searching ? c.resultUnit : c.skillUnit, lang)}
                            </span>
                          </span>
                          {!searching && (
                            <span
                              aria-hidden="true"
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition duration-500 ease-cine group-hover:border-electric group-hover:bg-electric ${isOpen ? 'rotate-45 border-electric bg-electric' : 'border-white/35'}`}
                            >
                              <Plus size={18} strokeWidth={1.5} />
                            </span>
                          )}
                        </button>
                      </h3>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-7 md:px-7 md:pb-9">
                              <ul className="grid border-s border-t border-white/10 min-[520px]:grid-cols-2 lg:grid-cols-3 min-[1500px]:grid-cols-4">
                                {items.map(({ skill, number }) => (
                                  <Cell key={`${number}-${skill.en || skill.ar}`} skill={skill} number={number} featured={look.featured} />
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}
