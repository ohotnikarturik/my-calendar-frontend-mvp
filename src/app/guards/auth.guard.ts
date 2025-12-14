/**
 * Auth Guard
 *
 * Learning note: Route guards in Angular control access to routes.
 * This guard checks if the user is authenticated before allowing
 * access to protected routes.
 *
 * Modern Angular uses functional guards (functions) instead of
 * class-based guards (CanActivate interface).
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Auth guard function
 * Returns true if user is authenticated, otherwise redirects to login
 *
 * Learning note: Functional guards are simpler and more tree-shakeable
 * than class-based guards. They're the recommended approach in Angular 15+.
 */
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for Supabase to initialize (check stored session)
  while (!supabase.isInitialized()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (supabase.isAuthenticated()) {
    return true;
  }

  // Not authenticated - redirect to login
  // Learning note: We use router.createUrlTree() for proper route guarding
  return router.createUrlTree(['/auth/login']);
};

/**
 * Guest guard function
 * Redirects authenticated users away from auth pages (login/signup)
 * Prevents logged-in users from seeing login page
 */
export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for Supabase to initialize
  while (!supabase.isInitialized()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (supabase.isAuthenticated()) {
    // Already logged in - redirect to home
    return router.createUrlTree(['/']);
  }

  return true;
};
