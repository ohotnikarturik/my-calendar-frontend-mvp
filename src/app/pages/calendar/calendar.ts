import {
  Component,
  effect,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  Calendar as FullCalendar,
  type CalendarOptions,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { CalendarEventsService } from '../../services/calendar-events.service';
import { EventModal, type EventModalData } from '../../components/event-modal';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class Calendar implements AfterViewInit, OnDestroy {
  private calendar?: FullCalendar;
  private readonly eventsSvc = inject(CalendarEventsService);
  private readonly dialog = inject(MatDialog);

  private cleanupEffect = effect(() => {
    if (this.calendar) {
      this.calendar.removeAllEvents();
      this.eventsSvc.events().forEach((e) => {
        this.calendar?.addEvent(e);
      });
    }
  });

  constructor() {
    // Initialize events in the service (example initial event)
    this.eventsSvc.loadInitial([
      {
        id: '1',
        title: 'All Day Event',
        start: new Date().toISOString().substring(0, 10),
      },
      {
        id: '2',
        title: 'All Day Event - 2',
        start: new Date().toISOString().substring(0, 10),
      },
    ]);
  }

  ngAfterViewInit(): void {
    const host = document.querySelector('.calendar-host');
    if (!host) return;

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
  }

  onDateSelect(selectInfo: any): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        date: selectInfo.startStr,
        isEdit: false,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'save') {
        this.eventsSvc.add(result.event);
      }
      this.calendar?.unselect();
    });
  }

  onEventClick(clickInfo: any): void {
    const event = this.eventsSvc.events().find(e => e.id === clickInfo.event.id);
    if (!event) return;

    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        event: event,
        isEdit: true,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'save') {
        this.eventsSvc.update(result.event.id, result.event);
      } else if (result?.action === 'delete') {
        this.eventsSvc.remove(result.eventId);
      }
    });
  }

  onEventDrop(dropInfo: any): void {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    this.eventsSvc.update(eventId, {
      start: newStart?.toISOString(),
      end: newEnd?.toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  onEventResize(resizeInfo: any): void {
    const eventId = resizeInfo.event.id;
    const newEnd = resizeInfo.event.end;

    this.eventsSvc.update(eventId, {
      end: newEnd?.toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  createNewEvent(): void {
    const dialogRef = this.dialog.open(EventModal, {
      width: '500px',
      data: {
        isEdit: false,
      } as EventModalData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'save') {
        this.eventsSvc.add(result.event);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
    this.calendar?.destroy();
  }
}
