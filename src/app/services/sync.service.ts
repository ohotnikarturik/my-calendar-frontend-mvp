/**
 * Sync Service
 *
 * Learning note: This service handles synchronization between local IndexedDB
 * storage and remote Supabase database. It implements an offline-first strategy:
 * - Data is always saved locally first
 * - Sync happens in the background when online and authenticated
 * - Conflicts are resolved using last-write-wins strategy
 *
 * Key concepts:
 * - Optimistic updates: UI updates immediately, sync happens in background
 * - Conflict resolution: Compare updatedAt timestamps, newer wins
 * - Queue management: Track pending operations for offline scenarios
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StorageService } from './storage.service';
import type { CalendarEvent } from '../types/event.type';
import type { Contact } from '../types/contact.type';
import type { Occasion } from '../types/occasion.type';

/**
 * Sync status for UI feedback
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

/**
 * Pending operation for offline queue
 * Learning note: When offline, we queue operations and replay them when online
 */
export interface PendingOperation {
  id: string;
  type: 'events' | 'contacts' | 'occasions';
  action: 'upsert' | 'delete';
  entityId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  // Inject required services
  private readonly supabase = inject(SupabaseService);
  private readonly storage = inject(StorageService);

  // Sync state signals
  private readonly _status = signal<SyncStatus>('idle');
  private readonly _lastSyncTime = signal<Date | null>(null);
  private readonly _pendingOperations = signal<PendingOperation[]>([]);
  private readonly _syncErrors = signal<string[]>([]);

  // Public readonly signals
  readonly status = this._status.asReadonly();
  readonly lastSyncTime = this._lastSyncTime.asReadonly();
  readonly pendingOperations = this._pendingOperations.asReadonly();
  readonly syncErrors = this._syncErrors.asReadonly();

  // Computed signals
  readonly hasPendingOperations = computed(
    () => this._pendingOperations().length > 0
  );
  readonly pendingCount = computed(() => this._pendingOperations().length);
  readonly canSync = computed(
    () => this.supabase.isAuthenticated() && this.supabase.isOnline()
  );

  // Auto-sync configuration
  private readonly SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private hasPerformedInitialSync = false;

  constructor() {
    // Load pending operations from localStorage
    this.loadPendingOperations();

    // Auto-sync when coming online and authenticated
    // Learning note: effect() runs whenever its dependencies change
    effect(() => {
      const canSync = this.canSync();
      const hasPending = this.hasPendingOperations();

      if (canSync) {
        // Perform initial sync when first authenticated
        if (!this.hasPerformedInitialSync) {
          console.log('Performing initial sync on app start');
          this.hasPerformedInitialSync = true;
          this.syncAll();
        }

        // Start periodic sync when authenticated and online
        this.startPeriodicSync();

        if (hasPending) {
          console.log(
            'Online and authenticated - processing pending operations'
          );
          this.processPendingOperations();
        }
      } else {
        // Stop periodic sync when offline or not authenticated
        this.stopPeriodicSync();

        if (!this.supabase.isOnline()) {
          this._status.set('offline');
        }
      }
    });
  }

