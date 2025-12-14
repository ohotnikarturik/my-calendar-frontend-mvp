import { Injectable, computed, signal, inject } from '@angular/core';
import type { CalendarEvent } from '../types/event.type';
import { CalendarEventsService } from './calendar-events.service';
import { DateUtilsService } from './date-utils.service';

export interface Reminder {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  daysUntil: number;
  reminderDay: number;
}

/**
 * Reminders Service
 *
 * Learning note: This service computes reminders based on events and their
 * reminder settings. It uses computed signals to automatically recalculate
 * when the events change.
 */
@Injectable({ providedIn: 'root' })
export class RemindersService {
  private readonly eventsSvc = inject(CalendarEventsService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly _shownReminders = signal<Set<string>>(new Set());

  readonly reminders = computed(() => {
    const events = this.eventsSvc.events();
    const today = this.dateUtils.today();
    const reminders: Reminder[] = [];

    for (const event of events) {
      if (!event.reminderEnabled || !event.reminderDaysBefore?.length) {
        continue;
      }

      // Use DateUtilsService for consistent date parsing
      const eventDate = this.dateUtils.startOfDay(
        this.dateUtils.parseDateInput(event.start as string | Date | undefined)
      );

      // Handle recurring events
      if (event.repeatAnnually) {
        const currentYear = today.getFullYear();
        const eventMonth = eventDate.getMonth();
        const eventDay = eventDate.getDate();

        // Check current year's occurrence
        let currentYearDate = new Date(currentYear, eventMonth, eventDay);
        if (currentYearDate < today) {
          // If it's passed this year, check next year
          currentYearDate = new Date(currentYear + 1, eventMonth, eventDay);
        }

        this.addRemindersForEvent(event, currentYearDate, today, reminders);
      } else {
        // Non-recurring event
        if (eventDate >= today) {
          this.addRemindersForEvent(event, eventDate, today, reminders);
        }
      }
    }

    return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
  });

  readonly upcomingReminders = computed(() => {
    return this.reminders().filter((r) => r.daysUntil >= 0 && r.daysUntil <= 7);
  });

  readonly todayReminders = computed(() => {
    return this.reminders().filter((r) => r.daysUntil === 0);
  });

  constructor() {
    // Load shown reminders from localStorage
    this.loadShownReminders();
  }

  markReminderShown(reminder: Reminder): void {
    const key = this.getReminderKey(reminder);
    const shown = new Set(this._shownReminders());
    shown.add(key);
    this._shownReminders.set(shown);
    this.saveShownReminders();
  }

  isReminderShown(reminder: Reminder): boolean {
    const key = this.getReminderKey(reminder);
    return this._shownReminders().has(key);
  }

  getRemindersForDate(date: Date): Reminder[] {
    const targetDate = this.dateUtils.startOfDay(date);
    const today = this.dateUtils.today();
    const daysDiff = this.dateUtils.daysBetween(today, targetDate);

    return this.reminders().filter((r) => r.daysUntil === daysDiff);
  }

  private addRemindersForEvent(
    event: CalendarEvent,
    eventDate: Date,
    today: Date,
    reminders: Reminder[]
  ): void {
    const daysUntil = this.dateUtils.daysBetween(today, eventDate);

    for (const reminderDay of event.reminderDaysBefore || []) {
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDay);

      if (reminderDate <= today && eventDate >= today) {
        const reminder: Reminder = {
          eventId: event.id,
          eventTitle: event.title || 'Untitled Event',
          // Use DateUtilsService for consistent date formatting
          eventDate: this.dateUtils.toDateString(eventDate),
          daysUntil: daysUntil,
          reminderDay: reminderDay,
        };

        reminders.push(reminder);
      }
    }
  }

  private getReminderKey(reminder: Reminder): string {
    return `${reminder.eventId}-${reminder.reminderDay}-${reminder.eventDate}`;
  }

  private loadShownReminders(): void {
    try {
      const stored = localStorage.getItem('shownReminders');
      if (stored) {
        const array = JSON.parse(stored) as string[];
        this._shownReminders.set(new Set(array));
      }
    } catch (error) {
      console.error('Failed to load shown reminders:', error);
    }
  }

  private saveShownReminders(): void {
    try {
      const array = Array.from(this._shownReminders());
      localStorage.setItem('shownReminders', JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save shown reminders:', error);
    }
  }
}
