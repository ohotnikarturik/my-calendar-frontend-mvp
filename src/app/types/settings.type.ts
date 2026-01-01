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
 * Common timezones for user selection
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time', offset: '-05:00/-04:00' },
  { value: 'America/Chicago', label: 'Central Time', offset: '-06:00/-05:00' },
  { value: 'America/Denver', label: 'Mountain Time', offset: '-07:00/-06:00' },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time',
    offset: '-08:00/-07:00',
  },
  { value: 'Europe/London', label: 'London', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00/+02:00' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00/+02:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '+08:00' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00/+11:00' },
];

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
  timezone: 'UTC',
  calendarStartOfWeek: 0,
  exportFormat: 'csv',
  defaultReminderDays: [7],
};
