
import { format, formatInTimeZone } from 'date-fns-tz';

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  return date;
}

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  const utcDate = new Date(date);
  return formatInTimeZone(utcDate, timezone, formatStr);
}

export function utcToLocalInput(date: string | Date, timezone: string = 'UTC'): string {
  const utcDate = new Date(date);
  return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm");
}
