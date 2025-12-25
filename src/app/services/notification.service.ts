import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Service for displaying user notifications using Material Snackbar
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('networkerror') ||
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('offline')
      );
    }
    return false;
  }

  /**
   * Show a success message
   */
  success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success'],
    });
  }

  /**
   * Show an error message
   */
  error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }

  /**
   * Show an info message
   */
  info(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-info'],
    });
  }

  /**
   * Show a warning message
   */
  warning(message: string, duration = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-warning'],
    });
  }

  /**
   * Show an error message with retry action
   */
  errorWithRetry(message: string, retryFn: () => void): void {
    const snackBarRef = this.snackBar.open(message, 'Retry', {
      duration: 10000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });

    snackBarRef.onAction().subscribe(() => {
      retryFn();
    });
  }

  /**
   * Show an error with automatic network detection and retry option
   */
  errorWithAutoRetry(
    error: unknown,
    defaultMessage: string,
    retryFn?: () => void
  ): void {
    const isNetwork = this.isNetworkError(error);
    const message = isNetwork
      ? 'Network error. Please check your connection and try again.'
      : defaultMessage;

    if (isNetwork && retryFn) {
      this.errorWithRetry(message, retryFn);
    } else {
      this.error(message);
    }
  }
}
