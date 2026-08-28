import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './services/error-handler.service';
import { detectInitialBcp47Locale } from './types/language.type';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    {
      provide: MAT_DATE_LOCALE,
      useFactory: () => detectInitialBcp47Locale(),
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    provideNativeDateAdapter(),
    provideRouter(routes, withViewTransitions()),
  ],
};
