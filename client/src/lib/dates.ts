
import { parseISO, format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'UTC';

export function formatWithTimezone(
  date: string | Date,
  formatStr: string = 'PPP p',
  timezone: string = DEFAULT_TIMEZONE,
  includeZone: boolean = true
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const formattedDate = formatInTimeZone(parsedDate, timezone, formatStr);

  if (!includeZone) return formattedDate;

  const tzAbbr = new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).split(' ')[2];

  return `${formattedDate} (${tzAbbr})`;
}

export function toUTC(
  dateStr: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return new Date(dateStr);
}

export function utcToLocalInput(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(parsedDate.getTime())) return '';
    return formatInTimeZone(parsedDate, timezone, "yyyy-MM-dd'T'HH:mm");
  } catch (e) {
    console.warn('Invalid date:', date);
    return '';
  }
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return DEFAULT_TIMEZONE;
  }
}
