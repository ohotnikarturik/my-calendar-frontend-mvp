import { Injectable, computed, signal, inject } from '@angular/core';
import type { DateInput } from '@fullcalendar/core';
import type { CalendarEvent } from '../types/event.type';
import { CalendarEventsService } from './calendar-events.service';

export interface Reminder {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  daysUntil: number;
  reminderDay: number;
}

@Injectable({ providedIn: 'root' })
export class RemindersService {
  private readonly eventsSvc = inject(CalendarEventsService);
  private readonly _shownReminders = signal<Set<string>>(new Set());

  readonly reminders = computed(() => {
    const events = this.eventsSvc.events();
    const today = this.startOfDay(new Date());
    const reminders: Reminder[] = [];

    for (const event of events) {
      if (!event.reminderEnabled || !event.reminderDaysBefore?.length) {
        continue;
      }

      const eventDate = this.parseDate(event.start);
      if (!eventDate) continue;

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

        this.addRemindersForEvent(
          event,
          currentYearDate,
          today,
          reminders
        );
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
    const targetDate = this.startOfDay(date);
    const today = this.startOfDay(new Date());
    const daysDiff = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return this.reminders().filter((r) => r.daysUntil === daysDiff);
  }

  private addRemindersForEvent(
    event: CalendarEvent,
    eventDate: Date,
    today: Date,
    reminders: Reminder[]
  ): void {
    const daysUntil = Math.floor(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const reminderDay of event.reminderDaysBefore || []) {
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDay);

      if (reminderDate <= today && eventDate >= today) {
        const reminder: Reminder = {
          eventId: event.id,
          eventTitle: event.title || 'Untitled Event',
          eventDate: this.formatDate(eventDate),
          daysUntil: daysUntil,
          reminderDay: reminderDay,
        };

        reminders.push(reminder);
      }
    }
  }

  private parseDate(date: DateInput | undefined): Date | null {
    if (!date) return null;

    if (date instanceof Date) {
      return this.startOfDay(date);
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : this.startOfDay(parsed);
    }

    return null;
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
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

