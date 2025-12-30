/**
 * Notification Preferences Types
 *
 * Types for managing user email reminder preferences
 * Corresponds to user_notification_preferences table in Supabase
 */

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_reminders_enabled: boolean;
  reminder_days: number[]; // Days before event to send reminders (e.g., [1, 7] = 1 day and 7 days before)
  reminder_time: string; // Time of day to send reminders (HH:MM:SS format)
  timezone: string; // User's timezone (e.g., 'America/New_York')
  last_reminder_sent: string | null; // ISO timestamp of last reminder sent
  created_at: string;
  updated_at: string;
}

export interface SupabaseNotificationPreferences {
  id: string;
  user_id: string;
  email_reminders_enabled: boolean;
  reminder_days: number[];
  reminder_time: string;
  timezone: string;
  last_reminder_sent: string | null;
  created_at: string;
  updated_at: string;
}

// Default preferences for new users
export const DEFAULT_NOTIFICATION_PREFERENCES: Partial<NotificationPreferences> =
  {
    email_reminders_enabled: true,
    reminder_days: [1, 7], // 1 day and 7 days before
    reminder_time: '09:00:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };

// Reminder day options for UI
export const REMINDER_DAY_OPTIONS = [
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
  { value: 30, label: '1 month before' },
];

// Reminder time options for UI
export const REMINDER_TIME_OPTIONS = [
  { value: '06:00:00', label: '6:00 AM' },
  { value: '07:00:00', label: '7:00 AM' },
  { value: '08:00:00', label: '8:00 AM' },
  { value: '09:00:00', label: '9:00 AM' },
  { value: '10:00:00', label: '10:00 AM' },
  { value: '12:00:00', label: '12:00 PM' },
  { value: '18:00:00', label: '6:00 PM' },
  { value: '20:00:00', label: '8:00 PM' },
];

// Common timezones for UI
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];
