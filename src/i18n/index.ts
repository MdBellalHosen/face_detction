import { en } from './en';
import type { Dict } from './en';
import { bn } from './bn';

export type Lang = 'en' | 'bn';
export type { Dict };

export const translations: Record<Lang, Dict> = { en, bn };

const STORAGE_KEY = 'moodcam-lang';

export function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    /* storage may be unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('bn') ? 'bn' : 'en';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}
