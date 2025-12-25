import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './services/error-handler.service';

function detectLocale(): string {
  const fallbackLocale = 'en-US';

  if (typeof navigator === 'undefined') {
    return fallbackLocale;
  }

  const intlLocale =
    typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function'
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : undefined;

  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
    intlLocale,
  ].filter((value): value is string => Boolean(value));

  const finnishCandidate = candidates.find((locale) => {
    const normalized = locale.toLowerCase();
    return (
      normalized === 'fi' ||
      normalized.startsWith('fi-') ||
      normalized.endsWith('-fi')
    );
  });

  if (finnishCandidate) {
    return 'fi-FI';
  }

  if (
    typeof Intl !== 'undefined' &&
    typeof Intl.DateTimeFormat === 'function'
  ) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && timeZone.toLowerCase() === 'europe/helsinki') {
      return 'fi-FI';
    }
  }

  if (candidates.length > 0) {
    const regionSpecific = candidates.find((locale) => locale.includes('-'));
    return regionSpecific ?? candidates[0];
  }

  return fallbackLocale;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    {
      provide: MAT_DATE_LOCALE,
      useFactory: () => detectLocale(),
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    provideNativeDateAdapter(),
    provideRouter(routes),
  ],
};
