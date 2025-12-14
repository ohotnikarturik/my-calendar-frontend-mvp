import { Component, computed, inject, effect } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { ContentWrapper } from './components/content-wrapper/content-wrapper';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from './services/settings.service';
import { SupabaseService } from './services/supabase.service';
import { SyncService } from './services/sync.service';
import type { ThemeMode } from './types/settings.type';

/**
 * App Component
 *
 * Learning note: This is the root component that handles:
 * - Navigation layout
 * - Theme switching
 * - Auth state display (login/logout)
 * - Sync status indicator
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ContentWrapper,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly settingsService = inject(SettingsService);
  readonly supabase = inject(SupabaseService);
  private readonly syncService = inject(SyncService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Current theme from settings
  readonly currentTheme = computed(() => this.settingsService.settings().theme);

  // Auth state
  readonly isAuthenticated = this.supabase.isAuthenticated;
  readonly userEmail = this.supabase.userEmail;

  // Sync state
  readonly syncStatus = this.syncService.status;
  readonly pendingCount = this.syncService.pendingCount;
  readonly isOnline = this.supabase.isOnline;

  // Icon to display based on current theme
  readonly themeIcon = computed(() => {
    const theme = this.currentTheme();
    switch (theme) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
    }
  });

  // Tooltip text for theme button
  readonly themeTooltip = computed(() => {
    const theme = this.currentTheme();
    switch (theme) {
      case 'light':
        return 'Light mode (click for dark)';
      case 'dark':
        return 'Dark mode (click for auto)';
      case 'auto':
        return 'Auto mode (click for light)';
    }
  });

  // Sync icon based on status
  readonly syncIcon = computed(() => {
    if (!this.isOnline()) return 'cloud_off';

    switch (this.syncStatus()) {
      case 'syncing':
        return 'sync';
      case 'success':
        return 'cloud_done';
      case 'error':
        return 'cloud_off';
      default:
        return 'cloud_queue';
    }
  });

  // Sync tooltip (informational only - sync happens automatically)
  readonly syncTooltip = computed(() => {
    if (!this.isOnline()) return 'Offline - changes saved locally';

    const pending = this.pendingCount();
    switch (this.syncStatus()) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced with cloud';
      case 'error':
        return `Sync error - will retry (${pending} pending)`;
      default:
        return pending > 0
          ? `${pending} changes pending sync`
          : 'Synced with cloud';
    }
  });

  constructor() {
    // Apply theme to document whenever it changes
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
    });
  }

  /**
   * Cycle through themes: light → dark → auto → light
   */
  toggleTheme(): void {
    const current = this.currentTheme();
    const next: ThemeMode =
      current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
    this.settingsService.updateSettings({ theme: next });
  }

  /**
   * Handle logout
   */
  async onLogout(): Promise<void> {
    const result = await this.supabase.signOut();
    if (result.success) {
      this.snackBar.open('Signed out successfully', 'Close', {
        duration: 2000,
      });
      this.router.navigate(['/']);
    } else {
      this.snackBar.open('Failed to sign out', 'Close', { duration: 3000 });
    }
  }

  /**
   * Apply theme to the document's color-scheme
   */
  private applyTheme(theme: ThemeMode): void {
    const body = document.body;

    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');

    if (theme === 'auto') {
      // Use system preference
      body.style.colorScheme = 'light dark';
    } else {
      body.style.colorScheme = theme;
      body.classList.add(`theme-${theme}`);
    }
  }
}
