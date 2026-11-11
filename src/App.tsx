import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from './lib/gsap';
import { initScroll, scrollSpeed, scrollToId, scrollToY } from './lib/scroll';
import { SHOW_EXPERIENCE, SHOW_PROJECT_PAGES } from './lib/features';
import { useRemote, type Certification, type Channel, type Experience as ExperienceItem, type Project, type SkillGroup } from './lib/api';
import { useLang, type Lang } from './context/LanguageContext';
import { sound } from './lib/sound';
import SoundDock from './components/SoundDock';
import Intro from './components/Intro';
import Nav, { type SectionId } from './components/Nav';
import Cursor from './components/Cursor';
import Hero from './components/Hero';
import About from './components/About';
import Story from './components/Story';
import Identity from './components/Identity';
import Stats from './components/Stats';
import Profile from './components/Profile';
import Specialties from './components/Specialties';
import Services from './components/Services';
import Experience from './components/Experience';
import Certifications from './components/Certifications';
import Skills from './components/Skills';
import Expertise from './components/Expertise';
import Work from './components/Work';
import Process from './components/Process';
import Contact from './components/Contact';
import ChapterDetail from './components/ChapterDetail';
import ProjectOverlay from './components/ProjectOverlay';
import PieceViewer from './components/PieceViewer';
import { BLENDER_PICTURE, CHAPTER_KEYS, titleOf, type Origin } from './components/chapters/shared';

const Studio = lazy(() => import('./pages/Studio'));
const LANG_NAMES: Record<Lang, string> = { en: 'English', ar: 'العربية' };
const TITLES: Record<Lang, string> = {
  en: 'Sarmad Diya Sihood — Media, Digital Marketing & Creative Technology',
  ar: 'سرمد ضياء صيهود — إعلام، تسويق رقمي وتقنية إبداعية',
};

