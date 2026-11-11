import { useCallback, useEffect, useState } from 'react';

export type CategoryKey = 'media' | 'design' | 'marketing' | 'technology' | 'blender';

export interface Detail {
  label: string;
  value: string;
}

export interface Section {
  title: string;
  body: string;
}

export interface Project {
  id: number;
  slug: string;
  sort_order: number;
  category_key: CategoryKey;
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  description_en: string;
  description_ar: string;
  role_en: string;
  role_ar: string;
  responsibilities_en: string[] | null;
  responsibilities_ar: string[] | null;
  details_en: Detail[] | null;
  details_ar: Detail[] | null;
  cover_image: string;
  cover_video: string | null;
  is_sample: boolean;
  /** "image": the entry is one picture. It opens large with its title and category only, not as a full project page. */
  view?: 'image';
  /** Description of the cover image for screen readers (used on the project page). */
  cover_alt_en?: string;
  cover_alt_ar?: string;
  /** Set (e.g. "16 / 9") for covers that are complete pictures: the frame takes this shape and the picture is never cropped. */
  cover_ratio?: string;
  /** Extra titled sections shown after the overview on the project page. */
  sections_en?: Section[];
  sections_ar?: Section[];
  /** Heading for the responsibilities list, when the default one is not specific enough. */
  responsibilities_title_en?: string;
  responsibilities_title_ar?: string;
  outputs_en?: string[];
  outputs_ar?: string[];
}

export interface Channel {
  id: number;
  kind: 'email' | 'phone' | 'social';
  label_en: string;
  label_ar: string;
  value: string | null;
  url: string | null;
  sort_order: number;
}

export type ExperienceCategory = 'training' | 'media' | 'marketing' | 'hr';

export interface Experience {
  id: string;
  category: ExperienceCategory;
  title_en: string;
  title_ar: string;
  org_en: string;
  org_ar: string;
  type_en: string;
  type_ar: string;
  /** "YYYY" or "YYYY-MM" */
  start: string;
  /** "YYYY", "YYYY-MM" or empty */
  end: string;
  current: boolean;
  resp_en: string[];
  resp_ar: string[];
}

export type CertificationCategory = 'security' | 'web' | 'business' | 'leadership';

export interface Certification {
  id: string;
  category: CertificationCategory;
  name_en: string;
  name_ar: string;
  issuer_en: string;
  issuer_ar: string;
  country_en: string;
  country_ar: string;
  desc_en: string;
  desc_ar: string;
  status_en: string;
  status_ar: string;
}

export interface Skill {
  ar: string;
  en: string;
  /** Latin-script term shown beside the Arabic name, e.g. "SEO". */
  latin: string;
}

export interface SkillGroup {
  id: string;
  title_en: string;
  title_ar: string;
  skills: Skill[];
}

export interface Remote<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/** Fetches JSON from an API route and exposes loading / error / reload. */
export function useRemote<T>(url: string): Remote<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // An empty address means "nothing to load" (used for sections that are switched off).
    if (!url) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (alive) setData(json);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, loading, error, reload };
}
