import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { CalendarEvent } from '../types/event.type';
import type { Contact } from '../types/contact.type';
import type { Occasion } from '../types/occasion.type';

/**
 * Dexie Database Configuration
 *
 * Learning note: Dexie is a wrapper around IndexedDB that provides
 * a more developer-friendly API. Tables are defined with indexed fields
 * for efficient querying.
 *
 * Version history:
 * - v1: Initial events table
 * - v2: Added contacts table
 * - v3: Added occasions table
 */

interface EventsTable extends Table<CalendarEvent> {
  // Dexie table definition for calendar events
}

interface ContactsTable extends Table<Contact> {
  // Dexie table definition for contacts
}

interface OccasionsTable extends Table<Occasion> {
  // Dexie table definition for occasions
}

class CalendarDatabase extends Dexie {
  events!: EventsTable;
  contacts!: ContactsTable;
  occasions!: OccasionsTable;

  constructor() {
    super('CalendarDatabase');

    // Version 1: Initial events table
    this.version(1).stores({
      events: 'id, start, repeatAnnually, eventType, category',
    });

    // Version 2: Add contacts table
    // Learning note: Dexie handles schema migrations automatically
    // when you increment the version and define new stores
    this.version(2).stores({
      events: 'id, start, repeatAnnually, eventType, category',
      contacts: 'id, firstName, lastName, email',
    });

    // Version 3: Add occasions table
    // Occasions are linked to contacts and can generate recurring events
    this.version(3).stores({
      events: 'id, start, repeatAnnually, eventType, category',
      contacts: 'id, firstName, lastName, email',
      occasions: 'id, contactId, type, date, repeatAnnually',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly db = new CalendarDatabase();

  async saveEvent(event: CalendarEvent): Promise<void> {
    try {
      await this.db.events.put(event);
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }

  async loadEvents(): Promise<CalendarEvent[]> {
    try {
      return await this.db.events.toArray();
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.db.events.delete(id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  async updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<void> {
    try {
      const event = await this.db.events.get(id);
      if (event) {
        await this.db.events.put({ ...event, ...patch });
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async clearAllEvents(): Promise<void> {
    try {
      await this.db.events.clear();
    } catch (error) {
      console.error('Failed to clear events:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.db.open();
      return true;
    } catch {
      return false;
    }
  }

  // ==================== CONTACTS METHODS ====================
  // Learning note: These methods follow the same pattern as events
  // but operate on the contacts table

  /**
   * Save a new contact to IndexedDB
   */
  async saveContact(contact: Contact): Promise<void> {
    try {
      await this.db.contacts.put(contact);
    } catch (error) {
      console.error('Failed to save contact:', error);
      throw error;
    }
  }

  /**
   * Load all contacts from IndexedDB
   */
  async loadContacts(): Promise<Contact[]> {
    try {
      return await this.db.contacts.toArray();
    } catch (error) {
      console.error('Failed to load contacts:', error);
      return [];
    }
  }

  /**
   * Delete a contact by ID
   */
  async deleteContact(id: string): Promise<void> {
    try {
      await this.db.contacts.delete(id);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, patch: Partial<Contact>): Promise<void> {
    try {
      const contact = await this.db.contacts.get(id);
      if (contact) {
        await this.db.contacts.put({ ...contact, ...patch });
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<Contact | undefined> {
    try {
      return await this.db.contacts.get(id);
    } catch (error) {
      console.error('Failed to get contact:', error);
      return undefined;
    }
  }

  /**
   * Clear all contacts from storage
   */
  async clearAllContacts(): Promise<void> {
    try {
      await this.db.contacts.clear();
    } catch (error) {
      console.error('Failed to clear contacts:', error);
      throw error;
    }
  }

  // ==================== OCCASIONS METHODS ====================
  // Learning note: Occasions are linked to contacts and represent
  // recurring dates like birthdays and anniversaries

  /**
   * Save a new occasion to IndexedDB
   */
  async saveOccasion(occasion: Occasion): Promise<void> {
    try {
      await this.db.occasions.put(occasion);
    } catch (error) {
      console.error('Failed to save occasion:', error);
      throw error;
    }
  }

  /**
   * Load all occasions from IndexedDB
   */
  async loadOccasions(): Promise<Occasion[]> {
    try {
      return await this.db.occasions.toArray();
    } catch (error) {
      console.error('Failed to load occasions:', error);
      return [];
    }
  }

  /**
   * Load occasions for a specific contact
   */
  async loadOccasionsByContact(contactId: string): Promise<Occasion[]> {
    try {
      return await this.db.occasions
        .where('contactId')
        .equals(contactId)
        .toArray();
    } catch (error) {
      console.error('Failed to load occasions by contact:', error);
      return [];
    }
  }

  /**
   * Delete an occasion by ID
   */
  async deleteOccasion(id: string): Promise<void> {
    try {
      await this.db.occasions.delete(id);
    } catch (error) {
      console.error('Failed to delete occasion:', error);
      throw error;
    }
  }

  /**
   * Delete all occasions for a contact (used when deleting a contact)
   */
  async deleteOccasionsByContact(contactId: string): Promise<void> {
    try {
      await this.db.occasions.where('contactId').equals(contactId).delete();
    } catch (error) {
      console.error('Failed to delete occasions by contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing occasion
   */
  async updateOccasion(id: string, patch: Partial<Occasion>): Promise<void> {
    try {
      const occasion = await this.db.occasions.get(id);
      if (occasion) {
        await this.db.occasions.put({ ...occasion, ...patch });
      }
    } catch (error) {
      console.error('Failed to update occasion:', error);
      throw error;
    }
  }

  /**
   * Get a single occasion by ID
   */
  async getOccasion(id: string): Promise<Occasion | undefined> {
    try {
      return await this.db.occasions.get(id);
    } catch (error) {
      console.error('Failed to get occasion:', error);
      return undefined;
    }
  }

  /**
   * Clear all occasions from storage
   */
  async clearAllOccasions(): Promise<void> {
    try {
      await this.db.occasions.clear();
    } catch (error) {
      console.error('Failed to clear occasions:', error);
      throw error;
    }
  }
}