// The scroll cue sounds this long (ms) after a section is entered, unless the page is still scrolling faster than this (px per second).
const CUE_WAIT = 280;
const CUE_MAX_SPEED = 1500;
/** Where a picture was opened from: a chapter (its index), the film archive, or a link straight to the picture. */
type From = number | 'archive' | 'link';
/** The picture named in the address (#project/<slug>; earlier links to the design pieces used #design/<slug>), if any. */
const projectInAddress = () => window.location.hash.match(/^#(?:project|design)\/([a-z0-9-]+)$/)?.[1] ?? null;
/** Where a project page opens from when it was not opened by clicking a frame (Back / Forward, a shared link). */
const centreRect = () => new DOMRect(window.innerWidth * 0.2, window.innerHeight * 0.2, window.innerWidth * 0.6, window.innerHeight * 0.6);

function Site() {
  const { lang, setLang, t } = useLang();
  const reduced = useReducedMotion() ?? false;

  const [started, setStarted] = useState(false);
  const [introMounted, setIntroMounted] = useState(true);
  const [active, setActive] = useState<SectionId>('home');
  const [chapter, setChapter] = useState<{ index: number; origin: Origin; depth: number } | null>(null);
  const [chapterNav, setChapterNav] = useState(false);
  // The picture open in the viewer.
  const [project, setProject] = useState<{ slug: string; rect: DOMRect; from: From } | null>(null);
  // True when the viewer should slide away instead of folding back into the frame it opened from
  // (another picture is now on screen, or the page behind has moved to the archive).
  const [wipe, setWipe] = useState(false);
  const [curtain, setCurtain] = useState<Lang | null>(null);
  // True between asking the browser to step back and the page actually closing (guards a double close).
  const leaving = useRef(false);
  // Whether a picture is open in the viewer, for code that runs outside React's rendering (browser Back).
  const viewer = useRef(false);
  viewer.current = Boolean(project);
  const linked = useRef(false);
  const restore = useRef<{ id: string; ratio: number } | null>(null);
  // The section actually on screen (several sections can share one navigation item).
  const here = useRef('home');
  // The section or chapter last passed while scrolling (for the scroll cue).
  const cue = useRef('home');
  const cueTimer = useRef(0);

  const projects = useRemote<Project[]>('/api/projects');
  const channels = useRemote<Channel[]>('/api/contact-channels');
  const experiences = useRemote<ExperienceItem[]>(SHOW_EXPERIENCE ? '/api/experiences' : '');
  const certifications = useRemote<Certification[]>('/api/certifications');
  const skills = useRemote<SkillGroup[]>('/api/skills');
  // A certificate's details panel is open (it lives outside <main>, which goes inert behind it).
  const [panelOpen, setPanelOpen] = useState(false);
  const list = projects.data ?? [];

  useEffect(() => initScroll(reduced), [reduced]);

  useEffect(() => {
    // Through ScrollTrigger, which otherwise switches the browser's own scroll restoration back on after every refresh.
    ScrollTrigger.clearScrollMemory('manual');
    window.scrollTo(0, 0);
    // Warm the Arabic faces so the language switch does not flash a fallback font.
    void document.fonts?.load('800 1em Alexandria', 'س');
    void document.fonts?.load('400 1em "IBM Plex Sans Arabic"', 'س');
  }, []);

  useEffect(() => {
    document.title = TITLES[lang];
  }, [lang]);

  // Active section = the one crossing the middle of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          // Arriving in a new section or chapter: a very faint cue. It waits a moment and then sounds only if the
          // page is no longer racing past, so a fast scroll through several sections stays quiet. (The engine also
          // keeps cues apart and silences them while the page moves by itself.)
          if (el.id !== cue.current) {
            window.clearTimeout(cueTimer.current);
            cueTimer.current = window.setTimeout(() => {
              if (scrollSpeed() < CUE_MAX_SPEED) sound.play('section');
            }, CUE_WAIT);
          }
          cue.current = el.id;
          if (!el.hasAttribute('data-section')) return;
          here.current = el.id;
          setActive((el.dataset.nav || el.id) as SectionId);
        }),
      { rootMargin: '-50% 0px -50% 0px' },
    );
    document.querySelectorAll('[data-section], #expertise > article').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  // Recalculate scroll-driven animation whenever the page height changes (fonts, data, language, form).
  useEffect(() => {
    let last = document.body.scrollHeight;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(document.body.scrollHeight - last) > 2) {
          ScrollTrigger.refresh();
          last = document.body.scrollHeight;
        }
      }, 250);
    });
    ro.observe(document.body);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // Language switch: curtain in → swap language and direction → restore reading position → curtain out.
  const switchLang = (next: Lang) => {
    if (next === lang || curtain) return;
    const el = document.getElementById(here.current);
    const ratio = el ? Math.min(0.98, Math.max(0, (window.scrollY - (el.getBoundingClientRect().top + window.scrollY)) / el.offsetHeight)) : 0;
    restore.current = { id: here.current, ratio };
    sound.play('transition');
    setCurtain(next);
    window.setTimeout(() => setLang(next), reduced ? 0 : 650);
  };

  useEffect(() => {
    if (!restore.current) return;
    const timer = window.setTimeout(() => {
      const target = restore.current;
      restore.current = null;
      ScrollTrigger.refresh();
      const el = target && document.getElementById(target.id);
      if (el && target) scrollToY(el.getBoundingClientRect().top + window.scrollY + target.ratio * el.offsetHeight);
      ScrollTrigger.update();
      window.setTimeout(() => setCurtain(null), 150);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [lang]);

  const openChapter = (index: number, origin: Origin) => {
    sound.play('transition');
    setChapterNav(false);
    setChapter({ index, origin, depth: 0 });
  };
  const nextChapter = (index: number) => {
    sound.play('transition');
    setChapterNav(true);
    setChapter((c) => ({ index, origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, depth: Math.min((c?.depth ?? 0) + 1, 20) }));
  };
  const closeChapter = () => {
    if (chapter) sound.play('close');
    setChapterNav(false);
    setChapter(null);
  };
  const openProject = (slug: string, rect: DOMRect, from: From = 'archive') => {
    sound.play('open');
    setWipe(false);
    setProject({ slug, rect, from });
    window.history.pushState({ project: slug, from }, '', `#project/${slug}`);
    // The new history entry must not restore an old scroll position when the visitor steps back.
    window.history.scrollRestoration = 'manual';
  };
  // Stepping to another picture stays on the same page of history: only the address changes.
  const showProject = (slug: string) => {
    sound.play('step');
    setWipe(true);
    setProject((p) => (p ? { ...p, slug } : p));
    window.history.replaceState(window.history.state?.project ? { ...window.history.state, project: slug } : null, '', `#project/${slug}`);
  };
  const closeProject = () => {
    if (leaving.current) return;
    sound.play('close');
    if (window.history.state?.project) {
      // Opened from this page: step back in history, and the listener below closes the page.
      leaving.current = true;
      window.history.back();
    } else {
      // Opened from a shared link: there is nothing to step back to, so just clear the address.
      if (projectInAddress()) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setProject(null);
    }
  };
  // The back button returns to where the picture was opened: its chapter, or the archive.
  const backFromPicture = () => {
    // Opened from a link straight to the picture: there is no section to go back to, so bring the archive into view.
    const box = document.getElementById('work')?.getBoundingClientRect();
    const jump = project?.from === 'link' && Boolean(box && (box.bottom < window.innerHeight * 0.4 || box.top > window.innerHeight * 0.6));
    if (jump) setWipe(true);
    closeProject();
    if (jump) scrollToId('work', true);
  };

  // Browser Back / Forward: keep the viewer in step with the address.
  useEffect(() => {
    const sync = () => {
      leaving.current = false;
      window.history.scrollRestoration = 'manual';
      const slug = projectInAddress();
      if (!slug && viewer.current) sound.play('close');
      const from: From = window.history.state?.from ?? 'link';
      setProject((p) => (slug ? (p?.slug === slug ? p : { slug, rect: centreRect(), from }) : null));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  // A link straight to a picture opens it once the visitor has entered the site.
  useEffect(() => {
    if (linked.current || !started || !list.length) return;
    linked.current = true;
    const slug = projectInAddress();
    if (slug) setProject({ slug, rect: centreRect(), from: 'link' });
  }, [started, list.length]);

  const currentIndex = project ? list.findIndex((p) => p.slug === project.slug) : -1;
  const current = currentIndex >= 0 ? list[currentIndex] : null;
  // The Blender illustration is the one chapter picture that is not an archive entry.
  const blenderOpen = project?.slug === BLENDER_PICTURE.slug;
  const viewing = Boolean(current) || blenderOpen;
  // The arrows in the viewer step through the archive, in its order, and wrap round at the ends.
  const step = (by: number) => showProject(list[(currentIndex + by + list.length) % list.length].slug);
  // "Next reel" steps through the full project pages; single pictures are opened from their own cards.
  const reels = list.filter((p) => p.view !== 'image');
  const nextProject = current && reels.length > 1 ? reels[(reels.indexOf(current) + 1) % reels.length] : null;
  // A picture is filed under its specialty: the chapter name where there is one, the archive category otherwise.
  const chapterOf = current ? (CHAPTER_KEYS as readonly string[]).indexOf(current.category_key) : -1;
  const overlayOpen = Boolean(chapter || viewing || panelOpen);

  return (
    <>
      <Cursor />
      <SoundDock />
      <Nav active={active} visible={started && !overlayOpen} onNavigate={(id) => scrollToId(id)} onSwitchLang={switchLang} />

      <main id="main" key={lang} tabIndex={-1} inert={overlayOpen || !started} className="outline-none">
        <Hero started={started} />
        <Identity channels={channels} />
        <About />
        <Stats />
        <Profile channels={channels} />
        <Story />
        <Specialties />
        <Expertise onExplore={openChapter} projects={list} onOpenProject={openProject} />
        <Services />
        {SHOW_EXPERIENCE && <Experience experiences={experiences} />}
        <Certifications certifications={certifications} onPanel={setPanelOpen} />
        <Skills skills={skills} />
        <Work projects={projects} onOpen={openProject} />
        <Process />
        <Contact channels={channels} />
      </main>

      <AnimatePresence custom={chapterNav}>
        {chapter && (
          <div key={`${chapter.index}-${chapter.depth}`} className="relative" style={{ zIndex: 70 + chapter.depth }}>
            <ChapterDetail
              index={chapter.index}
              origin={chapter.origin}
              projects={list}
              inert={viewing}
              onClose={closeChapter}
              onNavigate={nextChapter}
              onOpenProject={(slug, rect) => openProject(slug, rect, chapter.index)}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence custom={wipe}>
        {project && current && SHOW_PROJECT_PAGES && current.view !== 'image' ? (
          <ProjectOverlay
            key="project"
            project={current}
            number={currentIndex + 1}
            next={nextProject}
            rect={project.rect}
            onClose={closeProject}
            onBack={backFromPicture}
            onNavigate={showProject}
          />
        ) : project && viewing ? (
          <PieceViewer
            key="picture"
            src={current ? current.cover_image : BLENDER_PICTURE.src}
            alt={current ? ((lang === 'ar' ? current.cover_alt_ar : current.cover_alt_en) ?? '') : t.blender.alt}
            title={current ? titleOf(current, lang) : t.blender.name}
            category={current ? (chapterOf >= 0 ? t.chapters[chapterOf].title : t.work.categories[current.category_key]) : `${t.chapters[1].title} · ${t.blender.imageNote}`}
            categoryLabel={t.work.category}
            ratio={current ? (current.cover_ratio ?? '16 / 9') : `${BLENDER_PICTURE.width} / ${BLENDER_PICTURE.height}`}
            backLabel={typeof project.from === 'number' ? `${t.work.backTo} ${t.chapters[project.from].title}` : t.work.backFilm}
            backShort={t.work.backWord}
            prevLabel={t.work.prevPicture}
            nextLabel={t.work.nextPicture}
            onPrev={current && list.length > 1 ? () => step(-1) : undefined}
            onNext={current && list.length > 1 ? () => step(1) : undefined}
            rect={project.rect}
            onClose={closeProject}
            onBack={backFromPicture}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {curtain && (
          <motion.div
            key="curtain"
            aria-hidden="true"
            className="fixed inset-0 z-[150] grid place-items-center bg-electric text-white"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: '0%' }}
            exit={reduced ? { opacity: 0 } : { y: '-100%' }}
            transition={{ duration: reduced ? 0.15 : 0.6, ease: [0.87, 0, 0.13, 1] }}
          >
            <span className="text-[clamp(3rem,14vw,12rem)] font-extrabold leading-none" style={{ fontFamily: curtain === 'ar' ? 'Alexandria, sans-serif' : 'Archivo, sans-serif', fontStretch: '125%' }}>
              {LANG_NAMES[curtain]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {introMounted && <Intro onReveal={() => setStarted(true)} onDone={() => setIntroMounted(false)} />}
    </>
  );
}

export default function App() {
  const [studio, setStudio] = useState(() => window.location.hash === '#studio');

  useEffect(() => {
    const onHash = () => setStudio(window.location.hash === '#studio');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (studio) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-navy text-white/60">Loading…</div>}>
        <Studio />
      </Suspense>
    );
  }
  return <Site />;
}
