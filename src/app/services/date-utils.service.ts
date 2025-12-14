/**
 * Date Utilities Service
 *
 * Centralizes all date-related operations used across the application.
 * This service provides consistent date parsing, formatting, and calculations
 * to avoid code duplication and ensure uniformity.
 *
 * Learning note: This is a stateless utility service. It uses providedIn: 'root'
 * for singleton behavior, but all methods are pure functions that could also
 * be used as standalone utilities.
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
  /**
   * Parse various date input formats into a Date object
   * Handles Date objects, ISO strings, and other string formats
   *
   * @param date - Date input (Date object, string, number, or undefined)
   * @returns Date object or null if parsing fails
   */
  parseDate(date: Date | string | number | undefined | null): Date | null {
    if (!date) return null;

    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : new Date(date);
    }

    if (typeof date === 'string' || typeof date === 'number') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  /**
   * Parse a date string in MM-DD or YYYY-MM-DD format
   * Used for occasion dates that may or may not include year
   *
   * @param dateStr - Date string in MM-DD or YYYY-MM-DD format
   * @returns Object with month, day, and optional year
   */
  parseOccasionDate(
    dateStr: string
  ): { month: number; day: number; year?: number } | null {
    if (!dateStr) return null;

    const parts = dateStr.split('-').map(Number);
    if (parts.length === 2) {
      // MM-DD format
      const [month, day] = parts;
      return { month, day };
    } else if (parts.length === 3) {
      // YYYY-MM-DD format
      const [year, month, day] = parts;
      return { year, month, day };
    }

    return null;
  }

  /**
   * Get the start of day (midnight) for a given date
   * Useful for date comparisons without time consideration
   *
   * @param date - Date to normalize
   * @returns New Date object set to midnight
   */
  startOfDay(date: Date | string | number): Date {
    const parsed = this.parseDate(date);
    if (!parsed) return new Date();

    const result = new Date(parsed);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of day (23:59:59.999) for a given date
   *
   * @param date - Date to normalize
   * @returns New Date object set to end of day
   */
  endOfDay(date: Date | string | number): Date {
    const parsed = this.parseDate(date);
    if (!parsed) return new Date();

    const result = new Date(parsed);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get today's date at midnight
   *
   * @returns Today's date at start of day
   */
  today(): Date {
    return this.startOfDay(new Date());
  }

  /**
   * Get current timestamp in ISO format
   * Used for createdAt/updatedAt fields
   *
   * @returns ISO string timestamp
   */
  nowISO(): string {
    return new Date().toISOString();
  }

  /**
   * Format a date for display in short format
   * Example: "Dec 1, 2025"
   *
   * @param date - Date to format
   * @param options - Optional Intl.DateTimeFormat options
   * @returns Formatted date string
   */
  formatShort(
    date: Date | string | number | undefined | null,
    options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  ): string {
    const parsed = this.parseDate(date);
    if (!parsed) return '';

    return parsed.toLocaleDateString('en-US', options);
  }

  /**
   * Format a date showing only month and day
   * Example: "December 1"
   *
   * @param date - Date to format
   * @returns Formatted string with month and day
   */
  formatMonthDay(date: Date | string | number | undefined | null): string {
    const parsed = this.parseDate(date);
    if (!parsed) return '';

    return parsed.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format an occasion date string (MM-DD or YYYY-MM-DD) for display
   * Example: "January 15"
   *
   * @param dateStr - Date string in MM-DD or YYYY-MM-DD format
   * @returns Formatted string with month and day
   */
  formatOccasionDate(dateStr: string): string {
    const parsed = this.parseOccasionDate(dateStr);
    if (!parsed) return '';

    // Use a placeholder year for formatting
    const date = new Date(2000, parsed.month - 1, parsed.day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  /**
   * Format a Date object to YYYY-MM-DD string
   *
   * @param date - Date to format
   * @returns Date string in YYYY-MM-DD format
   */
  toDateString(date: Date | string | number | undefined | null): string {
    const parsed = this.parseDate(date);
    if (!parsed) return '';

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a Date object to MM-DD string (for occasions without year)
   *
   * @param date - Date to format
   * @returns Date string in MM-DD format
   */
  toMonthDayString(date: Date | string | number | undefined | null): string {
    const parsed = this.parseDate(date);
    if (!parsed) return '';

    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
   * Calculate the number of days between two dates
   *
   * @param from - Start date
   * @param to - End date
   * @returns Number of days (positive if to > from)
   */
  daysBetween(
    from: Date | string | number,
    to: Date | string | number
  ): number {
    const fromDate = this.startOfDay(from);
    const toDate = this.startOfDay(to);

    const diffTime = toDate.getTime() - fromDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days until a future date from today
   *
   * @param date - Target date
   * @returns Number of days until the date (negative if in past)
   */
  daysUntil(date: Date | string | number): number {
    return this.daysBetween(new Date(), date);
  }

  /**
   * Get a human-readable string for days until a date
   * Examples: "Today", "Tomorrow", "In 5 days", "2 days ago"
   *
   * @param date - Target date
   * @returns Human-readable string
   */
  daysUntilText(date: Date | string | number | undefined | null): string {
    const parsed = this.parseDate(date);
    if (!parsed) return '';

    const days = this.daysUntil(parsed);

    if (days < -1) return `${Math.abs(days)} days ago`;
    if (days === -1) return 'Yesterday';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    if (days < 14) return 'In 1 week';
    if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
    if (days < 60) return 'In 1 month';
    if (days < 365) return `In ${Math.floor(days / 30)} months`;
    return parsed.toLocaleDateString();
  }

  /**
   * Calculate years since a given year (for age/anniversary calculations)
   *
   * @param year - The starting year
   * @returns Number of years since that year
   */
  yearsSince(year: number | undefined | null): number | null {
    if (!year) return null;
    return new Date().getFullYear() - year;
  }

  /**
   * Get the next occurrence of a recurring date (MM-DD format)
   * Returns this year's date if it hasn't passed, otherwise next year's
   *
   * @param dateStr - Date string in MM-DD or YYYY-MM-DD format
   * @returns Next occurrence Date
   */
  getNextOccurrence(dateStr: string): Date {
    const parsed = this.parseOccasionDate(dateStr);
    if (!parsed) return new Date();

    const today = this.today();
    const currentYear = today.getFullYear();

    // Create this year's occurrence
    let nextDate = new Date(currentYear, parsed.month - 1, parsed.day);

    // If it's already passed this year, use next year
    if (nextDate < today) {
      nextDate = new Date(currentYear + 1, parsed.month - 1, parsed.day);
    }

    return nextDate;
  }

  /**
   * Create a Date from occasion date parts
   *
   * @param month - Month (1-12)
   * @param day - Day of month
   * @param year - Optional year
   * @returns Date object
   */
  createDateFromParts(month: number, day: number, year?: number): Date {
    const useYear = year ?? new Date().getFullYear();
    return new Date(useYear, month - 1, day);
  }

  /**
   * Check if a date is within a range (inclusive)
   *
   * @param date - Date to check
   * @param start - Range start
   * @param end - Range end
   * @returns True if date is within range
   */
  isWithinRange(
    date: Date | string | number,
    start: Date | string | number,
    end: Date | string | number
  ): boolean {
    const checkDate = this.startOfDay(date);
    const startDate = this.startOfDay(start);
    const endDate = this.startOfDay(end);

    return checkDate >= startDate && checkDate <= endDate;
  }

  /**
   * Add days to a date
   *
   * @param date - Starting date
   * @param days - Number of days to add (can be negative)
   * @returns New Date with days added
   */
  addDays(date: Date | string | number, days: number): Date {
    const parsed = this.parseDate(date);
    if (!parsed) return new Date();

    const result = new Date(parsed);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Check if two dates are the same day
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns True if same day
   */
  isSameDay(
    date1: Date | string | number | undefined | null,
    date2: Date | string | number | undefined | null
  ): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);

    if (!d1 || !d2) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Check if a date is today
   *
   * @param date - Date to check
   * @returns True if date is today
   */
  isToday(date: Date | string | number | undefined | null): boolean {
    return this.isSameDay(date, new Date());
  }

  /**
   * Get the current year
   *
   * @returns Current year number
   */
  currentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Parse FullCalendar DateInput type to a Date object
   * Learning note: FullCalendar uses DateInput which can be Date, string, number, or array [year, month, day]
   *
   * @param value - DateInput value from FullCalendar
   * @returns Parsed Date object
   */
  parseDateInput(value: Date | string | number | number[] | undefined | null): Date {
    if (!value) {
      return this.today();
    }

    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    // Handle array format [year, month, day] from FullCalendar
    if (Array.isArray(value)) {
      const [year, month = 0, day = 1] = value;
      return new Date(year, month, day);
    }

    const isoValue = typeof value === 'string' ? value : String(value);

    // Handle date-only ISO strings (YYYY-MM-DD) to avoid timezone issues
    // Learning note: When parsing "2025-01-15" directly with new Date(),
    // it's treated as UTC midnight, which can shift the date in local timezone
    if (isoValue.length === 10 && isoValue.includes('-')) {
      const [year, month, day] = isoValue.split('-').map(Number);
      return new Date(year, (month ?? 1) - 1, day ?? 1);
    }

    return new Date(isoValue);
  }
}
