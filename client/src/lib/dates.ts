import { parseISO, format } from 'date-fns';

// Default timezone fallback if none specified
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Format a date for display, preserving wall time
 */
export function formatWithTimezone(
  date: string | Date,
  formatStr: string = 'PPP p',
  timezone: string = DEFAULT_TIMEZONE,
  includeZone: boolean = true
): string {
  // Ensure we're working with a Date object
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  // Format the time components directly without any timezone conversion
  const formattedDate = format(parsedDate, formatStr);

  if (!includeZone) return formattedDate;

  // Add timezone for display only
  return `${formattedDate} ${timezone}`;
}

/**
 * Store time components exactly as entered
 */
export function toUTC(
  dateStr: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  // If a Date object is passed, convert to string first
  const inputStr = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();

  // Create a date object from the input
  const date = new Date(inputStr);

  // Create UTC date with the exact same components to preserve wall time
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  ));
}

/**
 * Format UTC date for input, preserving wall time
 */
export function utcToLocalInput(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  // Ensure we have a Date object
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  // Format UTC components directly for input
  const components = {
    year: parsedDate.getUTCFullYear(),
    month: String(parsedDate.getUTCMonth() + 1).padStart(2, '0'),
    day: String(parsedDate.getUTCDate()).padStart(2, '0'),
    hours: String(parsedDate.getUTCHours()).padStart(2, '0'),
    minutes: String(parsedDate.getUTCMinutes()).padStart(2, '0')
  };

  return `${components.year}-${components.month}-${components.day}T${components.hours}:${components.minutes}`;
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