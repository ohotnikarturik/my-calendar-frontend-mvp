/**
 * Contacts Service
 *
 * Manages the contacts state and CRUD operations.
 * Follows the same signal-based pattern as CalendarEventsService.
 *
 * Learning note: This service demonstrates the Angular service pattern
 * with signals for reactive state management. The service acts as
 * a single source of truth for contacts data across the application.
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import type { Contact, NewContact } from '../types/contact.type';
import { StorageService } from './storage.service';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  // Inject the storage service for IndexedDB persistence
  private readonly storage = inject(StorageService);
  // Inject SyncService for background sync with Supabase
  private readonly syncService = inject(SyncService);

  // Private signals for internal state management
  // Learning note: Using private signals with public readonly accessors
  // ensures state can only be modified through service methods
  private readonly _contacts = signal<Contact[]>([]);
  private readonly _loading = signal(true);
  private readonly _storageAvailable = signal(true);

  // Public readonly signals for components to consume
  readonly contacts = this._contacts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly storageAvailable = this._storageAvailable.asReadonly();

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
    // Initialize contacts from storage on service creation
    this.initialize();
  }

  /**
   * Initialize contacts from IndexedDB storage
   * Called automatically when service is created
   */
  private async initialize(): Promise<void> {
    try {
      const available = await this.storage.isAvailable();
      this._storageAvailable.set(available);

      if (available) {
        const contacts = await this.storage.loadContacts();
        this._contacts.set(contacts);
      }
    } catch (error) {
      console.error('Failed to initialize contacts:', error);
      this._storageAvailable.set(false);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add a new contact
   * Uses optimistic updates - updates UI immediately, then persists to storage
   *
   * @param contactData - New contact data (without id, createdAt, updatedAt)
   * @returns The created contact with generated id and timestamps
   */
  async add(contactData: NewContact): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...contactData,
      id: crypto.randomUUID(), // Generate unique ID using Web Crypto API
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update - add to local state immediately
    this._contacts.update((list) => [...list, contact]);

    if (this._storageAvailable()) {
      try {
        await this.storage.saveContact(contact);
        // Sync to Supabase in background (non-blocking)
        this.syncService.syncContact(contact);
      } catch (error) {
        console.error('Failed to save contact:', error);
        // Revert optimistic update on error
        this._contacts.update((list) =>
          list.filter((c) => c.id !== contact.id)
        );
        throw error;
      }
    }

    return contact;
  }

  /**
   * Update an existing contact
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

    const updatedPatch = {
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    this._contacts.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...updatedPatch } : c))
    );

    if (this._storageAvailable()) {
      try {
        await this.storage.updateContact(id, updatedPatch);
        // Sync to Supabase in background
        const updatedContact = this._contacts().find((c) => c.id === id);
        if (updatedContact) {
          this.syncService.syncContact(updatedContact);
        }
      } catch (error) {
        console.error('Failed to update contact:', error);
        // Revert on error
        this._contacts.update((list) =>
          list.map((c) => (c.id === id ? currentContact : c))
        );
        throw error;
      }
    }
  }

  /**
   * Remove a contact by ID
   *
   * @param id - Contact ID to delete
   */
  async remove(id: string): Promise<void> {
    const contactToRemove = this._contacts().find((c) => c.id === id);
    if (!contactToRemove) return;

    // Optimistic update
    this._contacts.update((list) => list.filter((c) => c.id !== id));

    if (this._storageAvailable()) {
      try {
        await this.storage.deleteContact(id);
        // Sync deletion to Supabase in background
        this.syncService.syncContactDeletion(id);
      } catch (error) {
        console.error('Failed to delete contact:', error);
        // Revert on error
        this._contacts.update((list) => [...list, contactToRemove]);
        throw error;
      }
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

  /**
   * Refresh contacts from storage
   * Useful after a full sync with Supabase
   */
  async refresh(): Promise<void> {
    if (this._storageAvailable()) {
      try {
        const contacts = await this.storage.loadContacts();
        this._contacts.set(contacts);
      } catch (error) {
        console.error('Failed to refresh contacts:', error);
      }
    }
  }
}
