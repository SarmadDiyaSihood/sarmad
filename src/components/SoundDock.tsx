import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { sound, type Sfx } from '../lib/sound';
import { scrollSpeed } from '../lib/scroll';
import { useLang } from '../context/LanguageContext';

// What counts as an interactive element for the hover tick, and for the click sound.
const HOVERABLE = 'a[href], button:not(:disabled), [role="tab"], summary';
const CLICKABLE = `${HOVERABLE}, input[type="checkbox"], input[type="radio"], select`;

/**
 * The sound an element makes when clicked.
 * data-sound="open" (or any other sound name) on the element or an ancestor chooses it; data-sound="none" keeps it silent.
 */
function soundFor(element: Element): Sfx | null {
  const chosen = element.closest('[data-sound]')?.getAttribute('data-sound');
  if (chosen) return chosen === 'none' ? null : (chosen as Sfx);
  if (element.matches('a[href^="mailto:"], a[href^="tel:"], a[target="_blank"]')) return 'link';
  return 'click';
}

/** Connects the page to the sound engine: first-gesture start, hover and click sounds, scroll edges, tab visibility. */
function useSoundSystem(lang: string) {
  useEffect(() => {
    sound.attach();

    // Browsers allow sound only after a click, tap or key press. Every such gesture also wakes sound the browser has paused.
    const onGesture = () => sound.unlock();

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest?.(CLICKABLE);
      const name = element && soundFor(element);
      if (!name) return;
      const at = performance.now();
      // The code handling this click may ask for a more fitting sound (open, close, step ...). Only if it does not, play the general one.
      window.setTimeout(() => {
        if (!sound.askedSince(at)) sound.play(name);
      }, 0);
    };

    // One tick when the mouse arrives on an interactive element; none for moving about inside it. Listening to
    // mouse movement (not to the element under the mouse changing) keeps it silent when the page changes under
    // a mouse that is standing still.
    let hovered: Element | null = null;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const element = (event.target as Element | null)?.closest?.(HOVERABLE) ?? null;
      if (element === hovered) return;
      hovered = element;
      if (element && soundFor(element)) sound.play('hover');
    };

    // A soft note on arriving at the very top or the very bottom of the page.
    let edge: 'top' | 'bottom' | 'between' = 'top';
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bottom = document.documentElement.scrollHeight - window.innerHeight;
        const at = window.scrollY <= 2 ? 'top' : window.scrollY >= bottom - 2 ? 'bottom' : 'between';
        if (at !== edge && at !== 'between') sound.play('edge');
        edge = at;
      });
    };

    // Another tab, a minimised window, leaving the page: fade out and pause. Another window in front: lower the music.
    const onVisibility = () => sound.setHidden(document.visibilityState === 'hidden');
    const onHide = () => sound.setHidden(true);
    const onBlur = () => sound.duck(true);
    const onFocus = () => sound.duck(false);

    document.addEventListener('pointerup', onGesture, true);
    document.addEventListener('touchend', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
    document.addEventListener('click', onGesture, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('pointerup', onGesture, true);
      document.removeEventListener('touchend', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);
      document.removeEventListener('click', onGesture, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      cancelAnimationFrame(frame);
      sound.detach();
    };
  }, []);

  // A soft chime the first time each marked moment (data-sound-reveal="name") scrolls into view.
  const revealed = useRef(new Set<string>());
  useEffect(() => {
    const seen = revealed.current;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-sound-reveal') ?? '';
          // Marked as heard only once it has actually played, so a moment skipped while the page was jumping can still chime later.
          // Nor does it chime while the page is racing past.
          if (entry.isIntersecting && !seen.has(id) && scrollSpeed() < 1500 && sound.play('reveal')) seen.add(id);
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll('[data-sound-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // The page's content is rebuilt when the language changes, so the marked elements are looked up again.
  }, [lang]);
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-11 w-full items-center justify-between gap-4 text-start">
      <span className="text-[15px] font-medium">{label}</span>
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-electric' : 'bg-white/20'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-[inset-inline-start] duration-300 ease-cine ${checked ? 'start-6' : 'start-1'}`} />
      </span>
    </button>
  );
}

interface LevelProps {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
  /** Called when the visitor lets go of the slider. */
  onCommit?: () => void;
}

