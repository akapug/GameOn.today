
import { format, parseISO } from 'date-fns';
import { utcToZonedTime, format as formatTz } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(parsedDate, timezone);
  return formatTz(zonedDate, formatStr, { timeZone: timezone });
}

export function createUTCDate(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  return date.toISOString();
}
