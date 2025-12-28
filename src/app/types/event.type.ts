import type { EventInput } from '@fullcalendar/core';

export interface CalendarEvent extends EventInput {
  id: string;
  description?: string;
  repeatAnnually?: boolean;
  reminderDaysBefore?: number; // Single value, default 7 days
  reminderEnabled?: boolean;
  category?: EventCategory;
  color?: string;
}

export type EventCategory = 'birthday' | 'anniversary' | 'holiday' | 'personal' | 'work' | 'other';
