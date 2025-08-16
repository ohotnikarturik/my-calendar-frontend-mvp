import {
  Component,
  effect,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Calendar as FullCalendar,
  type CalendarOptions,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import { CalendarEventsService } from '../../services/calendar-events.service';

@Component({
  selector: 'calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class Calendar implements AfterViewInit, OnDestroy {
  private calendar?: FullCalendar;
  private readonly eventsSvc = inject(CalendarEventsService);

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
    } satisfies CalendarOptions);

    this.calendar.render();
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
    this.calendar?.destroy();
  }
}
