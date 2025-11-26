import {
  Component,
  effect,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { RemindersService } from '../../services/reminders.service';
import {
  EventModal,
  type EventModalData,
} from '../../components/event-modal/event-modal';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class Calendar implements AfterViewInit, OnDestroy {
  private calendar?: FullCalendar;
  readonly eventsSvc = inject(CalendarEventsService);
  private readonly remindersSvc = inject(RemindersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private cleanupEffect = effect(() => {
    // Track events to trigger effect when they change
    this.eventsSvc.events();
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

    const events = this.eventsSvc.events();
    this.calendar.removeAllEvents();
    events.forEach((event) => {
      const categoryOrType = event.category || event.eventType || 'custom';
      const fcEvent = {
        ...event,
        backgroundColor: event.color || this.getDefaultColor(categoryOrType),
        borderColor: event.color || this.getDefaultColor(categoryOrType),
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
        await this.eventsSvc.add(result.event);
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
        await this.eventsSvc.update(result.event.id, result.event);
      } else if (result?.action === 'delete') {
        await this.eventsSvc.remove(result.eventId);
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
      .catch((error) => {
        console.error('Failed to update event:', error);
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
      .catch((error) => {
        console.error('Failed to update event:', error);
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
        await this.eventsSvc.add(result.event);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
    this.calendar?.destroy();
  }

  private getDefaultColor(category: string): string {
    const colorMap: Record<string, string> = {
      birthday: '#e91e63',
      anniversary: '#9c27b0',
      holiday: '#ff9800',
      personal: '#4caf50',
      work: '#2196f3',
      memorial: '#757575',
      custom: '#1976d2',
    };
    return colorMap[category] || '#1976d2';
  }
}
