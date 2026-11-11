import type { Lang } from '../context/LanguageContext';

/** Picks the right word for a count ("5 مهارات" but "22 مهارة"), falling back to the "other" form. */
export function plural(n: number, forms: Record<string, string>, lang: Lang) {
  return forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;
}

/** Makes text comparable for search: case, Arabic diacritics and letter variants are ignored. */
export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}
