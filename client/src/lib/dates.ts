import { format } from 'date-fns';

// Display UTC time from DB in local timezone
export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return format(d, formatStr);
}

// Convert local time to UTC for DB storage
export function toUTC(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

// Convert UTC time from DB to local time for form inputs
export function utcToLocalInput(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return new Date(date).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T');
}

// Convert local form input to UTC for DB storage
export function localToUTCInput(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Failed to get user timezone:', e);
    return 'UTC';
  }
}