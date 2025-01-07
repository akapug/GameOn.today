
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
  const formattedDate = formatInTimeZone(new Date(date), timezone, formatStr);
  const tzAbbr = new Date().toLocaleTimeString('en-us',{timeZone: timezone, timeZoneName: 'short'}).split(' ')[2];
  return `${formattedDate} ${tzAbbr}`;
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
