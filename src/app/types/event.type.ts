import type { EventInput } from '@fullcalendar/core';

export type CalendarEvent = EventInput & {
  id: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};
