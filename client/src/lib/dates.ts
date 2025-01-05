import { format, parseISO, formatISO } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

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
  // Convert the local input to UTC using the specified timezone
  return zonedTimeToUtc(dateStr, timezone);
}

/**
 * Convert a UTC date to local datetime input value
 */
export function utcToLocalInput(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const zonedTime = utcToZonedTime(parsedDate, timezone);
  return formatISO(zonedTime, { representation: 'complete' }).slice(0, 16);
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
    return zonedTimeToUtc(date, timezone);
  }
  return zonedTimeToUtc(date, timezone);
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

  // Convert both dates to the same timezone for comparison
  const zonedDate = utcToZonedTime(parsedDate, timezone);
  const zonedNow = utcToZonedTime(now, timezone);

  const diffInHours = Math.abs(zonedDate.getTime() - zonedNow.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return format(zonedDate, 'p'); // Time only for today
  } else if (diffInHours < 48) {
    return `Yesterday at ${format(zonedDate, 'p')}`;
  } else {
    return format(zonedDate, 'PPp'); // Full date and time
  }
}

/**
 * Create a UTC date from components
 */
export function createUTCDate(components: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): Date {
  return new Date(Date.UTC(
    components.year,
    components.month - 1, // JS months are 0-based
    components.day,
    components.hour,
    components.minute
  ));
}

/**
 * Parse an ISO date string to a UTC Date object
 */
export function parseUTCDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Format a date for API storage (ISO string in UTC)
 */
export function formatForStorage(date: Date): string {
  return date.toISOString();
}