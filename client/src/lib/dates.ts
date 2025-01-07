import { parseISO, format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'UTC';

export function formatWithTimezone(
  date: string | Date,
  formatStr: string = 'PPP p',
  timezone: string = DEFAULT_TIMEZONE,
  includeZone: boolean = true
): string {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(parsedDate.getTime())) return '';
    
    // Format the time part
    const formattedTime = formatInTimeZone(parsedDate, timezone, formatStr);
    
    // If we don't need timezone, return just the formatted time
    if (!includeZone) return formattedTime;
    
    // Get timezone abbreviation
    const tzInfo = parsedDate.toLocaleTimeString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const tzAbbr = tzInfo.split(' ').pop() || 'PST';
    
    return `${formattedTime} ${tzAbbr}`;
  } catch (e) {
    console.warn('Invalid date or timezone:', date, timezone);
    return '';
  }
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