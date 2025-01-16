
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
  // Convert local time in specified timezone to UTC
  const localDate = new Date(dateStr);
  const utcDate = new Date(formatInTimeZone(localDate, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
  const offset = new Date(localDate.toLocaleString('en-US', { timeZone: timezone })).getTime() - 
                 new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  return new Date(utcDate.getTime() - offset);
}

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }
    const formattedDate = formatInTimeZone(parsedDate, timezone, formatStr);
    const tzAbbr = new Date().toLocaleTimeString('en-us',{timeZone: timezone, timeZoneName: 'short'}).split(' ')[2];
    return `${formattedDate} ${tzAbbr}`;
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
