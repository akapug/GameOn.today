import { format, formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  // Add timezone abbreviation to the format string if it doesn't end with 'z' or 'Z'
  const formatWithTz = formatStr.endsWith('z') || formatStr.endsWith('Z') 
    ? formatStr 
    : `${formatStr} (z)`;
  return formatInTimeZone(d, timezone || 'UTC', formatWithTz);
}

export function toUTC(dateStr: string, timezone: string): Date {
  const date = new Date(dateStr);
  const utcTime = new Date(date.toLocaleString('en-US', { timeZone }));
  const offset = utcTime.getTime() - date.getTime();
  return new Date(date.getTime() - offset);
}

export function utcToLocalInput(dateStr: string, timezone: string = 'UTC'): string {
  const date = new Date(dateStr);
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  const offset = date.getTime() - tzDate.getTime();
  const localDate = new Date(date.getTime() + offset);
  return format(localDate, "yyyy-MM-dd'T'HH:mm");
}

export function localToUTCInput(dateStr: string, timezone: string = 'UTC'): string {
  const date = new Date(dateStr);
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  const offset = tzDate.getTime() - date.getTime();
  const utcDate = new Date(date.getTime() - offset);
  return utcDate.toISOString();
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}