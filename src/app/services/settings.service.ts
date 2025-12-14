/**
 * Settings Service
 *
 * Manages application settings stored in localStorage.
 * Uses signals for reactive state management.
 *
 * Learning note: Unlike other services that use IndexedDB,
 * settings are stored in localStorage for instant access
 * without async operations. This is appropriate for small,
 * frequently accessed configuration data.
 */

import { Injectable, signal, effect } from '@angular/core';
import type { AppSettings } from '../types/settings.type';
import { DEFAULT_SETTINGS } from '../types/settings.type';
import type { CalendarEvent } from '../types/event.type';
import type { Contact } from '../types/contact.type';
import type { Occasion } from '../types/occasion.type';

const SETTINGS_KEY = 'calendar-app-settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  // Private signal for internal state
  private readonly _settings = signal<AppSettings>(this.loadSettings());

  // Public readonly signal
  readonly settings = this._settings.asReadonly();

  constructor() {
    // Auto-save settings to localStorage whenever they change
    // Learning note: effect() runs whenever its signal dependencies change
    effect(() => {
      const settings = this._settings();
      this.saveToLocalStorage(settings);
    });
  }

  /**
   * Load settings from localStorage or return defaults
   */
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      // Merge with defaults to handle new settings added in updates
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveToLocalStorage(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Update one or more settings
   */
  updateSettings(partial: Partial<AppSettings>): void {
    this._settings.update((current) => ({ ...current, ...partial }));
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults(): void {
    this._settings.set(DEFAULT_SETTINGS);
  }

  /**
   * Export all app data as JSON
   * Includes events, contacts, occasions, and settings
   */
  async exportData(
    events: CalendarEvent[],
    contacts: Contact[],
    occasions: Occasion[]
  ): Promise<string> {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: this._settings(),
      events,
      contacts,
      occasions,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Parse imported data
   * Returns the data structure for validation and import
   */
  parseImportData(jsonString: string): {
    settings?: AppSettings;
    events?: CalendarEvent[];
    contacts?: Contact[];
    occasions?: Occasion[];
    version?: string;
    exportDate?: string;
  } {
    try {
      const data = JSON.parse(jsonString);
      return data;
    } catch (error) {
      console.error('Failed to parse import data:', error);
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Import settings from exported data
   */
  importSettings(settings: Partial<AppSettings>): void {
    // Merge imported settings with defaults to ensure all fields exist
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    this._settings.set(merged);
  }

  /**
   * Download data as JSON file
   * Browser utility method
   */
  downloadAsFile(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
