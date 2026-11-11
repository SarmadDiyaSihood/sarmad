import { ArrowUpRight, Maximize2 } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import type { Content } from '../../i18n/en';
import type { Project } from '../../lib/api';
import type { Lang } from '../../context/LanguageContext';

export interface Origin {
  x: number;
  y: number;
}

export interface ChapterProps {
  index: number;
  chapter: Content['chapters'][number];
  onExplore: (index: number, origin: Origin) => void;
  /** The film archive. Every chapter picture that is a piece of work is one of its entries. */
  pieces?: Project[];
  /** Opens a picture in the viewer. */
  onOpenProject?: (slug: string, rect: DOMRect) => void;
}

export const CHAPTER_KEYS = ['media', 'design', 'marketing', 'technology'] as const;

/**
 * The chapters' own pictures: the owner's originals, byte for byte, with their own pixel sizes.
 * `slug` is the picture's entry in the film archive. The same file is shown there, and that entry
 * (its title and category) is what the viewer shows when the picture is clicked.
 */
export const MEDIA_STUDIO = { slug: 'media-cinematic-production', src: '/images/work-media-studio.jpg', width: 2668, height: 1502 } as const;
export const MEDIA_CAMERA = { slug: 'cinematography-directing', src: '/images/work-media-camera.jpg', width: 2360, height: 1328 } as const;
/** The two pieces of the Creative Design chapter, in display order. */
export const DESIGN_WORKS = [
  { slug: 'logo-core-identity', src: '/images/work-design-logo.png', width: 1536, height: 1024 },
  { slug: 'visual-identity-applications', src: '/images/work-design-identity.png', width: 1536, height: 1024 },
] as const;
export const SPECIALTY_PICTURES = {
  marketing: { slug: 'digital-marketing', src: '/images/work-marketing.png', width: 1672, height: 941 },
  technology: { slug: 'technology-programming', src: '/images/work-technology.png', width: 1671, height: 941 },
} as const;
/** The illustrative picture of the Blender specialty. It is not a piece of work, so it is not an archive entry. */
export const BLENDER_PICTURE = { slug: 'blender-3d', src: '/images/ch-blender.webp', width: 1536, height: 1024 } as const;
/** The picture on each chapter's "Explore" page. */
export const CHAPTER_PICTURES = [MEDIA_CAMERA, DESIGN_WORKS[1], SPECIALTY_PICTURES.marketing, SPECIALTY_PICTURES.technology];

export const entryFor = (pieces: Project[] | undefined, slug: string) => pieces?.find((p) => p.slug === slug);
export const titleOf = (p: Project, lang: Lang) => (lang === 'ar' ? p.title_ar || p.title_en : p.title_en || p.title_ar);

/** The round "open" badge on a clickable picture. It appears on hover and focus, and is always there on touch screens. */
export function OpenBadge({ className = 'bottom-3 end-3' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-electric text-white opacity-0 shadow-[0_10px_30px_-10px_rgba(7,20,38,0.7)] transition duration-500 ease-cine group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-disabled:hidden [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 ${className}`}
    >
      <Maximize2 size={16} strokeWidth={1.6} />
    </span>
  );
}

interface SpecialtyPictureProps {
  picture: { slug: string; src: string; width: number; height: number };
  /** The archive entry the picture opens. Until the archive has loaded there is nothing to open, so the picture is not yet clickable. */
  piece?: Project;
  /** Used for the picture's description until the archive entry is available. */
  fallbackAlt: string;
  /** "light" on the pale chapters, "dark" on the navy ones. */
  tone: 'light' | 'dark';
  onOpen?: (slug: string, rect: DOMRect) => void;
  className?: string;
}

/** A chapter's own picture, shown whole in its own proportions. Clicking it opens the picture in the viewer. */
export function SpecialtyPicture({ picture, piece, fallbackAlt, tone, onOpen, className = '' }: SpecialtyPictureProps) {
  const { t, lang } = useLang();
  const title = piece ? titleOf(piece, lang) : fallbackAlt;
  const alt = (piece && (lang === 'ar' ? piece.cover_alt_ar : piece.cover_alt_en)) || fallbackAlt;
  const frame =
    tone === 'light'
      ? 'border-navy/15 group-hover:shadow-[0_34px_70px_-36px_rgba(23,105,255,0.6)]'
      : 'border-white/15 group-hover:shadow-[0_40px_90px_-34px_rgba(23,105,255,0.75)]';
  return (
    <button
      type="button"
      disabled={!piece}
      data-cursor={piece ? 'view' : undefined}
      data-cursor-label={t.work.view}
      aria-label={`${t.work.view}: ${title}`}
      onClick={(e) => piece && onOpen?.(piece.slug, (e.currentTarget.querySelector('[data-photo]') ?? e.currentTarget).getBoundingClientRect())}
      className={`group block w-full text-start disabled:pointer-events-none ${className}`}
    >
      <span
        data-photo
        className={`relative block overflow-hidden border bg-navy transition-[border-color,box-shadow,transform] duration-700 ease-cine group-hover:-translate-y-1.5 group-hover:border-electric group-focus-visible:border-electric ${frame}`}
        style={{ aspectRatio: `${picture.width} / ${picture.height}` }}
      >
        <span className="block h-full w-full transition-transform duration-[1200ms] ease-cine group-hover:scale-[1.03]">
          <img src={picture.src} alt={alt} width={picture.width} height={picture.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </span>
        <OpenBadge />
      </span>
    </button>
  );
}

/** EXPLORE button: reports where it was clicked so the detail view can open from that point. */
export function ExploreButton({ index, onExplore, className = '' }: { index: number; onExplore: ChapterProps['onExplore']; className?: string }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      className={`btn label ${className}`}
      aria-label={`${t.expertise.explore}: ${t.chapters[index].title}`}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onExplore(index, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      {t.expertise.explore}
      <ArrowUpRight size={16} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden="true" />
    </button>
  );
}
