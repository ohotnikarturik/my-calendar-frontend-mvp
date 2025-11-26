import { Injectable, signal, inject } from '@angular/core';
import type { CalendarEvent } from '../types/event.type';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class CalendarEventsService {
  private readonly storage = inject(StorageService);
  private readonly _events = signal<CalendarEvent[]>([]);
  private readonly _loading = signal(true);
  private readonly _storageAvailable = signal(true);

  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly storageAvailable = this._storageAvailable.asReadonly();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const available = await this.storage.isAvailable();
      this._storageAvailable.set(available);

      if (available) {
        const events = await this.storage.loadEvents();
        this._events.set(events);
      }
    } catch (error) {
      console.error('Failed to initialize events:', error);
      this._storageAvailable.set(false);
    } finally {
      this._loading.set(false);
    }
  }

  async loadInitial(events: CalendarEvent[]): Promise<void> {
    this._events.set(events);
    if (this._storageAvailable()) {
      try {
        await this.storage.clearAllEvents();
        for (const event of events) {
          await this.storage.saveEvent(event);
        }
      } catch (error) {
        console.error('Failed to save initial events:', error);
      }
    }
  }

  async add(event: CalendarEvent): Promise<void> {
    this._events.update((list) => [...list, event]);
    if (this._storageAvailable()) {
      try {
        await this.storage.saveEvent(event);
      } catch (error) {
        console.error('Failed to save event:', error);
        // Revert on error
        this._events.update((list) => list.filter((e) => e.id !== event.id));
        throw error;
      }
    }
  }

  async update(id: string, patch: Partial<CalendarEvent>): Promise<void> {
    const currentEvent = this._events().find((e) => e.id === id);
    if (!currentEvent) return;

    this._events.update((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );

    if (this._storageAvailable()) {
      try {
        await this.storage.updateEvent(id, patch);
      } catch (error) {
        console.error('Failed to update event:', error);
        // Revert on error
        this._events.update((list) =>
          list.map((e) => (e.id === id ? currentEvent : e))
        );
        throw error;
      }
    }
  }

  async remove(id: string): Promise<void> {
    const eventToRemove = this._events().find((e) => e.id === id);
    if (!eventToRemove) return;

    this._events.update((list) => list.filter((e) => e.id !== id));

    if (this._storageAvailable()) {
      try {
        await this.storage.deleteEvent(id);
      } catch (error) {
        console.error('Failed to delete event:', error);
        // Revert on error
        this._events.update((list) => [...list, eventToRemove]);
        throw error;
      }
    }
  }
}
