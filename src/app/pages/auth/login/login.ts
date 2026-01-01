/**
 * Login Component
 *
 * Learning note: This component handles user authentication via:
 * - Email/password login
 * - Google OAuth login
 *
 * Uses reactive forms for validation and Angular Material for UI.
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../services/supabase.service';
import { CalendarEventsService } from '../../../services/calendar-events.service';
import { ContactsService } from '../../../services/contacts.service';
import { OccasionsService } from '../../../services/occasions.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslatePipe,
  ],
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly eventsService = inject(CalendarEventsService);
  private readonly contactsService = inject(ContactsService);
  private readonly occasionsService = inject(OccasionsService);
  private readonly notificationSvc = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Form state
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // UI state
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Handle email/password login
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      const result = await this.supabase.signIn(email, password);

      if (result.success) {
        // Reload data from Supabase after login
        await Promise.all([
          this.eventsService.reload(),
          this.contactsService.reload(),
          this.occasionsService.reload(),
        ]);

        this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      } else {
        // Show error message
        const errorMsg =
          result.error?.message ?? 'Login failed. Please try again.';
        this.errorMessage.set(errorMsg);
        this.notificationSvc.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      this.errorMessage.set(errorMsg);
      this.notificationSvc.error(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle Google OAuth login
   * Learning note: This redirects to Google's login page, then back to the app
   */
  async onGoogleLogin(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.supabase.signInWithGoogle();

      if (!result.success) {
        const errorMsg = result.error?.message ?? 'Google login failed.';
        this.errorMessage.set(errorMsg);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error('Google login error:', error);
      this.errorMessage.set('Failed to initiate Google login.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  /**
   * Handle forgot password
   */
  async onForgotPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value;

    if (!email) {
      this.errorMessage.set('Please enter your email address first.');
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.supabase.resetPassword(email);

      if (result.success) {
        this.snackBar.open(
          'Password reset email sent. Check your inbox.',
          'Close',
          { duration: 5000 }
        );
      } else {
        this.errorMessage.set(
          result.error?.message ?? 'Failed to send reset email.'
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      this.errorMessage.set('An unexpected error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
