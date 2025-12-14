import { Injectable, signal, inject } from '@angular/core';
import type { CalendarEvent } from '../types/event.type';
import { StorageService } from './storage.service';
import { SyncService } from './sync.service';

/**
 * Calendar Events Service
 *
 * Manages calendar events with offline-first approach:
 * - Data is saved locally to IndexedDB first
 * - Syncs to Supabase in background when authenticated
 *
 * Learning note: The service uses optimistic updates (UI updates immediately)
 * and the SyncService handles background synchronization with the remote database.
 */
@Injectable({ providedIn: 'root' })
export class CalendarEventsService {
  private readonly storage = inject(StorageService);
  // Inject SyncService for background sync with Supabase
  private readonly syncService = inject(SyncService);
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
    // Add timestamps for sync tracking
    const eventWithTimestamps = {
      ...event,
      createdAt: event.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update - update UI immediately
    this._events.update((list) => [...list, eventWithTimestamps]);

    if (this._storageAvailable()) {
      try {
        await this.storage.saveEvent(eventWithTimestamps);
        // Sync to Supabase in background (non-blocking)
        // Learning note: We don't await this - it runs in background
        this.syncService.syncEvent(eventWithTimestamps);
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

    // Add updatedAt timestamp for sync tracking
    const patchWithTimestamp = {
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    this._events.update((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patchWithTimestamp } : e))
    );

    if (this._storageAvailable()) {
      try {
        await this.storage.updateEvent(id, patchWithTimestamp);
        // Sync to Supabase in background
        const updatedEvent = this._events().find((e) => e.id === id);
        if (updatedEvent) {
          this.syncService.syncEvent(updatedEvent);
        }
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

    // Optimistic update
    this._events.update((list) => list.filter((e) => e.id !== id));

    if (this._storageAvailable()) {
      try {
        await this.storage.deleteEvent(id);
        // Sync deletion to Supabase in background
        this.syncService.syncEventDeletion(id);
      } catch (error) {
        console.error('Failed to delete event:', error);
        // Revert on error
        this._events.update((list) => [...list, eventToRemove]);
        throw error;
      }
    }
  }

  /**
   * Refresh events from storage
   * Useful after a full sync with Supabase
   */
  async refresh(): Promise<void> {
    if (this._storageAvailable()) {
      try {
        const events = await this.storage.loadEvents();
        this._events.set(events);
      } catch (error) {
        console.error('Failed to refresh events:', error);
      }
    }
  }
}
