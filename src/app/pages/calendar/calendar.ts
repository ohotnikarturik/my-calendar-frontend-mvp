import {
  Component,
  effect,
  inject,
  OnDestroy,
  viewChild,
  ElementRef,
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
  type DatesSetArg,
  type EventClickArg,
  type EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarEventsService } from '../../services/calendar-events.service';
import { OccasionsService } from '../../services/occasions.service';
import { RemindersService } from '../../services/reminders.service';
import { DateUtilsService } from '../../services/date-utils.service';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import type { CalendarEvent } from '../../types/event.type';
import {
  EventModal,
  type EventModalData,
} from '../../components/event-modal/event-modal';
import { PageHeader } from '../../components/page-header/page-header';
import { EmptyState } from '../../components/empty-state/empty-state';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
    TranslatePipe,
  ],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class Calendar implements OnDestroy {
  private calendar?: FullCalendar;
  private initializing = false;

  private readonly calendarHost = viewChild<ElementRef<HTMLElement>>('calendarHost');
  readonly eventsSvc = inject(CalendarEventsService);
  private readonly occasionsSvc = inject(OccasionsService);
  private readonly remindersSvc = inject(RemindersService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly settingsService = inject(SettingsService);
  private readonly translationService = inject(TranslationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private visibleRangeStart = new Date();
  private visibleRangeEnd = new Date();

  private cleanupEffect = effect(() => {
    this.eventsSvc.loading();
    this.eventsSvc.events();
    this.occasionsSvc.occasions();
    void this.calendarHost();
    void this.settingsService.settings().calendarStartOfWeek;
    void this.translationService.currentLanguage();

    const host = this.calendarHost()?.nativeElement;

    if (!host) {
      this.destroyCalendarInstance();
      return;
    }

    if (!this.calendar) {
      this.initializeCalendar(host);
      return;
    }

    this.syncCalendarOptions();
    this.updateCalendarEvents();
  });

  constructor() {
    setTimeout(() => this.checkReminders(), 1000);
  }

  private checkReminders(): void {
    const todayReminders = this.remindersSvc.todayReminders();
    if (todayReminders.length === 0) return;

    const unshownReminders = todayReminders.filter(
      (r) => !this.remindersSvc.isReminderShown(r)
    );
    if (unshownReminders.length === 0) return;

    const count = unshownReminders.length;
    const message =
      count === 1
        ? this.translationService.translate('calendar.reminderTodaySingle', {
            title: unshownReminders[0].eventTitle,
          })
        : this.translationService.translate('calendar.reminderTodayMultiple', {
            count,
          });

    this.snackBar.open(
      message,
      this.translationService.translate('calendar.viewReminders'),
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }
    );

    unshownReminders.forEach((r) => this.remindersSvc.markReminderShown(r));
  }

  private initializeCalendar(host: HTMLElement): void {
    if (this.calendar || this.initializing) return;

    this.initializing = true;

    try {
      this.calendar = new FullCalendar(host, {
        plugins: [dayGridPlugin, interactionPlugin],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: '',
        },
        initialView: 'dayGridMonth',
        locale: this.getFullCalendarLocale(),
        firstDay: this.settingsService.settings().calendarStartOfWeek ?? 1,
        navLinks: true,
        editable: true,
        selectable: true,
        dayMaxEvents: true,
        fixedWeekCount: false,
        height: 'auto',

        select: (info) => this.onDateSelect(info),
        eventClick: (info) => this.onEventClick(info),
        eventDrop: (info) => this.onEventDrop(info),
        eventResize: (info) => this.onEventResize(info),
        datesSet: (info) => this.onDatesSet(info),
      } satisfies CalendarOptions);

      this.calendar.render();
      this.updateCalendarEvents();
    } finally {
      this.initializing = false;
    }
  }

  ngOnDestroy(): void {
    this.cleanupEffect.destroy();
    this.destroyCalendarInstance();
  }

  private destroyCalendarInstance(): void {
    this.calendar?.destroy();
    this.calendar = undefined;
    this.initializing = false;
  }

  private getFullCalendarLocale(): string {
    const lang = this.translationService.currentLanguage();
    const map: Record<string, string> = {
      en: 'en-gb',
      ru: 'ru',
      ua: 'uk',
      fi: 'fi',
    };
    return map[lang] ?? 'en-gb';
  }

  private syncCalendarOptions(): void {
    if (!this.calendar) return;

    this.calendar.setOption(
      'firstDay',
      this.settingsService.settings().calendarStartOfWeek ?? 1
    );
    this.calendar.setOption('locale', this.getFullCalendarLocale());
  }

  private onDatesSet(info: DatesSetArg): void {
    this.visibleRangeStart = info.start;
    this.visibleRangeEnd = info.end;
    this.updateCalendarEvents();
  }

  private getVisibleYears(): number[] {
    const startYear = this.visibleRangeStart.getFullYear();
    const endYear = this.visibleRangeEnd.getFullYear();
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years.length > 0 ? years : [this.dateUtils.currentYear()];
  }

  private mapEventForCalendar(event: CalendarEvent): CalendarEvent[] {
    if (!event.repeatAnnually) {
      return [event];
    }

    const years = this.getVisibleYears();
    const mapped: CalendarEvent[] = [];

    for (const year of years) {
      const occurrence = this.dateUtils.getAnnualOccurrenceInYear(
        event.start as string | Date,
        year
      );
      if (!occurrence) continue;

      mapped.push({
        ...event,
        id: years.length > 1 ? `${event.id}-${year}` : event.id,
        start: this.dateUtils.toDateString(occurrence),
        allDay: true,
        extendedProps: {
          ...(event.extendedProps as Record<string, unknown>),
          originalEventId: event.id,
        },
      });
    }

    return mapped;
  }

  private resolveEventId(calendarEventId: string): string {
    const event = this.eventsSvc
      .events()
      .find((e) => e.id === calendarEventId);
    if (event) return calendarEventId;

    const suffixMatch = calendarEventId.match(/^(.+)-(\d{4})$/);
    if (suffixMatch) {
      return suffixMatch[1];
    }

    return calendarEventId;
  }

  private updateCalendarEvents(): void {
    if (!this.calendar) return;

    const events = this.eventsSvc.events();
    const occasionEvents = this.occasionsSvc.toCalendarEvents();

    this.calendar.removeAllEvents();

    events.forEach((event) => {
      const category = event.category || 'custom';
      this.mapEventForCalendar(event).forEach((mappedEvent) => {
        this.calendar?.addEvent({
          ...mappedEvent,
          backgroundColor: event.color || this.getDefaultColor(category),
          borderColor: event.color || this.getDefaultColor(category),
        });
      });
    });

    occasionEvents.forEach((event) => {
      const category = event.category || 'custom';
      this.calendar?.addEvent({
        ...event,
        backgroundColor: event.color || this.getDefaultColor(category),
        borderColor: event.color || this.getDefaultColor(category),
        editable: false,
      });
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
        } catch (error) {
          console.error('Failed to create event:', error);
        }
      }
      this.calendar?.unselect();
    });
  }

  onEventClick(clickInfo: EventClickArg): void {
    const eventId = this.resolveEventId(clickInfo.event.id);
    const event = this.eventsSvc.events().find((e) => e.id === eventId);
    if (!event) return;

    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        event,
        isEdit: true,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        try {
          await this.eventsSvc.update(result.event.id, result.event);
        } catch (error) {
          console.error('Failed to update event:', error);
        }
      } else if (result?.action === 'delete') {
        try {
          await this.eventsSvc.remove(result.eventId);
        } catch (error) {
          console.error('Failed to delete event:', error);
        }
      }
    });
  }

  onEventDrop(dropInfo: EventDropArg): void {
    const eventId = this.resolveEventId(dropInfo.event.id);
    const storedEvent = this.eventsSvc.events().find((e) => e.id === eventId);
    const newStart = dropInfo.event.start;
    if (!newStart || !storedEvent) {
      dropInfo.revert();
      return;
    }

    const startUpdate = storedEvent.repeatAnnually
      ? this.dateUtils.applyMonthDayToStoredDate(
          storedEvent.start as string | Date,
          newStart
        )
      : newStart.toISOString();

    if (!startUpdate) {
      dropInfo.revert();
      return;
    }

    this.eventsSvc
      .update(eventId, {
        start: startUpdate,
        end: dropInfo.event.end?.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .catch((error) => {
        console.error('Failed to update event:', error);
        dropInfo.revert();
      });
  }

  onEventResize(
    resizeInfo: EventDropArg | { event: { id: string; end: Date | null } }
  ): void {
    const eventId = this.resolveEventId(resizeInfo.event.id);
    const newEnd = resizeInfo.event.end;

    this.eventsSvc
      .update(eventId, {
        end: newEnd?.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .catch((error) => {
        console.error('Failed to resize event:', error);
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
        } catch (error) {
          console.error('Failed to create event:', error);
        }
      }
    });
  }

  private getDefaultColor(category: string): string {
    const colorMap: Record<string, string> = {
      birthday: '#E91E63',
      anniversary: '#9C27B0',
      holiday: '#FF9800',
      personal: '#4CAF50',
      work: '#2196F3',
      memorial: '#757575',
      other: '#00BCD4',
      custom: '#1976D2',
    };
    return colorMap[category] || '#1976D2';
  }
}
