
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(parsedDate, timezone, formatStr);
}

export function createUTCDate(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  return date.toISOString();
}
