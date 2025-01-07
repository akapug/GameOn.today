
import { format, formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  return formatInTimeZone(date, timezone, formatStr);
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const tzOffset = tzDate.getTime() - date.getTime();
  return new Date(date.getTime() - tzOffset);
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
