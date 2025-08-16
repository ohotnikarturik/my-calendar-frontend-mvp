import { Injectable, signal } from '@angular/core';
import type { CalendarEvent } from '../types/event.type';

@Injectable({ providedIn: 'root' })
export class CalendarEventsService {
  private readonly _events = signal<CalendarEvent[]>([]);

  readonly events = this._events.asReadonly();

  loadInitial(events: CalendarEvent[]) {
    this._events.set(events);
  }

  add(event: CalendarEvent) {
    this._events.update((list) => [...list, event]);
  }

  update(id: string, patch: Partial<CalendarEvent>) {
    this._events.update((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  remove(id: string) {
    this._events.update((list) => list.filter((e) => e.id !== id));
  }
}
