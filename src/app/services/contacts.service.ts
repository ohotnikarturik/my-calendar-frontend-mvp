/**
 * Contacts Service
 *
 * Manages the contacts state and CRUD operations with direct Supabase integration.
 * Follows the same signal-based pattern as CalendarEventsService.
 *
 * Learning note: This service demonstrates the Angular service pattern
 * with signals for reactive state management. The service acts as
 * a single source of truth for contacts data across the application.
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import type { Contact, NewContact } from '../types/contact.type';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly supabase = inject(SupabaseService);
  private readonly notificationSvc = inject(NotificationService);

  // Private signals for internal state management
  // Learning note: Using private signals with public readonly accessors
  // ensures state can only be modified through service methods
  private readonly _contacts = signal<Contact[]>([]);
  private readonly _loading = signal(true);

  // Public readonly signals for components to consume
  readonly contacts = this._contacts.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed signal for contact count
  // Learning note: computed() creates a derived signal that automatically
  // updates when its dependencies change
  readonly contactCount = computed(() => this._contacts().length);

  // Computed signal for sorted contacts (alphabetically by last name, then first name)
  readonly sortedContacts = computed(() => {
    return [...this._contacts()].sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });
  });

  constructor() {
    this.initialize();
  }

  /**
   * Initialize by loading contacts from Supabase
   * Automatically called on service creation
   */
  private async initialize(): Promise<void> {
    try {
      if (this.supabase.isAuthenticated()) {
        const contacts = await this.supabase.fetchContacts();
        this._contacts.set(contacts);
      }
    } catch (error) {
      console.error('Failed to initialize contacts:', error);
      this.notificationSvc.error('Failed to load contacts. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reload contacts from Supabase
   * Useful after login or to refresh data
   */
  async reload(): Promise<void> {
    this._loading.set(true);
    try {
      const contacts = await this.supabase.fetchContacts();
      this._contacts.set(contacts);
    } catch (error) {
      console.error('Failed to reload contacts:', error);
      this.notificationSvc.errorWithRetry(
        'Failed to load contacts',
        () => this.reload()
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a new contact
   * Uses optimistic updates - updates UI immediately, reverts on error
   *
   * @param contactData - New contact data (without id, createdAt, updatedAt)
   * @returns The created contact with generated id and timestamps
   */
  async add(contactData: NewContact): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...contactData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    this._contacts.update((list) => [...list, contact]);

    try {
      const success = await this.supabase.upsertContacts([contact]);
      if (!success) {
        throw new Error('Failed to save contact to Supabase');
      }
      this.notificationSvc.success('Contact created successfully');
    } catch (error) {
      console.error('Failed to add contact:', error);
      // Revert on error
      this._contacts.update((list) => list.filter((c) => c.id !== contact.id));
      this.notificationSvc.error('Failed to create contact. Please try again.');
      throw error;
    }

    return contact;
  }

  /**
   * Update an existing contact
   * Uses optimistic updates - UI updates immediately, reverts on error
   *
   * @param id - Contact ID to update
   * @param patch - Partial contact data to merge
   */
  async update(
    id: string,
    patch: Partial<Omit<Contact, 'id' | 'createdAt'>>
  ): Promise<void> {
    const currentContact = this._contacts().find((c) => c.id === id);
    if (!currentContact) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const updatedContact = {
      ...currentContact,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    this._contacts.update((list) =>
      list.map((c) => (c.id === id ? updatedContact : c))
    );

    try {
      const success = await this.supabase.upsertContacts([updatedContact]);
      if (!success) {
        throw new Error('Failed to update contact in Supabase');
      }
      this.notificationSvc.success('Contact updated successfully');
    } catch (error) {
      console.error('Failed to update contact:', error);
      // Revert on error
      this._contacts.update((list) =>
        list.map((c) => (c.id === id ? currentContact : c))
      );
      this.notificationSvc.error('Failed to update contact. Please try again.');
      throw error;
    }
  }

  /**
   * Remove a contact by ID
   * Uses optimistic updates - UI updates immediately, reverts on error
   *
   * @param id - Contact ID to delete
   */
  async remove(id: string): Promise<void> {
    const contactToRemove = this._contacts().find((c) => c.id === id);
    if (!contactToRemove) return;

    // Optimistic update
    this._contacts.update((list) => list.filter((c) => c.id !== id));

    try {
      const success = await this.supabase.deleteContact(id);
      if (!success) {
        throw new Error('Failed to delete contact from Supabase');
      }
      this.notificationSvc.success('Contact deleted successfully');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      // Revert on error
      this._contacts.update((list) => [...list, contactToRemove]);
      this.notificationSvc.error('Failed to delete contact. Please try again.');
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   *
   * @param id - Contact ID to find
   * @returns Contact or undefined if not found
   */
  getById(id: string): Contact | undefined {
    return this._contacts().find((c) => c.id === id);
  }

  /**
   * Search contacts by name (first or last)
   *
   * @param query - Search query string
   * @returns Filtered contacts matching the query
   */
  search(query: string): Contact[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return this._contacts();

    return this._contacts().filter((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      return fullName.includes(lowerQuery);
    });
  }

  /**
   * Get contact's full name
   * Utility method for display purposes
   */
  getFullName(contact: Contact): string {
    return `${contact.firstName} ${contact.lastName}`.trim();
  }
}