function Level({ label, value, disabled, onChange, onCommit }: LevelProps) {
  const percent = Math.round(value * 100);
  return (
    <label className={`mt-1 flex items-center gap-3 transition-opacity duration-300 ${disabled ? 'opacity-40' : ''}`}>
      <span className="sr-only">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        data-sound="none"
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="h-8 min-w-0 flex-1 cursor-pointer accent-electric"
      />
      <span className="label latin w-9 shrink-0 text-end text-white/70">{percent}</span>
    </label>
  );
}

/**
 * The sound control: a small fixed button that opens a panel for the music, the interface sounds, their levels,
 * mute and restart. It stays on screen everywhere, including over the opening sequence and the picture viewer.
 */
export default function SoundDock() {
  const { t, lang } = useLang();
  const c = t.sound;
  const state = useSyncExternalStore(sound.subscribe, sound.getSnapshot);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useSoundSystem(lang);

  const audible = state.running && !state.muted && (state.music || state.effects);

  const close = () => {
    sound.play('close');
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('[role="switch"]')?.focus({ preventScroll: true });
    // Escape closes this panel only: the picture or page open behind it stays open.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      sound.play('close');
      setOpen(false);
      button.current?.focus({ preventScroll: true });
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => {
          sound.play(open ? 'close' : 'open');
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-controls="sound-panel"
        aria-label={c.open}
        title={c.open}
        className={`fixed bottom-4 end-4 z-[120] grid h-11 w-11 place-items-center rounded-full border bg-navy/85 shadow-[0_12px_32px_-12px_rgba(4,12,24,0.8)] backdrop-blur-md transition-colors duration-300 hover:border-electric md:bottom-auto md:end-3 md:top-1/2 md:h-16 md:w-7 md:-translate-y-1/2 ${open ? 'border-electric' : 'border-white/20'} ${audible ? 'text-white' : 'text-white/55'}`}
      >
        <span className="bars flex items-end gap-[3px]" data-on={audible && !reduced} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        {state.muted && <span aria-hidden="true" className="absolute h-px w-6 -rotate-45 bg-electric" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id="sound-panel"
            role="dialog"
            aria-label={c.title}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 10 }}
            transition={{ duration: reduced ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[4.25rem] end-4 z-[120] max-h-[calc(100svh-5.5rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-navy/95 p-5 text-white shadow-[0_30px_80px_-20px_rgba(4,12,24,0.9)] backdrop-blur-md md:bottom-auto md:end-12 md:top-1/2 md:max-h-[calc(100svh-2rem)] md:-translate-y-1/2"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="label flex items-center gap-3 text-ice">
                <span aria-hidden="true" className="h-[2px] w-6 bg-electric" />
                {c.title}
              </p>
              <button type="button" onClick={close} aria-label={c.close} className="-me-2 grid h-11 w-11 place-items-center rounded-full text-white/70 hover:text-white">
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            {!state.running && <p className="mt-2 text-sm leading-relaxed text-white/70">{c.waiting}</p>}

            <div className="mt-3 border-t border-white/15 pt-3">
              <Switch label={c.music} checked={state.music} onChange={(music) => sound.update({ music })} />
              <Level label={c.musicVolume} value={state.musicVolume} disabled={!state.music} onChange={(musicVolume) => sound.update({ musicVolume })} />
            </div>
            <div className="mt-3 border-t border-white/15 pt-3">
              <Switch label={c.effects} checked={state.effects} onChange={(effects) => sound.update({ effects })} />
              {/* Letting go of the slider plays a click, so the new level can be heard. */}
              <Level label={c.effectsVolume} value={state.effectsVolume} disabled={!state.effects} onChange={(effectsVolume) => sound.update({ effectsVolume })} onCommit={() => sound.play('click')} />
            </div>

            <div className="mt-4 grid gap-2 border-t border-white/15 pt-4">
              <button
                type="button"
                aria-pressed={state.muted}
                onClick={() => sound.update({ muted: !state.muted })}
                className={`flex min-h-11 items-center justify-center gap-3 rounded-full border px-4 text-sm font-medium transition-colors duration-300 ${state.muted ? 'border-electric bg-electric text-white' : 'border-white/25 hover:border-white'}`}
              >
                {state.muted ? <Volume2 size={16} strokeWidth={1.5} aria-hidden="true" /> : <VolumeX size={16} strokeWidth={1.5} aria-hidden="true" />}
                {state.muted ? c.unmute : c.muteAll}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.restart();
                  sound.play('nav');
                }}
                className="flex min-h-11 items-center justify-center gap-3 rounded-full border border-white/25 px-4 text-sm font-medium transition-colors duration-300 hover:border-white"
              >
                <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" />
                {c.restart}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
