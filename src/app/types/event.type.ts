import type { EventInput } from '@fullcalendar/core';

export interface CalendarEvent extends EventInput {
  id: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  repeatAnnually?: boolean;
  eventType?: EventType;
}

export type EventType = 'birthday' | 'anniversary' | 'memorial' | 'custom';
