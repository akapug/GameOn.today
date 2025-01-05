
import { format, parseISO } from 'date-fns';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr, { timeZone: timezone });
}

export function createUTCDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ));
}
