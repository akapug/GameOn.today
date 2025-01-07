
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
  return new Date(formatInTimeZone(new Date(dateStr), timezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
}

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  return formatInTimeZone(new Date(date), timezone, formatStr);
}

export function utcToLocalInput(date: string | Date, timezone: string = 'UTC'): string {
  return formatInTimeZone(new Date(date), timezone, "yyyy-MM-dd'T'HH:mm");
}
