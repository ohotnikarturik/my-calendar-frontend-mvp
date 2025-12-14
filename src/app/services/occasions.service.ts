/**
 * Occasions Service
 *
 * Manages occasions (birthdays, anniversaries, etc.) linked to contacts.
 * Occasions can generate calendar events for display in FullCalendar.
 *
 * Learning note: This service shows how to work with related entities
 * (occasions belong to contacts) and how to transform data between
 * different formats (occasions → calendar events).
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import type {
  Occasion,
  NewOccasion,
  OccasionType,
} from '../types/occasion.type';
import type { CalendarEvent } from '../types/event.type';
import { StorageService } from './storage.service';
import { ContactsService } from './contacts.service';
import { DateUtilsService } from './date-utils.service';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class OccasionsService {
  private readonly storage = inject(StorageService);
  private readonly contactsService = inject(ContactsService);
  private readonly dateUtils = inject(DateUtilsService);
  // Inject SyncService for background sync with Supabase
  private readonly syncService = inject(SyncService);

  // Private signals for internal state
  private readonly _occasions = signal<Occasion[]>([]);
  private readonly _loading = signal(true);
  private readonly _storageAvailable = signal(true);

  // Public readonly signals
  readonly occasions = this._occasions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly storageAvailable = this._storageAvailable.asReadonly();

  // Computed: occasion count
  readonly occasionCount = computed(() => this._occasions().length);

  // Computed: occasions with contact data populated
  // Learning note: This joins occasions with their contacts for display
  readonly occasionsWithContacts = computed(() => {
    const occasions = this._occasions();
    const contacts = this.contactsService.contacts();

    return occasions.map((occasion) => ({
      ...occasion,
      contact: contacts.find((c) => c.id === occasion.contactId),
    }));
  });

  // Computed: occasions grouped by type
  readonly occasionsByType = computed(() => {
    const occasions = this.occasionsWithContacts();
    return {
      birthday: occasions.filter((o) => o.type === 'birthday'),
      anniversary: occasions.filter((o) => o.type === 'anniversary'),
      memorial: occasions.filter((o) => o.type === 'memorial'),
      custom: occasions.filter((o) => o.type === 'custom'),
    };
  });

  // Computed: upcoming occasions (next 30 days)
  readonly upcomingOccasions = computed(() => {
    const occasions = this.occasionsWithContacts();
    const today = this.dateUtils.today();
    const thirtyDaysFromNow = this.dateUtils.addDays(today, 30);

    return occasions
      .map((occasion) => ({
        ...occasion,
        nextOccurrence: this.getNextOccurrence(occasion.date),
      }))
      .filter((o) =>
        this.dateUtils.isWithinRange(o.nextOccurrence, today, thirtyDaysFromNow)
      )
      .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
  });

  constructor() {
    this.initialize();
  }

  /**
   * Initialize occasions from storage
   */
  private async initialize(): Promise<void> {
    try {
      const available = await this.storage.isAvailable();
      this._storageAvailable.set(available);

      if (available) {
        const occasions = await this.storage.loadOccasions();
        this._occasions.set(occasions);
      }
    } catch (error) {
      console.error('Failed to initialize occasions:', error);
      this._storageAvailable.set(false);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a new occasion
   */
  async add(occasionData: NewOccasion): Promise<Occasion> {
    const now = this.dateUtils.nowISO();
    const occasion: Occasion = {
      ...occasionData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    this._occasions.update((list) => [...list, occasion]);

    if (this._storageAvailable()) {
      try {
        await this.storage.saveOccasion(occasion);
        // Sync to Supabase in background (non-blocking)
        this.syncService.syncOccasion(occasion);
      } catch (error) {
        console.error('Failed to save occasion:', error);
        this._occasions.update((list) =>
          list.filter((o) => o.id !== occasion.id)
        );
        throw error;
      }
    }

    return occasion;
  }

  /**
   * Update an existing occasion
   */
  async update(
    id: string,
    patch: Partial<Omit<Occasion, 'id' | 'createdAt'>>
  ): Promise<void> {
    const currentOccasion = this._occasions().find((o) => o.id === id);
    if (!currentOccasion) {
      throw new Error(`Occasion with id ${id} not found`);
    }

    const updatedPatch = {
      ...patch,
      updatedAt: this.dateUtils.nowISO(),
    };

    // Optimistic update
    this._occasions.update((list) =>
      list.map((o) => (o.id === id ? { ...o, ...updatedPatch } : o))
    );

    if (this._storageAvailable()) {
      try {
        await this.storage.updateOccasion(id, updatedPatch);
        // Sync to Supabase in background
        const updatedOccasion = this._occasions().find((o) => o.id === id);
        if (updatedOccasion) {
          this.syncService.syncOccasion(updatedOccasion);
        }
      } catch (error) {
        console.error('Failed to update occasion:', error);
        this._occasions.update((list) =>
          list.map((o) => (o.id === id ? currentOccasion : o))
        );
        throw error;
      }
    }
  }

  /**
   * Remove an occasion
   */
  async remove(id: string): Promise<void> {
    const occasionToRemove = this._occasions().find((o) => o.id === id);
    if (!occasionToRemove) return;

    // Optimistic update
    this._occasions.update((list) => list.filter((o) => o.id !== id));

    if (this._storageAvailable()) {
      try {
        await this.storage.deleteOccasion(id);
        // Sync deletion to Supabase in background
        this.syncService.syncOccasionDeletion(id);
      } catch (error) {
        console.error('Failed to delete occasion:', error);
        this._occasions.update((list) => [...list, occasionToRemove]);
        throw error;
      }
    }
  }

  /**
   * Remove all occasions for a contact
   * Called when a contact is deleted
   */
  async removeByContact(contactId: string): Promise<void> {
    const occasionsToRemove = this._occasions().filter(
      (o) => o.contactId === contactId
    );
    if (occasionsToRemove.length === 0) return;

    // Optimistic update
    this._occasions.update((list) =>
      list.filter((o) => o.contactId !== contactId)
    );

    if (this._storageAvailable()) {
      try {
        await this.storage.deleteOccasionsByContact(contactId);
      } catch (error) {
        console.error('Failed to delete occasions by contact:', error);
        this._occasions.update((list) => [...list, ...occasionsToRemove]);
        throw error;
      }
    }
  }

  /**
   * Get an occasion by ID
   */
  getById(id: string): Occasion | undefined {
    return this._occasions().find((o) => o.id === id);
  }

  /**
   * Get occasions for a specific contact
   */
  getByContact(contactId: string): Occasion[] {
    return this._occasions().filter((o) => o.contactId === contactId);
  }

  /**
   * Convert occasions to calendar events for FullCalendar display
   * Generates events for the current year and next year
   *
   * Learning note: This transforms occasions into a format that
   * FullCalendar can understand, handling annual recurrence
   */
  toCalendarEvents(): CalendarEvent[] {
    const occasions = this.occasionsWithContacts();
    const currentYear = this.dateUtils.currentYear();
    const events: CalendarEvent[] = [];

    for (const occasion of occasions) {
      // Generate events for current year and next year
      for (const year of [currentYear, currentYear + 1]) {
        const eventDate = this.getOccurrenceForYear(occasion.date, year);

        // Build event title with contact name if available
        const contactName = occasion.contact
          ? `${occasion.contact.firstName} ${occasion.contact.lastName}`
          : '';
        const title = contactName
          ? `${occasion.title} - ${contactName}`
          : occasion.title;

        const event: CalendarEvent = {
          id: `occasion-${occasion.id}-${year}`,
          title,
          start: this.toDateOnlyIso(eventDate),
          allDay: true,
          repeatAnnually: occasion.repeatAnnually,
          eventType: this.mapOccasionTypeToEventType(occasion.type),
          category: this.mapOccasionTypeToCategory(occasion.type),
          reminderEnabled: occasion.reminderEnabled,
          reminderDaysBefore: occasion.reminderDaysBefore,
          notes: occasion.notes,
          // Add custom properties for occasion identification
          extendedProps: {
            occasionId: occasion.id,
            contactId: occasion.contactId,
            isOccasion: true,
          },
        };

        events.push(event);
      }
    }

    return events;
  }

  /**
   * Calculate the next occurrence of an occasion date
   */
  getNextOccurrence(dateStr: string): Date {
    return this.dateUtils.getNextOccurrence(dateStr);
  }

  /**
   * Get occasion date for a specific year
   */
  private getOccurrenceForYear(dateStr: string, year: number): Date {
    const parsed = this.dateUtils.parseOccasionDate(dateStr);
    if (!parsed) return new Date();
    return this.dateUtils.createDateFromParts(parsed.month, parsed.day, year);
  }

  /**
   * Convert date to ISO date-only string (YYYY-MM-DD)
   */
  private toDateOnlyIso(date: Date): string {
    return this.dateUtils.toDateString(date);
  }

  /**
   * Map occasion type to calendar event type
   */
  private mapOccasionTypeToEventType(
    type: OccasionType
  ): 'birthday' | 'anniversary' | 'memorial' | 'custom' {
    return type;
  }

  /**
   * Map occasion type to calendar event category
   */
  private mapOccasionTypeToCategory(
    type: OccasionType
  ): 'birthday' | 'anniversary' | 'personal' | 'other' {
    switch (type) {
      case 'birthday':
        return 'birthday';
      case 'anniversary':
        return 'anniversary';
      case 'memorial':
        return 'personal';
      case 'custom':
        return 'other';
    }
  }

  /**
   * Calculate age or years for an occasion
   * Returns null if no year is set (year-less birthday)
   */
  calculateYears(occasion: Occasion): number | null {
    return this.dateUtils.yearsSince(occasion.year);
  }

  /**
   * Get a formatted label for the occasion type
   */
  getTypeLabel(type: OccasionType): string {
    const labels: Record<OccasionType, string> = {
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      memorial: 'Memorial',
      custom: 'Custom',
    };
    return labels[type];
  }

  /**
   * Refresh occasions from storage
   * Useful after a full sync with Supabase
   */
  async refresh(): Promise<void> {
    if (this._storageAvailable()) {
      try {
        const occasions = await this.storage.loadOccasions();
        this._occasions.set(occasions);
      } catch (error) {
        console.error('Failed to refresh occasions:', error);
      }
    }
  }
}
