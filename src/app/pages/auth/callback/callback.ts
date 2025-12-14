/**
 * Auth Callback Component
 *
 * Learning note: This component handles OAuth redirects (e.g., after Google login).
 * Supabase automatically processes the OAuth callback in the URL, but we need
 * a route to handle the redirect and navigate the user appropriately.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../../services/supabase.service';
import { SyncService } from '../../../services/sync.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Completing sign in...</p>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 120px);
        gap: 16px;
      }

      p {
        color: var(--mat-sys-on-surface-variant, #49454f);
        font-size: 0.875rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
})
export class AuthCallback implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly syncService = inject(SyncService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Wait for Supabase to process the OAuth callback
    // The auth state change listener in SupabaseService will handle setting the user
    await this.waitForAuth();
  }

  private async waitForAuth(): Promise<void> {
    // Wait for initialization
    while (!this.supabase.isInitialized()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Check if authenticated
    if (this.supabase.isAuthenticated()) {
      // Trigger initial sync after login
      this.syncService.syncAll();
      this.router.navigate(['/']);
    } else {
      // Not authenticated, redirect to login
      this.router.navigate(['/auth/login']);
    }
  }
}
