import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  RemindersService,
  type Reminder,
} from '../../services/reminders.service';
import { DateUtilsService } from '../../services/date-utils.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'reminders-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslatePipe,
  ],
  templateUrl: './reminders-list.html',
  styleUrl: './reminders-list.scss',
})
export class RemindersListComponent {
  private readonly remindersSvc = inject(RemindersService);
  private readonly dateUtils = inject(DateUtilsService);

  readonly reminders = this.remindersSvc.upcomingReminders;

  reminderKey(reminder: Reminder): string {
    return `${reminder.eventId}-${reminder.reminderDay}-${reminder.eventDate}`;
  }

  formatDate(dateStr: string): string {
    return this.dateUtils.formatShort(dateStr);
  }

  dismissReminder(reminder: Reminder): void {
    this.remindersSvc.markReminderShown(reminder);
  }
}
