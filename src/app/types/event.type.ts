import type { EventInput } from '@fullcalendar/core';

export interface CalendarEvent extends EventInput {
  id: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  repeatAnnually?: boolean;
  eventType?: EventType;
  reminderDaysBefore?: number[];
  reminderEnabled?: boolean;
  category?: EventCategory;
  color?: string;
  notes?: string;
}

export type EventType = 'birthday' | 'anniversary' | 'memorial' | 'custom';

export type EventCategory = 'birthday' | 'anniversary' | 'holiday' | 'personal' | 'work' | 'other';
