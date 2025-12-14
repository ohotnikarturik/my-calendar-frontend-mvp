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

/**
 * Available theme options
 * - light: Light mode (white background)
 * - dark: Dark mode (dark background)
 * - auto: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Available export formats for data backup
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Supported languages (for future i18n implementation)
 */
export type AppLanguage = 'en' | 'uk' | 'fi';

/**
 * Application settings configuration
 *
 * @property timezone - User's preferred timezone (IANA format)
 * @property defaultReminderDays - Default days before event for reminders
 * @property theme - UI theme preference
 * @property language - Application language (for future i18n)
 * @property exportFormat - Preferred format for data export
 * @property calendarStartOfWeek - First day of week (0=Sunday, 1=Monday)
 * @property showWeekNumbers - Whether to display week numbers in calendar
 */
export interface AppSettings {
  timezone: string; // e.g., 'Europe/Kiev', 'Europe/Helsinki', 'UTC'
  defaultReminderDays: number[]; // e.g., [30, 7, 1]
  theme: ThemeMode;
  language: AppLanguage;
  exportFormat: ExportFormat;
  calendarStartOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekNumbers: boolean;
}

/**
 * Default application settings
 *
 * Learning note: Exporting defaults alongside the type
 * provides a single source of truth for initial values
 * and makes reset-to-defaults functionality simple
 */
export const DEFAULT_SETTINGS: AppSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use browser's timezone
  defaultReminderDays: [7, 1], // 7 days and 1 day before
  theme: 'auto',
  language: 'en',
  exportFormat: 'json',
  calendarStartOfWeek: 1, // Monday (European default)
  showWeekNumbers: false,
};

/**
 * Common timezone options for the settings UI
 * Includes popular timezones for the app's target users
 *
 * Learning note: Rather than loading a full timezone database,
 * we provide curated options for better UX
 */
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string; // e.g., '+02:00'
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00' },
  { value: 'Europe/Kiev', label: 'Kyiv', offset: '+02:00' },
  { value: 'Europe/Helsinki', label: 'Helsinki', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'Mumbai', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: '+12:00' },
  { value: 'America/New_York', label: 'New York', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Chicago', offset: '-06:00' },
  { value: 'America/Denver', label: 'Denver', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
];

/**
 * Reminder day options for settings UI
 */
export interface ReminderDayOption {
  value: number;
  label: string;
}

export const REMINDER_DAY_OPTIONS: ReminderDayOption[] = [
  { value: 30, label: '30 days before' },
  { value: 14, label: '14 days before' },
  { value: 7, label: '1 week before' },
  { value: 3, label: '3 days before' },
  { value: 1, label: '1 day before' },
  { value: 0, label: 'On the day' },
];