  /**
   * Start periodic background sync (every 5 minutes)
   * Learning note: This ensures data stays in sync even without user action
   */
  private startPeriodicSync(): void {
    if (this.syncIntervalTimer) return; // Already running

    console.log('Starting periodic sync (every 5 minutes)');
    this.syncIntervalTimer = setInterval(() => {
      if (this.canSync()) {
        console.log('Periodic sync triggered');
        this.syncAll();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
      console.log('Periodic sync stopped');
    }
  }

  /**
   * Queue a sync after data changes (debounced)
   * Learning note: This method is called by services when data changes.
   * It debounces the sync to avoid excessive API calls when multiple
   * changes happen in quick succession.
   */
  queueSync(): void {
    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // Set new timer
    this.syncDebounceTimer = setTimeout(() => {
      if (this.canSync()) {
        console.log('Debounced sync triggered after data change');
        this.syncAll();
      }
    }, this.SYNC_DEBOUNCE_MS);
  }

  /**
   * Load pending operations from localStorage
   * Learning note: Pending operations survive page reloads
   */
  private loadPendingOperations(): void {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        this._pendingOperations.set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  /**
   * Save pending operations to localStorage
   */
  private savePendingOperations(): void {
    try {
      localStorage.setItem(
        'pendingOperations',
        JSON.stringify(this._pendingOperations())
      );
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  /**
   * Add a pending operation to the queue
   */
  addPendingOperation(
    type: PendingOperation['type'],
    action: PendingOperation['action'],
    entityId: string
  ): void {
    const operation: PendingOperation = {
      id: crypto.randomUUID(),
      type,
      action,
      entityId,
      timestamp: new Date().toISOString(),
    };

    // Remove any existing operation for the same entity
    // Learning note: We only keep the latest operation for each entity
    this._pendingOperations.update((ops) => [
      ...ops.filter((op) => !(op.type === type && op.entityId === entityId)),
      operation,
    ]);

    this.savePendingOperations();
  }

  /**
   * Remove a pending operation after successful sync
   */
  private removePendingOperation(operationId: string): void {
    this._pendingOperations.update((ops) =>
      ops.filter((op) => op.id !== operationId)
    );
    this.savePendingOperations();
  }

  /**
   * Clear all pending operations
   */
  clearPendingOperations(): void {
    this._pendingOperations.set([]);
    this.savePendingOperations();
  }

  // ==================== FULL SYNC ====================

  /**
   * Perform a full sync of all data between local and remote
   * Learning note: This is the main sync method that handles all entity types
   */
  async syncAll(): Promise<boolean> {
    if (!this.canSync()) {
      console.log('Cannot sync: offline or not authenticated');
      this._status.set(this.supabase.isOnline() ? 'idle' : 'offline');
      return false;
    }

    this._status.set('syncing');
    this._syncErrors.set([]);

    try {
      // Sync all entity types in parallel
      const results = await Promise.allSettled([
        this.syncEvents(),
        this.syncContacts(),
        this.syncOccasions(),
      ]);

      // Check for failures
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const errors = failures.map((f) =>
          f.status === 'rejected' ? String(f.reason) : ''
        );
        this._syncErrors.set(errors);
        this._status.set('error');
        console.error('Sync completed with errors:', errors);
        return false;
      }

      this._lastSyncTime.set(new Date());
      this._status.set('success');
      console.log('Sync completed successfully');

      // Reset status to idle after a delay
      setTimeout(() => {
        if (this._status() === 'success') {
          this._status.set('idle');
        }
      }, 3000);

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this._syncErrors.set([String(error)]);
      this._status.set('error');
      return false;
    }
  }

  // ==================== EVENTS SYNC ====================

  /**
   * Sync events between local and remote
   */
  async syncEvents(): Promise<void> {
    console.log('Syncing events...');

    // Load local and remote data
    const [localEvents, remoteEvents] = await Promise.all([
      this.storage.loadEvents(),
      this.supabase.fetchEvents(),
    ]);

    // Merge data with conflict resolution
    const merged = this.mergeData(localEvents, remoteEvents);

    // Save merged data to both local and remote
    await Promise.all([
      this.saveEventsLocally(merged),
      this.supabase.upsertEvents(merged),
    ]);

    console.log(`Events synced: ${merged.length} total`);
  }

  /**
   * Save events to local storage
   */
  private async saveEventsLocally(events: CalendarEvent[]): Promise<void> {
    await this.storage.clearAllEvents();
    for (const event of events) {
      await this.storage.saveEvent(event);
    }
  }

  // ==================== CONTACTS SYNC ====================

  /**
   * Sync contacts between local and remote
   */
  async syncContacts(): Promise<void> {
    console.log('Syncing contacts...');

    const [localContacts, remoteContacts] = await Promise.all([
      this.storage.loadContacts(),
      this.supabase.fetchContacts(),
    ]);

    const merged = this.mergeData(localContacts, remoteContacts);

    await Promise.all([
      this.saveContactsLocally(merged),
      this.supabase.upsertContacts(merged),
    ]);

    console.log(`Contacts synced: ${merged.length} total`);
  }

  /**
   * Save contacts to local storage
   */
  private async saveContactsLocally(contacts: Contact[]): Promise<void> {
    await this.storage.clearAllContacts();
    for (const contact of contacts) {
      await this.storage.saveContact(contact);
    }
  }

  // ==================== OCCASIONS SYNC ====================

  /**
   * Sync occasions between local and remote
   */
  async syncOccasions(): Promise<void> {
    console.log('Syncing occasions...');

    const [localOccasions, remoteOccasions] = await Promise.all([
      this.storage.loadOccasions(),
      this.supabase.fetchOccasions(),
    ]);

    const merged = this.mergeData(localOccasions, remoteOccasions);

    await Promise.all([
      this.saveOccasionsLocally(merged),
      this.supabase.upsertOccasions(merged),
    ]);

    console.log(`Occasions synced: ${merged.length} total`);
  }

  /**
   * Save occasions to local storage
   */
  private async saveOccasionsLocally(occasions: Occasion[]): Promise<void> {
    await this.storage.clearAllOccasions();
    for (const occasion of occasions) {
      await this.storage.saveOccasion(occasion);
    }
  }

  // ==================== MERGE LOGIC ====================

  /**
   * Merge local and remote data using last-write-wins strategy
   * Learning note: This is a simple conflict resolution strategy.
   * For more complex scenarios, you might want field-level merging or manual resolution.
   *
   * @param local - Data from local IndexedDB
   * @param remote - Data from Supabase
   * @returns Merged data array
   */
  private mergeData<T extends { id: string; updatedAt?: string }>(
    local: T[],
    remote: T[]
  ): T[] {
    const merged = new Map<string, T>();

    // Add all local items
    for (const item of local) {
      merged.set(item.id, item);
    }

    // Merge remote items, keeping newer versions
    for (const remoteItem of remote) {
      const localItem = merged.get(remoteItem.id);

      if (!localItem) {
        // Item only exists remotely - add it
        merged.set(remoteItem.id, remoteItem);
      } else {
        // Item exists in both - compare timestamps
        const localTime = new Date(localItem.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();

        if (remoteTime > localTime) {
          // Remote is newer - use remote version
          merged.set(remoteItem.id, remoteItem);
        }
        // Otherwise keep local version (it's newer or same)
      }
    }

    return Array.from(merged.values());
  }

  // ==================== SINGLE ITEM SYNC ====================

  /**
   * Sync a single event to remote (called after local save)
   * Learning note: This is used for real-time sync after CRUD operations
   */
  async syncEvent(event: CalendarEvent): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('events', 'upsert', event.id);
      return false;
    }

    try {
      const success = await this.supabase.upsertEvents([event]);
      if (!success) {
        this.addPendingOperation('events', 'upsert', event.id);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync event:', error);
      this.addPendingOperation('events', 'upsert', event.id);
      return false;
    }
  }

  /**
   * Sync event deletion to remote
   */
  async syncEventDeletion(eventId: string): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('events', 'delete', eventId);
      return false;
    }

    try {
      const success = await this.supabase.deleteEvent(eventId);
      if (!success) {
        this.addPendingOperation('events', 'delete', eventId);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync event deletion:', error);
      this.addPendingOperation('events', 'delete', eventId);
      return false;
    }
  }

  /**
   * Sync a single contact to remote
   */
  async syncContact(contact: Contact): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('contacts', 'upsert', contact.id);
      return false;
    }

    try {
      const success = await this.supabase.upsertContacts([contact]);
      if (!success) {
        this.addPendingOperation('contacts', 'upsert', contact.id);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync contact:', error);
      this.addPendingOperation('contacts', 'upsert', contact.id);
      return false;
    }
  }

  /**
   * Sync contact deletion to remote
   */
  async syncContactDeletion(contactId: string): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('contacts', 'delete', contactId);
      return false;
    }

    try {
      const success = await this.supabase.deleteContact(contactId);
      if (!success) {
        this.addPendingOperation('contacts', 'delete', contactId);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync contact deletion:', error);
      this.addPendingOperation('contacts', 'delete', contactId);
      return false;
    }
  }

  /**
   * Sync a single occasion to remote
   */
  async syncOccasion(occasion: Occasion): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('occasions', 'upsert', occasion.id);
      return false;
    }

