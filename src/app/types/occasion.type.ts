/**
 * Occasion Type Definition
 *
 * Represents a recurring date/event linked to a contact.
 * Examples: birthdays, anniversaries, memorials, etc.
 *
 * Occasions are linked to contacts and can generate
 * calendar events for the current (and future) years.
 *
 * Learning note: By separating Occasion from CalendarEvent,
 * we maintain a clean domain model where:
 * - Occasion = the recurring template (e.g., "John's Birthday")
 * - CalendarEvent = the actual instance on a specific date
 */

import type { Contact } from './contact.type';

/**
 * Types of occasions that can be tracked
 * - birthday: Annual birthday celebration
 * - anniversary: Wedding or relationship anniversary
 * - memorial: Remembrance of someone who passed away
 * - custom: User-defined recurring occasion
 */
export type OccasionType = 'birthday' | 'anniversary' | 'memorial' | 'custom';

/**
 * Core occasion information
 *
 * @property id - Unique identifier (UUID format)
 * @property contactId - Reference to the associated Contact
 * @property contact - Populated Contact object (when loaded with joins)
 * @property title - Display title for the occasion
 * @property type - Type of occasion (birthday, anniversary, etc.)
 * @property date - ISO date string (YYYY-MM-DD format, month/day for recurring)
 * @property year - Optional birth/start year (null for year-less birthdays)
 * @property repeatAnnually - Whether to repeat every year
 * @property reminderDaysBefore - Array of days before to send reminders
 * @property reminderEnabled - Whether reminders are active
 * @property notes - Optional notes about the occasion
 * @property createdAt - ISO timestamp when occasion was created
 * @property updatedAt - ISO timestamp when occasion was last modified
 */
export interface Occasion {
  id: string;
  contactId: string;
  contact?: Contact; // Populated when loaded with contact data
  title: string;
  type: OccasionType;
  date: string; // ISO date string (YYYY-MM-DD)
  year?: number; // Optional year for age calculation
  repeatAnnually: boolean;
  reminderDaysBefore?: number; // Single value, default 7 days
  reminderEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper type for creating a new occasion
 * Omits auto-generated fields and optional contact population
 */
export type NewOccasion = Omit<
  Occasion,
  'id' | 'contact' | 'createdAt' | 'updatedAt'
>;

/**
 * Helper type for updating an existing occasion
 */
export type OccasionUpdate = Partial<Omit<Occasion, 'id' | 'contact'>> &
  Pick<Occasion, 'id'>;

/**
 * Options for displaying occasions
 * Used for select dropdowns and filters
 */
export interface OccasionTypeOption {
  value: OccasionType;
  label: string;
  icon?: string; // Material icon name
}

/**
 * Predefined occasion type options for UI components
 *
 * Learning note: Exporting constants alongside types
 * ensures consistent options across components
 */
export const OCCASION_TYPE_OPTIONS: OccasionTypeOption[] = [
  { value: 'birthday', label: 'Birthday', icon: 'cake' },
  { value: 'anniversary', label: 'Anniversary', icon: 'favorite' },
  { value: 'memorial', label: 'Memorial', icon: 'local_florist' },
  { value: 'custom', label: 'Custom', icon: 'event' },
];
