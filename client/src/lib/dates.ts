
import { format, formatInTimeZone } from 'date-fns-tz';

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  return formatInTimeZone(new Date(date), timezone, formatStr);
}

export function utcToLocalInput(date: string | Date, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  return formatInTimeZone(new Date(date), userTimezone, "yyyy-MM-dd'T'HH:mm");
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  const userTimezone = timezone || getUserTimezone();
  const utcDate = new Date(formatInTimeZone(date, userTimezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
  return utcDate;
}
