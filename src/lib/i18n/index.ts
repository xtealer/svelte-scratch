import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { translations, type Language, type Translations } from './translations';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'ar'];
const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'casino-language';

/**
 * Detect browser language and return supported language or default
 */
function detectBrowserLanguage(): Language {
  if (!browser) return DEFAULT_LANGUAGE;

  // Try to get from localStorage first (user preference)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
    return stored as Language;
  }

  // Get browser language
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if supported
  if (SUPPORTED_LANGUAGES.includes(langCode as Language)) {
    return langCode as Language;
  }

  return DEFAULT_LANGUAGE;
}

// Create a writable store for the current language
const initialLang = browser ? detectBrowserLanguage() : DEFAULT_LANGUAGE;
export const currentLanguage = writable<Language>(initialLang);

// Derived store for translations
export const t = derived(currentLanguage, ($lang) => translations[$lang]);

// Derived store for direction
export const direction = derived(currentLanguage, ($lang) => $lang === 'ar' ? 'rtl' as const : 'ltr' as const);

// Derived store for RTL check
export const isRTL = derived(currentLanguage, ($lang) => $lang === 'ar');

/**
 * Initialize language detection - call this on app mount (client-side only)
 */
export function initLanguage(): void {
  if (!browser) return;
  const lang = detectBrowserLanguage();
  currentLanguage.set(lang);
}

/**
 * Get current language value (non-reactive, for one-time reads)
 */
export function getLanguage(): Language {
  return get(currentLanguage);
}

/**
 * Set language and persist to localStorage
 */
export function setLanguage(lang: Language): void {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`Unsupported language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
    lang = DEFAULT_LANGUAGE;
  }
  currentLanguage.set(lang);
  if (browser) {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

/**
 * Get translations for a specific language (useful for generated content)
 */
export function tFor(lang: Language): Translations {
  return translations[lang];
}

/**
 * Get text direction for current language (non-reactive)
 */
export function getDirection(): 'ltr' | 'rtl' {
  return get(currentLanguage) === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Get all supported languages with labels
 */
export function getSupportedLanguages(): { code: Language; label: string; nativeLabel: string }[] {
  return [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  ];
}

// Re-export types
export type { Language, Translations };
