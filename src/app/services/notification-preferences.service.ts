/**
 * Notification Preferences Service
 *
 * Manages user email reminder preferences stored in Supabase
 * Provides CRUD operations and state management using signals
 */

import { Injectable, signal, inject, computed, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import {
  NotificationPreferences,
  SupabaseNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notification-preferences.type';

@Injectable({
  providedIn: 'root',
})
export class NotificationPreferencesService {
  private readonly supabase = inject(SupabaseService);
  private readonly notification = inject(NotificationService);

  // State
  private readonly _preferences = signal<NotificationPreferences | null>(null);
  private readonly _loading = signal(false);
  private readonly _initialized = signal(false);

  // Public readonly signals
  readonly preferences = this._preferences.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  // Computed state
  readonly hasPreferences = computed(() => this._preferences() !== null);
  readonly emailRemindersEnabled = computed(
    () => this._preferences()?.email_reminders_enabled ?? false
  );

  constructor() {
    // Auto-load preferences when user is authenticated
    effect(() => {
      const user = this.supabase.currentUser();
      if (user && !this._initialized()) {
        void this.loadPreferences();
      } else if (!user) {
        this._preferences.set(null);
        this._initialized.set(false);
      }
    });
  }

  /**
   * Load user's notification preferences from Supabase
   * Creates default preferences if none exist
   */
  async loadPreferences(): Promise<void> {
    if (this._loading()) return;

    this._loading.set(true);
    try {
      const userId = this.supabase.userId();
      if (!userId) {
        this._preferences.set(null);
        return;
      }

      const { data, error } = await this.supabase.client
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        this._preferences.set(this.mapFromSupabase(data));
      } else {
        // Create default preferences for new user
        await this.createDefaultPreferences();
      }

      this._initialized.set(true);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      this.notification.error('Failed to load notification preferences');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create default preferences for a new user
   */
  private async createDefaultPreferences(): Promise<void> {
    const userId = this.supabase.userId();
    if (!userId) return;

    const defaultPrefs: Partial<SupabaseNotificationPreferences> = {
      user_id: userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    };

    const { data, error } = await this.supabase.client
      .from('user_notification_preferences')
      .insert(defaultPrefs)
      .select()
      .single();

    if (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }

    if (data) {
      this._preferences.set(this.mapFromSupabase(data));
    }
  }

  /**
   * Toggle email reminders on/off
   */
  async toggleEmailReminders(enabled: boolean): Promise<void> {
    const prefs = this._preferences();
    if (!prefs) return;

    // Optimistic update
    const previous = prefs;
    this._preferences.set({ ...prefs, email_reminders_enabled: enabled });

    try {
      const { error } = await this.supabase.client
        .from('user_notification_preferences')
        .update({
          email_reminders_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prefs.id);

      if (error) throw error;

      this.notification.success(
        enabled ? 'Email reminders enabled' : 'Email reminders disabled'
      );
    } catch (error) {
      // Rollback on error
      this._preferences.set(previous);
      console.error('Error toggling email reminders:', error);
      this.notification.error('Failed to update email reminders');
      throw error;
    }
  }

  /**
   * Update reminder days (e.g., [1, 7] = 1 day and 7 days before)
   */
  async updateReminderDays(days: number[]): Promise<void> {
    const prefs = this._preferences();
    if (!prefs) return;

    // Optimistic update
    const previous = prefs;
    this._preferences.set({ ...prefs, reminder_days: days });

    try {
      const { error } = await this.supabase.client
        .from('user_notification_preferences')
        .update({
          reminder_days: days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prefs.id);

      if (error) throw error;

      this.notification.success('Reminder days updated');
    } catch (error) {
      // Rollback on error
      this._preferences.set(previous);
      console.error('Error updating reminder days:', error);
      this.notification.error('Failed to update reminder days');
      throw error;
    }
  }

  /**
   * Update reminder time (HH:MM:SS format)
   */
  async updateReminderTime(time: string): Promise<void> {
    const prefs = this._preferences();
    if (!prefs) return;

    // Optimistic update
    const previous = prefs;
    this._preferences.set({ ...prefs, reminder_time: time });

    try {
      const { error } = await this.supabase.client
        .from('user_notification_preferences')
        .update({
          reminder_time: time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prefs.id);

      if (error) throw error;

      this.notification.success('Reminder time updated');
    } catch (error) {
      // Rollback on error
      this._preferences.set(previous);
      console.error('Error updating reminder time:', error);
      this.notification.error('Failed to update reminder time');
      throw error;
    }
  }

  /**
   * Update timezone
   */
  async updateTimezone(timezone: string): Promise<void> {
    const prefs = this._preferences();
    if (!prefs) return;

    // Optimistic update
    const previous = prefs;
    this._preferences.set({ ...prefs, timezone });

    try {
      const { error } = await this.supabase.client
        .from('user_notification_preferences')
        .update({
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prefs.id);

      if (error) throw error;

      this.notification.success('Timezone updated');
    } catch (error) {
      // Rollback on error
      this._preferences.set(previous);
      console.error('Error updating timezone:', error);
      this.notification.error('Failed to update timezone');
      throw error;
    }
  }

  /**
   * Send a test email to verify email notifications are working
   */
  async sendTestEmail(): Promise<void> {
    const userId = this.supabase.userId();
    if (!userId) {
      this.notification.error('Please log in to send test email');
      return;
    }

    try {
      const { data, error } = await this.supabase.client.functions.invoke(
        'send-test-reminder-email',
        {
          body: { user_id: userId },
        }
      );

      if (error) throw error;

      this.notification.success(
        `Test email sent to ${data.email}. Check your inbox!`
      );
    } catch (error) {
      console.error('Error sending test email:', error);
      this.notification.error(
        'Failed to send test email. Please check Supabase Functions configuration.'
      );
      throw error;
    }
  }

  /**
   * Map Supabase data to NotificationPreferences type
   */
  private mapFromSupabase(
    data: SupabaseNotificationPreferences
  ): NotificationPreferences {
    return {
      id: data.id,
      user_id: data.user_id,
      email_reminders_enabled: data.email_reminders_enabled,
      reminder_days: data.reminder_days,
      reminder_time: data.reminder_time,
      timezone: data.timezone,
      last_reminder_sent: data.last_reminder_sent,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
