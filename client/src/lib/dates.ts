
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return formatInTimeZone(d, timezone || 'UTC', formatStr);
}

export function toUTC(dateStr: string, timezone: string): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date();
  return date;
}

export function utcToLocalInput(dateStr: string, timezone: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}

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
