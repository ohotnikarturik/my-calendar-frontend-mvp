import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { CalendarEvent } from '../types/event.type';

interface EventsTable extends Table<CalendarEvent> {
  // Dexie table definition
}

class CalendarDatabase extends Dexie {
  events!: EventsTable;

  constructor() {
    super('CalendarDatabase');
    this.version(1).stores({
      events: 'id, start, repeatAnnually, eventType, category',
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
}
