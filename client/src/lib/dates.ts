import { format } from 'date-fns';

import { formatInTimeZone } from 'date-fns-tz';

// Display UTC time from DB in specified timezone
export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return formatInTimeZone(d, timezone, formatStr);
}

// Convert local time to UTC for DB storage
export function toUTC(dateStr: string, timezone: string): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date();
  return date;
}

// Convert UTC time from DB to specified timezone for form inputs
export function utcToLocalInput(dateStr: string, timezone: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}

// Convert timezone form input to UTC for DB storage
export function localToUTCInput(dateStr: string, timezone: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}