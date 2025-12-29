/**
 * Supabase Service
 *
 * Learning note: This service provides a centralized interface for all Supabase
 * interactions including authentication and database operations. It follows
 * Angular's singleton service pattern with providedIn: 'root'.
 *
 * Supabase is a Backend-as-a-Service (BaaS) that provides:
 * - Authentication (email/password, OAuth providers like Google)
 * - PostgreSQL database with real-time subscriptions
 * - Row Level Security (RLS) for data access control
 * - Storage for files and media
 *
 * Important: Only use the anon/public key in frontend code, never the service role key!
 */

import { Injectable, signal, computed } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User,
  Session,
  AuthError,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import type { CalendarEvent } from '../types/event.type';
import type { Contact } from '../types/contact.type';
import type { Occasion } from '../types/occasion.type';

/**
 * Database table types for Supabase
 * These match the schema defined in COPILOT_PROMPT.md
 */
export interface SupabaseEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  all_day: boolean;
  repeat_annually: boolean;
  event_type?: string;
  category?: string;
  color?: string;
  notes?: string;
  reminder_days_before?: number;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseContact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseOccasion {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  type: 'birthday' | 'anniversary' | 'memorial' | 'custom';
  date: string;
  year?: number;
  repeat_annually: boolean;
  reminder_days_before?: number;
  reminder_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Auth response types for better type safety
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // ==================== DEV MODE TOGGLE ====================
  // Set to true to bypass authentication during development
  // Set to false to require Supabase authentication (production mode)
  private readonly DEV_MODE_BYPASS_AUTH = false;

  // Supabase client instance (null if not configured)
  // Learning note: We allow null to handle cases where Supabase isn't configured yet
  private readonly supabase: SupabaseClient | null = null;
  private readonly _isConfigured = signal(false);

  // Auth state signals
  // Learning note: Using signals for reactive auth state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _isInitialized = signal(false);
  private readonly _isOnline = signal(navigator.onLine);

  // Public readonly signals for components to consume
  readonly currentUser = this._currentUser.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();
  readonly isOnline = this._isOnline.asReadonly();
  readonly isConfigured = this._isConfigured.asReadonly();

  // Computed signals for common auth checks
  // Learning note: DEV_MODE_BYPASS_AUTH allows bypassing auth during development
  // In production mode, requires Supabase configured AND user logged in
  // Also handles offline grace period to prevent lockout when token expires offline
  readonly isAuthenticated = computed(() => {
    // Dev mode bypass - skip auth check entirely
    if (this.DEV_MODE_BYPASS_AUTH) {
      return true;
    }

    // If Supabase not configured, deny access (online-mode requirement)
    if (!this._isConfigured()) {
      return false;
    }

    // If we have a current user, they're authenticated
    if (this._currentUser() !== null) {
      return true;
    }

    // Offline grace period: Allow access if we have a cached session
    // Learning note: This prevents users from being locked out when offline
    // with an expired token. They can still access cached data in IndexedDB.
    // When back online, the session will be validated/refreshed.
    if (!this._isOnline() && this.hasCachedSession()) {
      console.log('Offline with cached session - allowing grace period access');
      return true;
    }

    return false;
  });
  readonly userEmail = computed(() => this._currentUser()?.email ?? null);
  readonly userId = computed(() => this._currentUser()?.id ?? null);

  constructor() {
    // Check if Supabase is properly configured
    // Learning note: This allows the app to work without Supabase credentials
    if (this.isValidSupabaseConfig()) {
      this._isConfigured.set(true);

      // Initialize Supabase client
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey,
        {
          auth: {
            // Persist session in localStorage
            persistSession: true,
            // Auto-refresh tokens before they expire
            autoRefreshToken: true,
            // Detect session from URL (for OAuth redirects)
            detectSessionInUrl: true,
          },
        }
      );

      // Initialize auth state and listen for changes
      this.initializeAuth();
    } else {
      // Supabase not configured - app works in offline-only mode
      console.warn(
        'Supabase not configured. App will work in offline-only mode. ' +
          'To enable cloud sync, update src/environments/environment.ts with your Supabase credentials.'
      );
      this._isInitialized.set(true);
    }

    // Listen for online/offline events
    // Learning note: This helps the sync service know when to attempt syncing
    this.setupOnlineListener();
  }

  /**
   * Check if Supabase is properly configured with valid credentials
   */
  private isValidSupabaseConfig(): boolean {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;

    // Check if URL is a valid HTTP/HTTPS URL (not a placeholder)
    if (!url || !key) return false;
    if (url.includes('YOUR_') || key.includes('YOUR_')) return false;

    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check if there's a cached session in localStorage
   *
   * Learning note: Supabase stores the auth session in localStorage with a
   * specific key pattern based on the project URL. This method checks if a
   * cached session exists, which is used for offline grace period access.
   *
   * Even if the token has expired, having a cached session indicates the user
   * was previously authenticated. This allows offline access to cached data
   * until they go back online and can refresh their session.
   */
  hasCachedSession(): boolean {
    try {
      // Supabase storage key format: sb-{project-ref}-auth-token
      // Extract project reference from URL (e.g., "abc123" from "https://abc123.supabase.co")
      const projectRef = new URL(environment.supabaseUrl).hostname.split(
        '.'
      )[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        // Parse to verify it's valid JSON with expected structure
        const parsed = JSON.parse(cached);
        return parsed && (parsed.access_token || parsed.user);
      }

      return false;
    } catch (error) {
      console.warn('Error checking cached session:', error);
      return false;
    }
  }

  /**
   * Initialize auth state and set up auth change listener
   * Learning note: Supabase persists sessions in localStorage, so we need to
   * restore the session on app initialization
   */
  private async initializeAuth(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Get current session from storage
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (session) {
        // Validate that the user still exists in the database
        const userStillExists = await this.validateUserExists(session.user.id);

        if (userStillExists) {
          this._session.set(session);
          this._currentUser.set(session.user);
        } else {
          // User was deleted from database - force logout
          console.warn('User no longer exists in database - logging out');
          await this.forceLogout();
        }
      }

      // Listen for auth state changes (login, logout, token refresh)
      this.supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          this._session.set(session);
          this._currentUser.set(session?.user ?? null);

          // Log auth events for debugging
          console.log('Auth state changed:', event, session?.user?.email);
        }
      );
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      this._isInitialized.set(true);
    }
  }

  /**
   * Validate that the authenticated user still exists in the database
   * Returns false if user was deleted from Supabase dashboard
   */
  private async validateUserExists(userId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      // Try to fetch the user's auth data
      const { data, error } = await this.supabase.auth.getUser();

      if (error || !data.user) {
        console.warn('User validation failed:', error?.message);
        return false;
      }

      return data.user.id === userId;
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  /**
   * Force logout when user is deleted or session is invalid
   * Clears local storage and resets auth state
   */
  private async forceLogout(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Sign out from Supabase (clears tokens)
      await this.supabase.auth.signOut();

      // Clear auth state
      this._session.set(null);
      this._currentUser.set(null);

      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during force logout:', error);
      // Even if signOut fails, clear local state and redirect
      this._session.set(null);
      this._currentUser.set(null);
      window.location.href = '/login';
    }
  }

  /**
   * Set up listener for online/offline status
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this._isOnline.set(true);
      console.log('App is online - sync can proceed');
    });

    window.addEventListener('offline', () => {
      this._isOnline.set(false);
      console.log('App is offline - sync paused');
    });
  }

  /**
   * Get the Supabase client for direct access
   * Returns null if not configured
   * Learning note: Use this sparingly - prefer the methods below for common operations
   */
  get client(): SupabaseClient | null {
    return this.supabase;
  }

  // ==================== AUTHENTICATION METHODS ====================

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, user: data.user ?? undefined };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign up with email and password
   * Learning note: By default, Supabase sends a confirmation email.
   * User needs to confirm email before they can sign in.
   *
   * Important: Supabase returns success even if email already exists (security feature)
   * to prevent email enumeration attacks. Check for identities to detect this case.
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect after email confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error };
      }

      // Check if user already exists with this email
      // If identities array is empty, the email is already registered
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        return {
          success: false,
          error: {
            message:
              'This email is already registered. Please sign in instead or use a different email.',
            name: 'AuthApiError',
            status: 400,
          } as AuthError,
        };
      }

      return { success: true, user: data.user ?? undefined };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with Google OAuth
   * Learning note: This redirects to Google's login page, then back to your app
   */
  async signInWithGoogle(): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Request additional scopes if needed
          // scopes: 'email profile'
        },
      });

      if (error) {
        return { success: false, error };
      }

      // OAuth redirects, so success here just means redirect started
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  /**
   * Reset password - sends a password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  /**
   * Update password (for authenticated users)
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: { message: 'Supabase not configured' } as AuthError,
      };
    }
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: error as AuthError,
      };
    }
  }

  // ==================== DATABASE SYNC METHODS ====================
  // Learning note: These methods handle syncing local data with Supabase.
  // They're designed to work with the SyncService for offline-first functionality.

  /**
   * Handle database errors and detect deleted/invalid users
   * Returns true if error was handled (user logged out), false otherwise
   */
  private async handleDatabaseError(error: unknown): Promise<boolean> {
    // Check for common "user deleted" error patterns
    const errorMessage =
      (error as { message?: string })?.message?.toLowerCase() || '';
    const errorCode = (error as { code?: string })?.code;

    // JWT expired or invalid user errors
    const isInvalidUser =
      errorCode === 'PGRST301' || // JWT expired
      errorCode === '42501' || // Insufficient privilege (RLS blocked)
      errorMessage.includes('jwt') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('not found');

    if (isInvalidUser) {
      console.warn('Detected invalid/deleted user - forcing logout');
      await this.forceLogout();
      return true;
    }

    return false;
  }

  /**
   * Convert local CalendarEvent to Supabase format
   * Learning note: We need to handle type conversions between local and remote formats
   */
  private toSupabaseEvent(event: CalendarEvent, userId: string): SupabaseEvent {
    // Convert DateInput (from FullCalendar) to string
    const startStr =
      typeof event.start === 'string'
        ? event.start
        : event.start instanceof Date
        ? event.start.toISOString().split('T')[0]
        : String(event.start ?? '');

    const endStr = event.end
      ? typeof event.end === 'string'
        ? event.end
        : event.end instanceof Date
        ? event.end.toISOString().split('T')[0]
        : String(event.end)
      : undefined;

    const now = new Date().toISOString();

    return {
      id: event.id,
      user_id: userId,
      title: event.title ?? '',
      description: event.description,
      start: startStr,
      end: endStr,
      all_day: event.allDay ?? true,
      repeat_annually: event.repeatAnnually ?? false,
      category: event.category,
      color: event.color,
      reminder_days_before: event.reminderDaysBefore,
      reminder_enabled: event.reminderEnabled ?? false,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Convert Supabase event to local format
   */
  private fromSupabaseEvent(event: SupabaseEvent): CalendarEvent {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      allDay: event.all_day,
      repeatAnnually: event.repeat_annually,
      category: event.category as CalendarEvent['category'],
      color: event.color,
      reminderDaysBefore: event.reminder_days_before,
      reminderEnabled: event.reminder_enabled,
    };
  }

  /**
   * Convert local Contact to Supabase format
   */
  private toSupabaseContact(contact: Contact, userId: string): SupabaseContact {
    const now = new Date().toISOString();
    return {
      id: contact.id,
      user_id: userId,
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      created_at: contact.createdAt ?? now,
      updated_at: contact.updatedAt ?? now,
    };
  }

  /**
   * Convert Supabase contact to local format
   */
  private fromSupabaseContact(contact: SupabaseContact): Contact {
    return {
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    };
  }

  /**
   * Convert local Occasion to Supabase format
   */
  private toSupabaseOccasion(
    occasion: Occasion,
    userId: string
  ): SupabaseOccasion {
    const now = new Date().toISOString();
    return {
      id: occasion.id,
      user_id: userId,
      contact_id: occasion.contactId,
      title: occasion.title,
      type: occasion.type,
      date: occasion.date,
      year: occasion.year,
      repeat_annually: occasion.repeatAnnually,
      reminder_days_before: occasion.reminderDaysBefore,
      reminder_enabled: occasion.reminderEnabled,
      created_at: occasion.createdAt ?? now,
      updated_at: occasion.updatedAt ?? now,
    };
  }

  /**
   * Convert Supabase occasion to local format
   */
  private fromSupabaseOccasion(occasion: SupabaseOccasion): Occasion {
    return {
      id: occasion.id,
      contactId: occasion.contact_id,
      title: occasion.title,
      type: occasion.type,
      date: occasion.date,
      year: occasion.year,
      repeatAnnually: occasion.repeat_annually,
      reminderDaysBefore: occasion.reminder_days_before,
      reminderEnabled: occasion.reminder_enabled,
      createdAt: occasion.created_at,
      updatedAt: occasion.updated_at,
    };
  }

  // ==================== EVENTS SYNC ====================

  /**
   * Fetch all events for the current user from Supabase
   */
  async fetchEvents(): Promise<CalendarEvent[]> {
    if (!this.supabase || !this.isAuthenticated()) {
      console.warn(
        'Cannot fetch events: not authenticated or Supabase not configured'
      );
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('calendar_events')
        .select('*')
        .order('start', { ascending: true });

      if (error) {
        console.error('Failed to fetch events:', error);
        // Check if user was deleted
        await this.handleDatabaseError(error);
        return [];
      }

      return (data as SupabaseEvent[]).map((e) => this.fromSupabaseEvent(e));
    } catch (error) {
      console.error('Error fetching events:', error);
      await this.handleDatabaseError(error);
      return [];
    }
  }

  /**
   * Upsert events to Supabase (insert or update)
   */
  async upsertEvents(events: CalendarEvent[]): Promise<boolean> {
    const userId = this.userId();
    if (!this.supabase || !userId) {
      console.warn(
        'Cannot upsert events: not authenticated or Supabase not configured'
      );
      return false;
    }

    try {
      const supabaseEvents = events.map((e) => this.toSupabaseEvent(e, userId));

      const { error } = await this.supabase
        .from('calendar_events')
        .upsert(supabaseEvents, { onConflict: 'id' });

      if (error) {
        console.error('Failed to upsert events:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error upserting events:', error);
      return false;
    }
  }

  /**
   * Delete an event from Supabase
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.supabase || !this.isAuthenticated()) {
      console.warn(
        'Cannot delete event: not authenticated or Supabase not configured'
      );
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Failed to delete event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  // ==================== CONTACTS SYNC ====================
  // TODO: Implement when contacts table is created

  /**
   * Fetch all contacts for the current user from Supabase
   */
  async fetchContacts(): Promise<Contact[]> {
    // Table not yet created
    console.warn('Contacts table not yet implemented in Supabase');
    return [];
  }

  /**
   * Upsert contacts to Supabase
   */
  async upsertContacts(_contacts: Contact[]): Promise<boolean> {
    console.warn('Contacts table not yet implemented in Supabase');
    return false;
  }

  /**
   * Delete a contact from Supabase
   */
  async deleteContact(_contactId: string): Promise<boolean> {
    console.warn('Contacts table not yet implemented in Supabase');
    return false;
  }

  // ==================== OCCASIONS SYNC ====================
  // TODO: Implement when occasions table is created

  /**
   * Fetch all occasions for the current user from Supabase
   */
  async fetchOccasions(): Promise<Occasion[]> {
    console.warn('Occasions table not yet implemented in Supabase');
    return [];
  }

  /**
   * Upsert occasions to Supabase
   */
  async upsertOccasions(_occasions: Occasion[]): Promise<boolean> {
    console.warn('Occasions table not yet implemented in Supabase');
    return false;
  }

  /**
   * Delete an occasion from Supabase
   */
  async deleteOccasion(_occasionId: string): Promise<boolean> {
    console.warn('Occasions table not yet implemented in Supabase');
    return false;
  }
}
