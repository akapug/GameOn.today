
import { parseISO, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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
    
    const formattedTime = formatInTimeZone(parsedDate, timezone, formatStr);
    
    // For US Pacific timezone, just append PST/PDT as appropriate
    if (timezone === 'America/Los_Angeles') {
      // Determine if date is in PDT (Mar-Nov) or PST (Nov-Mar)
      const isPDT = parsedDate.getMonth() > 2 && parsedDate.getMonth() < 11;
      return `${formattedTime} ${isPDT ? 'PDT' : 'PST'}`;
    }
    
    return formattedTime;
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
