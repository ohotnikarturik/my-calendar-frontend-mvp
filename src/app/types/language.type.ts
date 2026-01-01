export type Language = 'en' | 'ru' | 'ua' | 'fi';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ua', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
];
