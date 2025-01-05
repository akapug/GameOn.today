import { format, parseISO, formatISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Default timezone fallback if none specified
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Format a date with timezone for display
 */
export function formatWithTimezone(
  date: string | Date, 
  formatStr: string = 'PPpp', // Default format: "Apr 29, 2023, 7:14:00 PM"
  timezone: string = DEFAULT_TIMEZONE
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(parsedDate, timezone, formatStr);
}

/**
 * Convert a local datetime input value to UTC for storage
 */
export function localInputToUTC(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const localDate = new Date(dateStr);
  const utcString = formatInTimeZone(localDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return new Date(utcString);
}

/**
 * Convert a UTC date to local datetime input value
 */
export function utcToLocalInput(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(parsedDate, timezone, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Convert a date string or Date object to UTC date for storage
 */
export function toUTC(date: string | Date, timezone: string = DEFAULT_TIMEZONE): Date {
  if (typeof date === 'string') {
    // If it's already an ISO string with UTC timezone, just parse it
    if (date.endsWith('Z')) {
      return parseISO(date);
    }
    // Otherwise, treat it as a date in the specified timezone
    return localInputToUTC(date, timezone);
  }
  return localInputToUTC(date.toISOString(), timezone);
}

/**
 * Get user's local timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();

  // Convert both dates to the target timezone for comparison
  const dateStr = formatInTimeZone(parsedDate, timezone, 'yyyy-MM-dd HH:mm:ss');
  const nowStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd HH:mm:ss');

  const zonedDate = new Date(dateStr);
  const zonedNow = new Date(nowStr);

  const diffInHours = Math.abs(zonedDate.getTime() - zonedNow.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatInTimeZone(parsedDate, timezone, 'p'); // Time only for today
  } else if (diffInHours < 48) {
    return `Yesterday at ${formatInTimeZone(parsedDate, timezone, 'p')}`;
  } else {
    return formatInTimeZone(parsedDate, timezone, 'PPp'); // Full date and time
  }
}

/**
 * Format a date for API storage (ISO string in UTC)
 */
export function formatForStorage(date: Date): string {
  return date.toISOString();
}