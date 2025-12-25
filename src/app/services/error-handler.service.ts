import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * Global error handler service that catches unhandled errors
 * and displays user-friendly messages
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notificationSvc = inject(NotificationService);

  handleError(error: Error | unknown): void {
    console.error('Global error handler caught:', error);

    const message = this.getErrorMessage(error);
    this.notificationSvc.error(message);
  }

  /**
   * Extract user-friendly error message from error object
   */
  private getErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      // Handle network errors
      if (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')
      ) {
        return 'Network error. Please check your connection and try again.';
      }

      // Handle Supabase errors
      if (
        error.message.includes('AuthApiError') ||
        error.message.includes('authentication')
      ) {
        return 'Authentication error. Please log in again.';
      }

      // Handle database errors
      if (error.message.includes('PostgrestError')) {
        return 'Database error. Please try again later.';
      }

      // Return sanitized error message
      return error.message || 'An unexpected error occurred';
    }

    // Fallback for unknown error types
    return 'An unexpected error occurred';
  }
}
