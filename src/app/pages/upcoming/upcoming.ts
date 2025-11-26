import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import type { DateInput } from '@fullcalendar/core';
import { CalendarEventsService } from '../../services/calendar-events.service';
import {
  EventModal,
  type EventModalData,
} from '../../components/event-modal/event-modal';
import type { CalendarEvent, EventCategory } from '../../types/event.type';

@Component({
  selector: 'upcoming',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="upcoming-container">
      <div class="upcoming-header">
        <h1>Upcoming Events</h1>
        <div class="header-controls">
          <mat-form-field appearance="outline">
            <mat-label>Time Range</mat-label>
            <mat-select [value]="selectedRange()" (selectionChange)="selectedRange.set($event.value)">
              <mat-option [value]="7">Next 7 days</mat-option>
              <mat-option [value]="30">Next 30 days</mat-option>
              <mat-option [value]="90">Next 90 days</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [value]="selectedCategory()" (selectionChange)="selectedCategory.set($event.value)">
              <mat-option [value]="''">All Categories</mat-option>
              @for (cat of categoryOptions; track cat.value) {
              <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput [value]="searchQuery()" (input)="searchQuery.set($event.target.value)" placeholder="Search events..." />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </div>

      @if (filteredEvents().length === 0) {
      <div class="empty-state">
        <mat-icon>event_busy</mat-icon>
        <p>No upcoming events found</p>
        <p class="empty-subtitle">Try adjusting your filters or add a new event</p>
        <button mat-raised-button color="primary" (click)="createEvent()">
          <mat-icon>add</mat-icon>
          Create Event
        </button>
      </div>
      } @else {
      <div class="events-grid">
        @for (event of filteredEvents(); track event.id) {
        <mat-card class="event-card" (click)="editEvent(event)">
          <mat-card-header>
            <div class="event-color" [style.background-color]="event.color || '#1976d2'"></div>
            <mat-card-title>{{ event.title }}</mat-card-title>
            <mat-card-subtitle>
              {{ formatDate(event.start) }}
              @if (event.repeatAnnually) {
              <mat-chip>Recurring</mat-chip>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (event.description) {
            <p class="event-description">{{ event.description }}</p>
            }
            @if (event.category) {
            <mat-chip>{{ getCategoryLabel(event.category) }}</mat-chip>
            }
            <div class="days-until">
              <mat-icon>schedule</mat-icon>
              <span>{{ getDaysUntil(event.start) }}</span>
            </div>
          </mat-card-content>
        </mat-card>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .upcoming-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .upcoming-header {
        margin-bottom: 2rem;
      }

      .upcoming-header h1 {
        margin-bottom: 1.5rem;
        font-size: 2rem;
        font-weight: 500;
      }

      .header-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-controls mat-form-field {
        min-width: 200px;
        flex: 1;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1rem;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-subtitle {
        margin-top: 0.5rem;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
      }

      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .event-card {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .event-card mat-card-header {
        position: relative;
        padding-left: 3rem;
      }

      .event-color {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        border-radius: 4px 0 0 4px;
      }

      .event-description {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
        margin: 0.5rem 0;
      }

      .days-until {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        color: var(--mat-sys-primary);
        font-weight: 500;
      }

      @media (max-width: 768px) {
        .upcoming-container {
          padding: 1rem;
        }

        .header-controls {
          flex-direction: column;
        }

        .header-controls mat-form-field {
          width: 100%;
        }

        .events-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class Upcoming {
  private readonly eventsSvc = inject(CalendarEventsService);
  private readonly dialog = inject(MatDialog);

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
    const today = this.startOfDay(new Date());
    const range = this.selectedRange();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + range);

    return events
      .map((event) => {
        const eventDate = this.parseDate(event.start);
        if (!eventDate) return null;

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

          if (currentYearDate >= today && currentYearDate <= endDate) {
            return { ...event, start: this.formatDate(currentYearDate) };
          }
        } else {
          // Non-recurring event
          if (eventDate >= today && eventDate <= endDate) {
            return event;
          }
        }

        return null;
      })
      .filter((e): e is CalendarEvent => e !== null)
      .sort((a, b) => {
        const dateA = this.parseDate(a.start) || new Date();
        const dateB = this.parseDate(b.start) || new Date();
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

  formatDate(dateStr: string | DateInput | undefined): string {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getDaysUntil(dateStr: string | DateInput | undefined): string {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';

    const today = this.startOfDay(new Date());
    const eventDate = this.startOfDay(date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
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
}

