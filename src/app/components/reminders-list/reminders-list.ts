import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RemindersService, type Reminder } from '../../services/reminders.service';

@Component({
  selector: 'reminders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <div class="reminders-container">
      @if (reminders().length === 0) {
      <div class="empty-state">
        <mat-icon>notifications_off</mat-icon>
        <p>No upcoming reminders</p>
      </div>
      } @else {
      <div class="reminders-list">
        @for (reminder of reminders(); track reminderKey(reminder)) {
        <mat-card class="reminder-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>event</mat-icon>
            <mat-card-title>{{ reminder.eventTitle }}</mat-card-title>
            <mat-card-subtitle>
              {{ formatDate(reminder.eventDate) }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="reminder-info">
              <mat-chip>
                @if (reminder.daysUntil === 0) { Today } @else if (reminder.daysUntil
                === 1) { Tomorrow } @else { In {{ reminder.daysUntil }} days }
              </mat-chip>
              <span class="reminder-note">
                Reminder set for {{ reminder.reminderDay }} day(s) before
              </span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="dismissReminder(reminder)">
              <mat-icon>close</mat-icon>
              Dismiss
            </button>
          </mat-card-actions>
        </mat-card>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .reminders-container {
        padding: 1rem;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .reminders-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .reminder-card {
        width: 100%;
      }

      .reminder-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .reminder-note {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }

      mat-card-actions {
        padding: 0.5rem 1rem 1rem;
      }
    `,
  ],
})
export class RemindersListComponent {
  private readonly remindersSvc = inject(RemindersService);

  readonly reminders = this.remindersSvc.upcomingReminders;

  reminderKey(reminder: Reminder): string {
    return `${reminder.eventId}-${reminder.reminderDay}-${reminder.eventDate}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  dismissReminder(reminder: Reminder): void {
    this.remindersSvc.markReminderShown(reminder);
  }
}





