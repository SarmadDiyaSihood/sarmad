import { useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useGsap } from '../lib/hooks';
import { scrollToId } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';
import { Reveal, SceneLabel } from './Reveal';
import ChapterMedia from './chapters/ChapterMedia';
import ChapterDesign from './chapters/ChapterDesign';
import ChapterMarketing from './chapters/ChapterMarketing';
import ChapterTech from './chapters/ChapterTech';
import type { Origin } from './chapters/shared';
import type { Project } from '../lib/api';

const CHAPTERS = [ChapterMedia, ChapterDesign, ChapterMarketing, ChapterTech];

interface Props {
  onExplore: (index: number, origin: Origin) => void;
  /** The film archive: the chapters' pictures are its entries, and open from here. */
  projects: Project[];
  /** Opens a picture in the viewer. `chapter` is the chapter it was opened from. */
  onOpenProject: (slug: string, rect: DOMRect, chapter: number) => void;
}

export default function Expertise({ onExplore, projects, onOpenProject }: Props) {
  const head = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  useGsap(head, () => {
    gsap.from('[data-toc]', {
      autoAlpha: 0,
      y: 20,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '[data-tocs]', start: 'top 88%', once: true },
    });
  });

  return (
    <section id="expertise" data-section data-nav="specialties">
      {/* Chapter menu */}
      <div ref={head} className="border-t border-navy/10 bg-white px-5 pb-24 pt-24 text-navy md:px-10 md:pb-32 md:pt-36">
        <SceneLabel n={7} label={t.expertise.label} className="text-navy/70" />
        <Reveal as="h2" text={t.expertise.heading} stagger={0.05} className="display-2 mt-10 max-w-[16ch] text-[clamp(2.4rem,6.4vw,7rem)]" />
        <ol data-tocs className="mt-14 grid border-t border-navy/15 md:mt-20 md:grid-cols-4">
          {t.chapters.map((c, i) => (
            <li data-toc key={c.title} className="border-b border-navy/15 md:border-b-0 md:border-e md:last:border-e-0">
              <button
                type="button"
                onClick={() => scrollToId(`chapter-${i + 1}`)}
                className={`flex w-full items-baseline gap-4 py-5 text-start md:flex-col md:gap-8 md:py-7 md:pe-5 ${i === 0 ? '' : 'md:ps-5'}`}
              >
                <span className="label latin text-electric">0{i + 1}</span>
                <span className="link-line font-display text-lg font-bold md:text-xl">{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {CHAPTERS.map((Chapter, i) => (
        <Chapter
          key={i}
          index={i}
          chapter={t.chapters[i]}
          onExplore={onExplore}
          pieces={projects}
          onOpenProject={(slug, rect) => onOpenProject(slug, rect, i)}
        />
      ))}
    </section>
  );
}
