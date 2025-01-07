import { format, formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return formatInTimeZone(d, timezone || 'UTC', formatStr);
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return utcDate;
}

export function utcToLocalInput(dateStr: string, timezone: string = 'UTC'): string {
  const date = new Date(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm", { timeZone: timezone });
}

export function localToUTCInput(dateStr: string, timezone: string = 'UTC'): string {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return utcDate.toISOString();
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}