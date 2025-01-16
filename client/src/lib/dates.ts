
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
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const tzOffset = tzDate.getTime() - utcDate.getTime();
  return new Date(date.getTime() - tzOffset);
}

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }
    return formatInTimeZone(parsedDate, timezone, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
}

export function utcToLocalInput(date: string | Date | null | undefined, timezone: string = 'UTC'): string {
  if (!date) return '';
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';
    return formatInTimeZone(parsedDate, timezone, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}
