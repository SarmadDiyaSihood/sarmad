import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Content } from '../i18n/en';
import { ar } from '../i18n/ar';

export type Lang = 'en' | 'ar';

interface LangValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  /** +1 for LTR, -1 for RTL: multiply horizontal motion by this. */
  s: 1 | -1;
  t: Content;
  setLang: (lang: Lang) => void;
}

const STORAGE_KEY = 'sarmad-lang';
const LanguageContext = createContext<LangValue | null>(null);

function initialLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice simply is not remembered */
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', s: lang === 'ar' ? -1 : 1, t: lang === 'ar' ? ar : en, setLang }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
