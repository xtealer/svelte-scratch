import { translations, type Language, type Translations } from './translations';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'ar'];
const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'casino-language';

// Reactive state for current language
let currentLanguage = $state<Language>(DEFAULT_LANGUAGE);

/**
 * Detect browser language and return supported language or default
 */
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

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

/**
 * Initialize language detection - call this on app mount
 */
export function initLanguage(): void {
  currentLanguage = detectBrowserLanguage();
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Set language and persist to localStorage
 */
export function setLanguage(lang: Language): void {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`Unsupported language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
    lang = DEFAULT_LANGUAGE;
  }
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

/**
 * Get translations for current language
 */
export function t(): Translations {
  return translations[currentLanguage];
}

/**
 * Get translation for a specific language (useful for generated content)
 */
export function tFor(lang: Language): Translations {
  return translations[lang];
}

/**
 * Check if current language is RTL (Arabic)
 */
export function isRTL(): boolean {
  return currentLanguage === 'ar';
}

/**
 * Get text direction for current language
 */
export function getDirection(): 'ltr' | 'rtl' {
  return currentLanguage === 'ar' ? 'rtl' : 'ltr';
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
