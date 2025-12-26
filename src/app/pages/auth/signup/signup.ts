/**
 * Signup Component
 *
 * Learning note: This component handles new user registration via:
 * - Email/password signup
 * - Google OAuth signup
 *
 * Uses reactive forms with validation including password confirmation.
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
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../services/supabase.service';

/**
 * Custom validator for password confirmation
 * Learning note: This validator compares two form controls
 */
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
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
    MatCheckboxModule,
  ],
})
export class Signup {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Form with password match validation
  readonly signupForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  // UI state
  readonly isLoading = signal(false);
  readonly isSignupComplete = signal(false);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  /**
   * Handle email/password signup
   */
  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email, password } = this.signupForm.getRawValue();

    try {
      const result = await this.supabase.signUp(email, password);

      if (result.success) {
        // Show success message about email confirmation
        this.successMessage.set(
          "Account created successfully! Please check your email to confirm your account before signing in. (Check spam folder if you don't see it)"
        );
        // Don't reset form - user might need to see the email they used
        // Disable form inputs instead
        this.signupForm.disable();
        this.isSignupComplete.set(true);
        // Show success notification
        this.snackBar.open(
          'Account created! Check your email to confirm.',
          'Close',
          {
            duration: 5000,
            panelClass: ['success-snackbar'],
          }
        );
      } else {
        // Handle specific error cases
        let errorMsg =
          result.error?.message ?? 'Signup failed. Please try again.';

        // Provide helpful message for common errors
        if (errorMsg.includes('already registered')) {
          errorMsg =
            'This email is already registered. Please sign in instead or try a different email.';
        } else if (errorMsg.includes('Invalid email')) {
          errorMsg = 'Please enter a valid email address.';
        } else if (errorMsg.includes('Password')) {
          errorMsg = 'Password must be at least 6 characters long.';
        }

        this.errorMessage.set(errorMsg);
        this.snackBar.open(errorMsg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      this.errorMessage.set(errorMsg);
      this.snackBar.open(errorMsg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle Google OAuth signup
   */
  async onGoogleSignup(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.supabase.signInWithGoogle();

      if (!result.success) {
        const errorMsg = result.error?.message ?? 'Google signup failed.';
        this.errorMessage.set(errorMsg);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error('Google signup error:', error);
      this.errorMessage.set('Failed to initiate Google signup.');
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
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }
}
