import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useOverlay } from '../lib/hooks';

interface Props {
  src: string;
  alt: string;
  title: string;
  category: string;
  /** Word shown before the category ("Category"). */
  categoryLabel?: string;
  /** The picture's shape: "16 / 9", or its own pixel size ("1672 / 941"), which also stops it being enlarged past that size. */
  ratio: string;
  backLabel: string;
  /** Shorter wording for the back button on narrow screens. */
  backShort: string;
  /** Step to the previous / next picture of the set. Left out when the picture is not part of a set. */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  /** The frame the viewer opens from, and closes back into. */
  rect: DOMRect;
  /** Closes the viewer (Escape, browser Back). */
  onClose: () => void;
  /** The back button: closes the viewer and returns to where the picture was opened. */
  onBack: () => void;
}

const EASE = [0.87, 0, 0.13, 1] as const;
const SOFT = [0.16, 1, 0.3, 1] as const;
const ROUND = 'grid h-11 w-11 place-items-center rounded-full border border-white/30 transition-colors duration-500 hover:border-electric hover:bg-electric focus-visible:border-electric focus-visible:bg-electric';

/** The one viewer every picture on the site opens in: the picture, whole and large, its category and its title. Nothing else. */
export default function PieceViewer({ src, alt, title, category, categoryLabel, ratio, backLabel, backShort, onPrev, onNext, prevLabel, nextLabel, rect, onClose, onBack }: Props) {
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(onClose, panel);

  const [w, h] = ratio.split('/').map(Number);
  // The picture's own width in pixels: known up front when the ratio is its pixel size, otherwise once it has loaded.
  const [loaded, setLoaded] = useState<{ src: string; width: number } | null>(null);
  const natural = w > 100 ? w : loaded?.src === src ? loaded.width : null;
  // As large as the screen allows while the title stays in view; never above the picture's own size.
  const pictureWidth = `min(${natural ?? 1920}px, max(36rem, calc((100svh - 13.5rem) * ${w / h})))`;

  // The first picture waits for the viewer to open; pictures stepped to afterwards appear at once.
  const stepped = useRef(false);
  useEffect(() => {
    stepped.current = true;
  }, []);
  const wait = reduced || stepped.current ? 0 : 0.3;

  // Arrow keys step through the set.
  useEffect(() => {
    if (!onPrev && !onNext) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // In Arabic the reading direction, and so "next", runs to the left.
      const forward = (e.key === 'ArrowRight') === (document.documentElement.dir !== 'rtl');
      (forward ? onNext : onPrev)?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const frame = `inset(${Math.max(0, rect.top)}px ${Math.max(0, vw - rect.right)}px ${Math.max(0, vh - rect.bottom)}px ${Math.max(0, rect.left)}px)`;
  // Closing normally folds the viewer back into the frame it opened from. When that frame is no longer the
  // picture on screen (wipe = true, passed by AnimatePresence), it slides away downwards instead.
  const variants: Variants = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { clipPath: frame },
        animate: { clipPath: 'inset(0px 0px 0px 0px)' },
        exit: (wipe?: boolean) => ({ clipPath: wipe ? `inset(${vh}px 0px 0px 0px)` : frame }),
      };

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      data-lenis-prevent
      className="grain fixed inset-0 z-[95] overflow-y-auto overscroll-contain bg-navy-deep text-white outline-none"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: reduced ? 0.25 : 0.85, ease: EASE }}
    >
      <div className="relative z-10 flex min-h-full flex-col">
        <div className="sticky top-0 z-20 flex px-5 pb-5 pt-3 md:px-10 bg-[linear-gradient(to_bottom,var(--color-navy-deep)_0%,var(--color-navy-deep)_72%,transparent_100%)]">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group label flex min-h-11 items-center gap-3 rounded-full bg-white/10 pe-5 ps-1 transition-colors duration-500 hover:bg-electric focus-visible:bg-electric"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30">
              <ArrowLeft size={15} strokeWidth={1.5} className="transition-transform duration-500 ease-cine group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
            {/* The full wording where it fits on one line (Arabic sets narrower than spaced-out Latin capitals). */}
            <span className="hidden min-[480px]:inline rtl:min-[340px]:inline">{backLabel}</span>
            <span className="min-[480px]:hidden rtl:min-[340px]:hidden">{backShort}</span>
          </button>
        </div>

        <figure className="flex flex-1 flex-col items-center justify-center pb-8 md:px-10">
          <motion.div
            key={src}
            className="w-full overflow-hidden bg-navy"
            style={{ aspectRatio: ratio, maxWidth: pictureWidth }}
            initial={reduced ? false : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: SOFT, delay: wait }}
          >
            <img src={src} alt={alt} decoding="async" onLoad={(e) => setLoaded({ src, width: e.currentTarget.naturalWidth })} className="h-full w-full object-contain" />
          </motion.div>

          {/* On phones the arrows sit under the title, which then has the full width. */}
          <figcaption className="mt-6 flex w-full flex-col gap-5 px-5 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between md:px-0" style={{ maxWidth: pictureWidth }}>
            <motion.div
              key={src}
              className="min-w-0"
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: SOFT, delay: wait ? wait + 0.25 : 0 }}
            >
              <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-ice">
                {categoryLabel && <span className="text-white/60">{categoryLabel}</span>}
                <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-electric" />
                {category}
              </p>
              <h2 className="display-2 mt-3 text-[clamp(1.35rem,2.3vw,2.25rem)]">{title}</h2>
            </motion.div>

            {(onPrev || onNext) && (
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onPrev} aria-label={prevLabel} className={ROUND}>
                  <ArrowLeft size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
                </button>
                <button type="button" onClick={onNext} aria-label={nextLabel} className={ROUND}>
                  <ArrowRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
                </button>
              </div>
            )}
          </figcaption>
        </figure>
      </div>
    </motion.div>
  );
}