    try {
      const success = await this.supabase.upsertOccasions([occasion]);
      if (!success) {
        this.addPendingOperation('occasions', 'upsert', occasion.id);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync occasion:', error);
      this.addPendingOperation('occasions', 'upsert', occasion.id);
      return false;
    }
  }

  /**
   * Sync occasion deletion to remote
   */
  async syncOccasionDeletion(occasionId: string): Promise<boolean> {
    if (!this.canSync()) {
      this.addPendingOperation('occasions', 'delete', occasionId);
      return false;
    }

    try {
      const success = await this.supabase.deleteOccasion(occasionId);
      if (!success) {
        this.addPendingOperation('occasions', 'delete', occasionId);
      }
      return success;
    } catch (error) {
      console.error('Failed to sync occasion deletion:', error);
      this.addPendingOperation('occasions', 'delete', occasionId);
      return false;
    }
  }

  // ==================== PENDING OPERATIONS PROCESSING ====================

  /**
   * Process all pending operations when coming back online
   * Learning note: This replays queued operations in order
   */
  async processPendingOperations(): Promise<void> {
    const operations = this._pendingOperations();
    if (operations.length === 0) return;

    console.log(`Processing ${operations.length} pending operations`);
    this._status.set('syncing');

    for (const operation of operations) {
      try {
        let success = false;

        if (operation.action === 'delete') {
          // Handle deletions
          switch (operation.type) {
            case 'events':
              success = await this.supabase.deleteEvent(operation.entityId);
              break;
            case 'contacts':
              success = await this.supabase.deleteContact(operation.entityId);
              break;
            case 'occasions':
              success = await this.supabase.deleteOccasion(operation.entityId);
              break;
          }
        } else {
          // Handle upserts - need to load the entity first
          switch (operation.type) {
            case 'events': {
              const events = await this.storage.loadEvents();
              const event = events.find((e) => e.id === operation.entityId);
              if (event) {
                success = await this.supabase.upsertEvents([event]);
              } else {
                // Entity no longer exists locally, skip
                success = true;
              }
              break;
            }
            case 'contacts': {
              const contact = await this.storage.getContact(operation.entityId);
              if (contact) {
                success = await this.supabase.upsertContacts([contact]);
              } else {
                success = true;
              }
              break;
            }
            case 'occasions': {
              const occasion = await this.storage.getOccasion(
                operation.entityId
              );
              if (occasion) {
                success = await this.supabase.upsertOccasions([occasion]);
              } else {
                success = true;
              }
              break;
            }
          }
        }

        if (success) {
          this.removePendingOperation(operation.id);
        }
      } catch (error) {
        console.error(
          `Failed to process pending operation ${operation.id}:`,
          error
        );
      }
    }

    this._status.set(
      this._pendingOperations().length > 0 ? 'error' : 'success'
    );
  }
}
