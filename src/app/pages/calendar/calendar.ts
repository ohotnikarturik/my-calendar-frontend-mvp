import {
  Component,
  effect,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Calendar as FullCalendar,
  type CalendarOptions,
  type DateSelectArg,
  type EventClickArg,
  type EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { CalendarEventsService } from '../../services/calendar-events.service';
import { OccasionsService } from '../../services/occasions.service';
import { RemindersService } from '../../services/reminders.service';
import {
  EventModal,
  type EventModalData,
} from '../../components/event-modal/event-modal';
import { PageHeader } from '../../components/page-header/page-header';
import { EmptyState } from '../../components/empty-state/empty-state';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
  ],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class Calendar implements AfterViewInit, OnDestroy {
  private calendar?: FullCalendar;
  readonly eventsSvc = inject(CalendarEventsService);
  private readonly occasionsSvc = inject(OccasionsService);
  private readonly remindersSvc = inject(RemindersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private cleanupEffect = effect(() => {
    // Track both events and occasions to trigger effect when either changes
    this.eventsSvc.events();
    this.occasionsSvc.occasions();
    if (!this.calendar) {
      // If calendar not initialized yet, try to initialize it
      setTimeout(() => {
        if (!this.calendar) {
          this.initializeCalendar();
        } else {
          this.updateCalendarEvents();
        }
      }, 0);
      return;
    }

    this.updateCalendarEvents();
  });

  constructor() {
    // Events will be loaded from IndexedDB automatically
    // Show reminders after a short delay to allow events to load
    setTimeout(() => this.checkReminders(), 1000);
  }

  private checkReminders(): void {
    const todayReminders = this.remindersSvc.todayReminders();
    if (todayReminders.length > 0) {
      const unshownReminders = todayReminders.filter(
        (r) => !this.remindersSvc.isReminderShown(r)
      );

      if (unshownReminders.length > 0) {
        const count = unshownReminders.length;
        const message =
          count === 1
            ? `Reminder: ${unshownReminders[0].eventTitle} is today!`
            : `You have ${count} events today!`;

        this.snackBar.open(message, 'View', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });

        // Mark reminders as shown
        unshownReminders.forEach((r) => this.remindersSvc.markReminderShown(r));
      }
    }
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the DOM is fully ready
    setTimeout(() => {
      this.initializeCalendar();
    }, 0);
  }

  private initializeCalendar(): void {
    const host = document.querySelector('.calendar-host');
    if (!host) {
      // Retry if element not found yet
      setTimeout(() => this.initializeCalendar(), 100);
      return;
    }

    if (this.calendar) {
      // Already initialized
      return;
    }

    // Initialize FullCalendar with plugins and options
    this.calendar = new FullCalendar(host as HTMLElement, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      },
      initialView: 'dayGridMonth',
      navLinks: true,
      editable: true,
      selectable: true,
      dayMaxEvents: true,
      events: this.eventsSvc.events(),

      // Event interaction handlers
      select: (info) => this.onDateSelect(info),
      eventClick: (info) => this.onEventClick(info),
      eventDrop: (info) => this.onEventDrop(info),
      eventResize: (info) => this.onEventResize(info),
    } satisfies CalendarOptions);

    this.calendar.render();

    // Manually trigger the effect to populate initial events
    this.updateCalendarEvents();
  }

  private updateCalendarEvents(): void {
    if (!this.calendar) return;

    // Get regular calendar events
    const events = this.eventsSvc.events();

    // Get occasions converted to calendar events
    // Learning note: Occasions are converted to calendar event format
    // so FullCalendar can display them alongside regular events
    const occasionEvents = this.occasionsSvc.toCalendarEvents();

    this.calendar.removeAllEvents();

    // Add regular events
    events.forEach((event) => {
      const category = event.category || 'custom';
      const fcEvent = {
        ...event,
        backgroundColor: event.color || this.getDefaultColor(category),
        borderColor: event.color || this.getDefaultColor(category),
      };
      this.calendar?.addEvent(fcEvent);
    });

    // Add occasion events with distinct styling
    occasionEvents.forEach((event) => {
      const category = event.category || 'custom';
      const fcEvent = {
        ...event,
        backgroundColor: event.color || this.getDefaultColor(category),
        borderColor: event.color || this.getDefaultColor(category),
        // Mark as non-editable since occasions are managed separately
        editable: false,
      };
      this.calendar?.addEvent(fcEvent);
    });
  }

  onDateSelect(selectInfo: DateSelectArg): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        date: selectInfo.startStr,
        isEdit: false,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        try {
          await this.eventsSvc.add(result.event);
          // Success notification shown by service
        } catch (error) {
          console.error('Failed to create event:', error);
          // Error notification shown by service
        }
      }
      this.calendar?.unselect();
    });
  }

  onEventClick(clickInfo: EventClickArg): void {
    const event = this.eventsSvc
      .events()
      .find((e) => e.id === clickInfo.event.id);
    if (!event) return;

    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        event: event,
        isEdit: true,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        try {
          await this.eventsSvc.update(result.event.id, result.event);
          // Success notification shown by service
        } catch (error) {
          console.error('Failed to update event:', error);
          // Error notification shown by service
        }
      } else if (result?.action === 'delete') {
        try {
          await this.eventsSvc.remove(result.eventId);
          // Success notification shown by service
        } catch (error) {
          console.error('Failed to delete event:', error);
          // Error notification shown by service
        }
      }
    });
  }

  onEventDrop(dropInfo: EventDropArg): void {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    this.eventsSvc
      .update(eventId, {
        start: newStart?.toISOString(),
        end: newEnd?.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then(() => {
        // Success notification shown by service
      })
      .catch((error) => {
        console.error('Failed to update event:', error);
        // Error notification shown by service
        // Revert the drag
        dropInfo.revert();
      });
  }

  onEventResize(
    resizeInfo: EventDropArg | { event: { id: string; end: Date | null } }
  ): void {
    const eventId = resizeInfo.event.id;
    const newEnd = resizeInfo.event.end;

    this.eventsSvc
      .update(eventId, {
        end: newEnd?.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then(() => {
        // Success notification shown by service
      })
      .catch((error) => {
        console.error('Failed to resize event:', error);
        // Error notification shown by service
      });
  }

  createNewEvent(): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        isEdit: false,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        try {
          await this.eventsSvc.add(result.event);
          this.showMessage('Event created successfully');
        } catch (error) {
          console.error('Failed to create event:', error);
          this.showMessage('Failed to create event. Please try again.', true);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
    this.calendar?.destroy();
  }

  /**
   * Show a snackbar message to the user
   * Learning note: Using a helper method for consistent snackbar styling
   */
  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: isError ? 5000 : 3000,
      panelClass: isError ? ['error-snackbar'] : [],
    });
  }

  private getDefaultColor(category: string): string {
    // Consistent color palette using Material Design colors
    // Optimized for accessibility and visual distinction
    const colorMap: Record<string, string> = {
      birthday: '#E91E63', // Pink - warm and celebratory
      anniversary: '#9C27B0', // Purple - special occasions
      holiday: '#FF9800', // Orange - festive
      personal: '#4CAF50', // Green - personal growth
      work: '#2196F3', // Blue - professional
      memorial: '#757575', // Gray - respectful
      other: '#00BCD4', // Cyan - miscellaneous
      custom: '#1976D2', // Default blue
    };
    return colorMap[category] || '#1976D2';
  }
}
