export type Language = 'en' | 'ru' | 'ua' | 'fi';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

/** BCP 47 locales used by Material datepicker and Intl formatting */
export const LANGUAGE_BCP47_LOCALE: Record<Language, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ua: 'uk-UA',
  fi: 'fi-FI',
};

export function languageToBcp47Locale(language: Language): string {
  return LANGUAGE_BCP47_LOCALE[language];
}

export function detectAppLanguage(): Language {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('language');
    if (stored === 'en' || stored === 'ru' || stored === 'ua' || stored === 'fi') {
      return stored;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('uk') || browserLang.startsWith('ua')) return 'ua';
    if (browserLang.startsWith('fi')) return 'fi';
  }

  return 'en';
}

export function detectInitialBcp47Locale(): string {
  return languageToBcp47Locale(detectAppLanguage());
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ua', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
];
