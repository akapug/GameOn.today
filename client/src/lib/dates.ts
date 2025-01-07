
import { format, formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  return formatInTimeZone(date, timezone, formatStr);
}

export function toUTC(dateStr: string, timezone: string): Date {
  // Convert local time to UTC
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = new Date().getTimezoneOffset();
  return new Date(utcDate.getTime() + (offset * 60000));
}

export function utcToLocalInput(dateStr: string, timezone: string = 'UTC'): string {
  const date = new Date(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm", { timeZone: timezone });
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}
