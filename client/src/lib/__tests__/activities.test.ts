import { describe, it, expect } from 'vitest';
import { useActivities } from '../activities';
import { renderHook } from '@testing-library/react';

describe('activities', () => {
  it('should return activities data structure', () => {
    const { result } = renderHook(() => useActivities());
    expect(result.current.activities).toBeDefined();
    expect(Array.isArray(result.current.activities)).toBe(true);
  });

  it('should have required activity properties', () => {
    const { result } = renderHook(() => useActivities());
    const activity = result.current.activities[0];
    expect(activity).toHaveProperty('id');
    expect(activity).toHaveProperty('name');
    expect(activity).toHaveProperty('icon');
  });
});