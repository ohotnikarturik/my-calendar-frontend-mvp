import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import type { DateInput } from '@fullcalendar/core';
import { CalendarEventsService } from '../../services/calendar-events.service';
import { DateUtilsService } from '../../services/date-utils.service';
import {
  EventModal,
  type EventModalData,
} from '../../components/event-modal/event-modal';
import { PageHeader } from '../../components/page-header/page-header';
import { EmptyState } from '../../components/empty-state/empty-state';
import type { CalendarEvent, EventCategory } from '../../types/event.type';

@Component({
  selector: 'upcoming',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
  ],
  templateUrl: './upcoming.html',
  styleUrl: './upcoming.scss',
})
export class Upcoming {
  readonly eventsSvc = inject(CalendarEventsService);
  private readonly dialog = inject(MatDialog);
  private readonly dateUtils = inject(DateUtilsService);

  readonly selectedRange = signal<number>(30);
  readonly selectedCategory = signal<string>('');
  readonly searchQuery = signal<string>('');

  readonly categoryOptions: { value: EventCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'other', label: 'Other' },
  ];

  readonly upcomingEvents = computed(() => {
    const events = this.eventsSvc.events();
    const today = this.dateUtils.today();
    const range = this.selectedRange();
    const endDate = this.dateUtils.addDays(today, range);

    return events
      .map((event) => {
        // Cast start to compatible type (FullCalendar's DateInput includes number[] which we don't use)
        const eventDate = this.dateUtils.parseDate(
          event.start as string | Date | undefined
        );
        if (!eventDate) return null;

        // Handle recurring events
        if (event.repeatAnnually) {
          const currentYear = this.dateUtils.currentYear();
          const eventMonth = eventDate.getMonth();
          const eventDay = eventDate.getDate();

          // Check current year's occurrence
          let currentYearDate = this.dateUtils.createDateFromParts(
            eventMonth + 1,
            eventDay,
            currentYear
          );
          if (currentYearDate < today) {
            // If it's passed this year, check next year
            currentYearDate = this.dateUtils.createDateFromParts(
              eventMonth + 1,
              eventDay,
              currentYear + 1
            );
          }

          if (this.dateUtils.isWithinRange(currentYearDate, today, endDate)) {
            return {
              ...event,
              start: this.dateUtils.toDateString(currentYearDate),
            };
          }
        } else {
          // Non-recurring event
          if (this.dateUtils.isWithinRange(eventDate, today, endDate)) {
            return event;
          }
        }

        return null;
      })
      .filter((e): e is CalendarEvent => e !== null)
      .sort((a, b) => {
        // Cast start to compatible type (FullCalendar's DateInput includes number[] which we don't use)
        const dateA =
          this.dateUtils.parseDate(a.start as string | Date | undefined) ||
          new Date();
        const dateB =
          this.dateUtils.parseDate(b.start as string | Date | undefined) ||
          new Date();
        return dateA.getTime() - dateB.getTime();
      });
  });

  readonly filteredEvents = computed(() => {
    let events = this.upcomingEvents();
    const category = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();

    if (category) {
      events = events.filter((e) => e.category === category);
    }

    if (query) {
      events = events.filter(
        (e) =>
          e.title?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.notes?.toLowerCase().includes(query)
      );
    }

    return events;
  });

  readonly hasAnyUpcomingEvents = computed(
    () => this.upcomingEvents().length > 0
  );
  readonly isFiltering = computed(() => {
    return this.selectedCategory() !== '' || this.searchQuery().trim() !== '';
  });
  readonly hasNoResults = computed(() => {
    return (
      this.hasAnyUpcomingEvents() &&
      this.isFiltering() &&
      this.filteredEvents().length === 0
    );
  });

  formatDate(dateStr: string | DateInput | undefined): string {
    if (!dateStr) return '';
    return this.dateUtils.formatShort(dateStr as string | Date | number);
  }

  getDaysUntil(dateStr: string | DateInput | undefined): string {
    if (!dateStr) return '';
    return this.dateUtils.daysUntilText(dateStr as string | Date | number);
  }

  getCategoryLabel(category: EventCategory): string {
    const option = this.categoryOptions.find((opt) => opt.value === category);
    return option?.label || category;
  }

  editEvent(event: CalendarEvent): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        event: event,
        isEdit: true,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        await this.eventsSvc.update(result.event.id, result.event);
      } else if (result?.action === 'delete') {
        await this.eventsSvc.remove(result.eventId);
      }
    });
  }

  createEvent(): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        isEdit: false,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        await this.eventsSvc.add(result.event);
      }
    });
  }
}
