import { parseISO } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';

// Default timezone fallback if none specified
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Format a date with timezone for display
 * @param date The date to format
 * @param formatStr Format string (default: 'PPP p')
 * @param timezone Timezone to display in (default: UTC)
 * @param includeZone Whether to include timezone abbreviation (default: true)
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

  // If it's already a UTC ISO string, return as is
  if (typeof dateStr === 'string' && dateStr.endsWith('Z')) {
    return new Date(dateStr);
  }

  // Convert the local date to UTC while preserving the wall time
  const zonedDate = utcToZonedTime(date, timezone);
  return new Date(zonedDate.toISOString());
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

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
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
    return formatWithTimezone(parsedDate, 'PPp', timezone); // Full date and time with timezone
  }
}

/**
 * Format a date for API storage (ISO string in UTC)
 */
export function formatForStorage(date: Date): string {
  return date.toISOString();
}