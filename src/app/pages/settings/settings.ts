/**
 * Settings Page Component
 *
 * Allows users to configure app preferences and manage data.
 * Includes timezone, reminders, theme, and data export/import.
 *
 * Learning note: This component demonstrates form handling
 * without a modal, localStorage-based settings, and file
 * upload/download functionality.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { SettingsService } from '../../services/settings.service';
import { SupabaseService } from '../../services/supabase.service';
import { CalendarEventsService } from '../../services/calendar-events.service';
import { ContactsService } from '../../services/contacts.service';
import { OccasionsService } from '../../services/occasions.service';
import { NotificationPreferencesService } from '../../services/notification-preferences.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PageHeader } from '../../components/page-header/page-header';
import {
  COMMON_TIMEZONES,
  REMINDER_DAY_OPTIONS,
  type ThemeMode,
  type ExportFormat,
} from '../../types/settings.type';
import { SUPPORTED_LANGUAGES, type Language } from '../../types/language.type';
import {
  REMINDER_DAY_OPTIONS as EMAIL_REMINDER_DAY_OPTIONS,
  REMINDER_TIME_OPTIONS as EMAIL_REMINDER_TIME_OPTIONS,
  COMMON_TIMEZONES as EMAIL_TIMEZONES,
} from '../../types/notification-preferences.type';

@Component({
  selector: 'settings',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeader,
    TranslatePipe,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  // Inject services using inject() function (modern Angular pattern)
  protected readonly settingsService = inject(SettingsService);
  protected readonly translationService = inject(TranslationService);
  protected readonly supabase = inject(SupabaseService);
  protected readonly eventsService = inject(CalendarEventsService);
  protected readonly contactsService = inject(ContactsService);
  protected readonly occasionsService = inject(OccasionsService);
  protected readonly notificationPrefs = inject(NotificationPreferencesService);
  private readonly snackBar = inject(MatSnackBar);

  // Component state with signals
  protected readonly isExporting = signal(false);
  protected readonly isImporting = signal(false);
  protected readonly isClearing = signal(false);
  protected readonly selectedFile = signal<File | null>(null);

  // Timezone and reminder options (from constants)
  protected readonly timezones = COMMON_TIMEZONES;
  protected readonly reminderOptions = REMINDER_DAY_OPTIONS;
  protected readonly supportedLanguages = SUPPORTED_LANGUAGES;

  // Email reminder options
  protected readonly emailReminderDayOptions = EMAIL_REMINDER_DAY_OPTIONS;
  protected readonly emailReminderTimeOptions = EMAIL_REMINDER_TIME_OPTIONS;
  protected readonly emailTimezones = EMAIL_TIMEZONES;

  // Settings update methods
  protected updateTimezone(timezone: string): void {
    this.settingsService.updateSettings({ timezone });
    this.showSnackbar('Timezone updated');
  }

  protected updateLanguage(language: Language): void {
    this.translationService.setLanguage(language);
    this.showSnackbar('Language updated');
  }

  protected updateTheme(theme: ThemeMode): void {
    this.settingsService.updateSettings({ theme });
    this.showSnackbar('Theme updated');
  }

  protected updateStartOfWeek(startOfWeek: number): void {
    this.settingsService.updateSettings({
      calendarStartOfWeek: startOfWeek as 0 | 1,
    });
    this.showSnackbar('Calendar start day updated');
  }

  protected updateExportFormat(format: ExportFormat): void {
    this.settingsService.updateSettings({ exportFormat: format });
    this.showSnackbar('Export format updated');
  }

  protected isReminderDaySelected(days: number): boolean {
    return (
      this.settingsService.settings().defaultReminderDays?.includes(days) ??
      false
    );
  }

  protected toggleReminderDay(days: number): void {
    const current = this.settingsService.settings().defaultReminderDays ?? [];
    const updated = current.includes(days)
      ? current.filter((d: number) => d !== days)
      : [...current, days];
    this.settingsService.updateSettings({ defaultReminderDays: updated });
    this.showSnackbar('Default reminders updated');
  }

  protected resetToDefaults(): void {
    if (confirm('Reset all settings to default values?')) {
      this.settingsService.resetToDefaults();
      this.showSnackbar('Settings reset to defaults');
    }
  }

  // Data management methods
  protected async exportData(): Promise<void> {
    this.isExporting.set(true);
    try {
      const events = this.eventsService.events();
      const contacts = this.contactsService.contacts();
      const occasions = this.occasionsService.occasions();
      await this.settingsService.exportData(events, contacts, occasions);
      this.showSnackbar('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      this.showSnackbar('Export failed. Please try again.');
    } finally {
      this.isExporting.set(false);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  protected async importData(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    if (!confirm('This will replace all existing data. Continue?')) {
      return;
    }

    this.isImporting.set(true);
    try {
      const text = await file.text();
      const data = this.settingsService.parseImportData(text);

      // Import to Supabase (will overwrite existing data with same IDs)
      const promises = [];
      if (data.events?.length) {
        promises.push(this.supabase.upsertEvents(data.events));
      }
      if (data.contacts?.length) {
        promises.push(this.supabase.upsertContacts(data.contacts));
      }
      if (data.occasions?.length) {
        promises.push(this.supabase.upsertOccasions(data.occasions));
      }

      await Promise.all(promises);

      // Reload data from Supabase
      await Promise.all([
        this.eventsService.reload(),
        this.contactsService.reload(),
        this.occasionsService.reload(),
      ]);

      this.showSnackbar('Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showSnackbar(`Import failed: ${message}`);
      this.isImporting.set(false);
    }
  }

  protected async clearAllData(): Promise<void> {
    if (
      !confirm('Permanently delete ALL data from cloud? This cannot be undone!')
    ) {
      return;
    }

    if (
      !confirm(
        'Are you absolutely sure? This will delete all events, contacts, and occasions from Supabase.'
      )
    ) {
      return;
    }

    this.isClearing.set(true);
    try {
      // Get all current data
      const events = this.eventsService.events();
      const contacts = this.contactsService.contacts();
      const occasions = this.occasionsService.occasions();

      // Delete all from Supabase
      const deletePromises = [
        ...events.map((e) => this.supabase.deleteEvent(e.id)),
        ...contacts.map((c) => this.supabase.deleteContact(c.id)),
        ...occasions.map((o) => this.supabase.deleteOccasion(o.id)),
      ];

      await Promise.all(deletePromises);

      // Reload services (will now be empty)
      await Promise.all([
        this.eventsService.reload(),
        this.contactsService.reload(),
        this.occasionsService.reload(),
      ]);

      this.showSnackbar('All data cleared successfully');
    } catch (error) {
      console.error('Clear data failed:', error);
      this.showSnackbar('Failed to clear data. Please try again.');
    } finally {
      this.isClearing.set(false);
    }
  }

  // Email reminder methods
  protected async toggleEmailReminders(enabled: boolean): Promise<void> {
    try {
      await this.notificationPrefs.toggleEmailReminders(enabled);
    } catch (error) {
      console.error('Failed to toggle email reminders:', error);
    }
  }

  protected isEmailReminderDaySelected(day: number): boolean {
    return (
      this.notificationPrefs.preferences()?.reminder_days?.includes(day) ??
      false
    );
  }

  protected async toggleEmailReminderDay(
    day: number,
    checked: boolean
  ): Promise<void> {
    const prefs = this.notificationPrefs.preferences();
    if (!prefs) return;

    const newDays = checked
      ? [...(prefs.reminder_days || []), day].sort((a, b) => a - b)
      : (prefs.reminder_days || []).filter((d) => d !== day);

    try {
      await this.notificationPrefs.updateReminderDays(newDays);
    } catch (error) {
      console.error('Failed to update reminder days:', error);
    }
  }

  protected async updateEmailReminderTime(time: string): Promise<void> {
    try {
      await this.notificationPrefs.updateReminderTime(time);
    } catch (error) {
      console.error('Failed to update reminder time:', error);
    }
  }

  protected async updateEmailTimezone(timezone: string): Promise<void> {
    try {
      await this.notificationPrefs.updateTimezone(timezone);
    } catch (error) {
      console.error('Failed to update timezone:', error);
    }
  }

  protected async sendTestEmail(): Promise<void> {
    try {
      await this.notificationPrefs.sendTestEmail();
    } catch (error) {
      console.error('Failed to send test email:', error);
    }
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

// Named export for route consistency
export { SettingsComponent as Settings };
