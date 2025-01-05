import { parseISO, format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

// Default timezone fallback if none specified
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Format a date with timezone for display
 */
export function formatWithTimezone(
  date: string | Date,
  formatStr: string = 'PPP p',
  timezone: string = DEFAULT_TIMEZONE,
  includeZone: boolean = true
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const formattedDate = formatInTimeZone(parsedDate, timezone, formatStr);

  if (!includeZone) return formattedDate;

  // Add timezone abbreviation
  const tzAbbr = new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).split(' ')[2];

  return `${formattedDate} (${tzAbbr})`;
}

/**
 * Convert a date to UTC for storage, preserving the original timezone's wall time
 */
export function toUTC(
  dateStr: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ));
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