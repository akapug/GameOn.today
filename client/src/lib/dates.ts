
import { format, parseISO } from 'date-fns';

import { zonedTimeToUtc, format as formatDate } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDate(parsedDate, formatStr, { timeZone: timezone });
}

export function createUTCDate(dateStr: string, timezone: string) {
  return zonedTimeToUtc(dateStr, timezone);
}
