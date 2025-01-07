import { describe, it, expect } from 'vitest';
import { formatWithTimezone, toUTC, getUserTimezone } from '../dates';

describe('date utilities', () => {
  it('should format date with timezone', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const formatted = formatWithTimezone(date, 'America/Los_Angeles');
    expect(formatted).toMatch(/\d{1,2}:\d{2} [AP]M PST/);
  });

  it('should convert to UTC', () => {
    const localDate = '2024-01-01T10:00';
    const timezone = 'America/Los_Angeles';
    const utcDate = toUTC(localDate, timezone);
    expect(utcDate).toBeInstanceOf(Date);
  });

  it('should get user timezone', () => {
    const timezone = getUserTimezone();
    expect(timezone).toBeDefined();
    expect(typeof timezone).toBe('string');
  });
});