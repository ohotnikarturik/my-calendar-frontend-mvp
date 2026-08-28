/**
 * Application Settings Type Definition
 *
 * Stores user preferences for the calendar application.
 * Settings are persisted in localStorage for quick access
 * and don't require database sync.
 *
 * Learning note: Using a dedicated settings type allows
 * for type-safe settings management and easy migration
 * when adding new settings in the future.
 */

import { Language } from './language.type';
import { detectBrowserTimezone } from './timezone.type';

/**
 * Available theme options
 * - light: Light mode (white background)
 * - dark: Dark mode (dark background)
 * - auto: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Export format options for calendar data
 */
export type ExportFormat = 'csv' | 'ics' | 'json';

/**
 * Reminder day options for settings
 */
export const REMINDER_DAY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
];

/**
 * Application settings configuration
 *
 * @property theme - UI theme preference
 * @property language - UI language preference (en, ru, ua, fi)
 * @property timezone - User's timezone for event display
 * @property calendarStartOfWeek - Week start day (0 = Sunday, 1 = Monday)
 * @property exportFormat - Preferred export format
 * @property defaultReminderDays - Default reminder days for new events
 */
export interface AppSettings {
  theme: ThemeMode;
  language?: Language;
  timezone?: string;
  calendarStartOfWeek?: 0 | 1;
  exportFormat?: ExportFormat;
  defaultReminderDays?: number[];
}

/**
 * Default application settings
 *
 * Learning note: Exporting defaults alongside the type
 * provides a single source of truth for initial values
 * and makes reset-to-defaults functionality simple
 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  language: 'en',
  timezone: detectBrowserTimezone(),
  calendarStartOfWeek: 0,
  exportFormat: 'csv',
  defaultReminderDays: [7],
};
