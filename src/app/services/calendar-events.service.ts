import { Injectable, signal, inject } from '@angular/core';
import type { CalendarEvent } from '../types/event.type';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';

/**
 * Calendar Events Service
 *
 * Manages calendar events with direct Supabase integration:
 * - Data is fetched from and saved to Supabase
 * - Optimistic UI updates for instant feedback
 * - Automatic rollback on errors
 * - User notifications for all operations
 *
 * Learning note: This service uses signals for reactive state management
 * and optimistic updates to provide a smooth user experience.
 */
@Injectable({ providedIn: 'root' })
export class CalendarEventsService {
  private readonly supabase = inject(SupabaseService);
  private readonly notificationSvc = inject(NotificationService);
  private readonly _events = signal<CalendarEvent[]>([]);
  private readonly _loading = signal(true);

  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize by loading events from Supabase
   * Automatically called on service creation
   */
  private async initialize(): Promise<void> {
    try {
      if (this.supabase.isAuthenticated()) {
        const events = await this.supabase.fetchEvents();
        this._events.set(events);
      }
    } catch (error) {
      console.error('Failed to initialize events:', error);
      this.notificationSvc.error('Failed to load events. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reload events from Supabase
   * Useful after login or to refresh data
   */
  async reload(): Promise<void> {
    this._loading.set(true);
    try {
      const events = await this.supabase.fetchEvents();
      this._events.set(events);
    } catch (error) {
      console.error('Failed to reload events:', error);
      this.notificationSvc.errorWithRetry('Failed to load events', () =>
        this.reload()
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a new event
   * Uses optimistic updates - UI updates immediately, reverts on error
   */
  async add(event: CalendarEvent): Promise<void> {
    // Optimistic update - update UI immediately
    this._events.update((list) => [...list, event]);

    try {
      const success = await this.supabase.upsertEvents([event]);
      if (!success) {
        throw new Error('Failed to save event to Supabase');
      }
      this.notificationSvc.success('Event created successfully');
    } catch (error) {
      console.error('Failed to add event:', error);
      // Revert on error
      this._events.update((list) => list.filter((e) => e.id !== event.id));
      this.notificationSvc.error('Failed to create event. Please try again.');
      throw error;
    }
  }

  /**
   * Update an existing event
   * Uses optimistic updates - UI updates immediately, reverts on error
   */
  async update(id: string, patch: Partial<CalendarEvent>): Promise<void> {
    const currentEvent = this._events().find((e) => e.id === id);
    if (!currentEvent) return;

    const updatedEvent = { ...currentEvent, ...patch };

    // Optimistic update
    this._events.update((list) =>
      list.map((e) => (e.id === id ? updatedEvent : e))
    );

    try {
      const success = await this.supabase.upsertEvents([updatedEvent]);
      if (!success) {
        throw new Error('Failed to update event in Supabase');
      }
      this.notificationSvc.success('Event updated successfully');
    } catch (error) {
      console.error('Failed to update event:', error);
      // Revert on error
      this._events.update((list) =>
        list.map((e) => (e.id === id ? currentEvent : e))
      );
      this.notificationSvc.error('Failed to update event. Please try again.');
      throw error;
    }
  }

  /**
   * Delete an event
   * Uses optimistic updates - UI updates immediately, reverts on error
   */
  async remove(id: string): Promise<void> {
    const eventToRemove = this._events().find((e) => e.id === id);
    if (!eventToRemove) return;

    // Optimistic update
    this._events.update((list) => list.filter((e) => e.id !== id));

    try {
      const success = await this.supabase.deleteEvent(id);
      if (!success) {
        throw new Error('Failed to delete event from Supabase');
      }
      this.notificationSvc.success('Event deleted successfully');
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Revert on error
      this._events.update((list) => [...list, eventToRemove]);
      this.notificationSvc.error('Failed to delete event. Please try again.');
      throw error;
    }
  }
}
