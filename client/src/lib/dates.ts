import { format, formatInTimeZone } from 'date-fns-tz';

export function formatWithTimezone(date: string | Date, formatStr: string, timezone: string = 'UTC'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  // Convert UTC date to target timezone for display
  return formatInTimeZone(d, timezone || 'UTC', formatStr);
}

export function toUTC(dateStr: string, timezone: string = 'UTC'): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const dateParts: any = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateParts[part.type] = parseInt(part.value, 10);
      }
    });

    return new Date(Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour,
      dateParts.minute,
      dateParts.second
    ));
  } catch (e) {
    console.error('Error converting to UTC:', e);
    return new Date(dateStr);
  }
}

export function utcToLocalInput(dateStr: string, timezone: string = 'UTC'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}

export function localToUTCInput(dateStr: string, timezone: string = 'UTC'): string {
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