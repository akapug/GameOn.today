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
  return format(new Date(date), formatStr, { timeZone: timezone });
}

export function utcToLocalInput(date: string | Date, timezone?: string): string {
  const d = new Date(date);
  const userTimezone = timezone || getUserTimezone();
  const localDate = new Date(d.toLocaleString('en-US', { timeZone: userTimezone }));
  return localDate.toISOString().slice(0, 16);
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const tzOffset = tzDate.getTime() - date.getTime();
  return new Date(date.getTime() - tzOffset);
}