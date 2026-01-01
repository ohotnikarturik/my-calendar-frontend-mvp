import { Injectable, signal, computed, inject } from '@angular/core';
import { Language } from '../types/language.type';
import { SettingsService } from './settings.service';

// Import translation files
import enTranslations from '../i18n/translations/en.json';
import ruTranslations from '../i18n/translations/ru.json';
import uaTranslations from '../i18n/translations/ua.json';
import fiTranslations from '../i18n/translations/fi.json';

export type TranslationKey = string;
export type TranslationValue = string | Record<string, unknown>;
export type Translations = Record<string, TranslationValue>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly settingsService = inject(SettingsService);

  private readonly translationMap: Record<Language, Translations> = {
    en: enTranslations,
    ru: ruTranslations,
    ua: uaTranslations,
    fi: fiTranslations,
  };

  // Current language signal
  private readonly _currentLanguage = signal<Language>(
    this.detectInitialLanguage()
  );

  readonly currentLanguage = this._currentLanguage.asReadonly();

  // Computed translations based on current language
  readonly translations = computed(() => {
    return this.translationMap[this._currentLanguage()];
  });

  /**
   * Detect initial language from localStorage, settings, or browser
   */
  private detectInitialLanguage(): Language {
    // 1. Try localStorage first (for unauthenticated users)
    const storedLang = localStorage.getItem('language') as Language | null;
    if (storedLang && this.isValidLanguage(storedLang)) {
      return storedLang;
    }

    // 2. Try to get from settings (for authenticated users)
    const savedLanguage = this.settingsService.settings().language;
    if (savedLanguage) {
      return savedLanguage;
    }

    // 3. Fallback to browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('uk') || browserLang.startsWith('ua'))
      return 'ua';
    if (browserLang.startsWith('fi')) return 'fi';

    return 'en'; // Default fallback
  }

  /**
   * Validate if string is a supported language
   */
  private isValidLanguage(lang: string): lang is Language {
    return ['en', 'ru', 'ua', 'fi'].includes(lang);
  }

  /**
   * Set language and persist to both localStorage and settings
   */
  setLanguage(language: Language): void {
    this._currentLanguage.set(language);
    // Save to localStorage for unauthenticated users
    localStorage.setItem('language', language);
    // Save to settings (will sync to Supabase if authenticated)
    this.settingsService.updateSettings({ language });
  }

  /**
   * Get translation by key path (e.g., 'nav.home')
   * Supports nested keys with dot notation
   */
  translate(
    key: TranslationKey,
    params?: Record<string, string | number>
  ): string {
    const translation = this.getNestedValue(this.translations(), key);

    if (translation === undefined || translation === null) {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return key itself as fallback
    }

    const translationStr = String(translation);

    // Replace params in translation string
    if (params) {
      return this.interpolate(translationStr, params);
    }

    return translationStr;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (current, key) => (current as Record<string, unknown>)?.[key],
        obj
      );
  }

  /**
   * Replace {{param}} placeholders in translation string
   */
  private interpolate(
    template: string,
    params: Record<string, string | number>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key]?.toString() ?? `{{${key}}}`;
    });
  }
}
