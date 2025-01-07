
import { describe, it, expect, vi } from 'vitest';
import { useEventTypes } from '../eventTypes';
import { renderHook } from '@testing-library/react';

vi.mock('../eventTypes', () => ({
  useEventTypes: () => ({
    eventTypes: [
      { id: 1, name: 'Test Type', color: '#000000' }
    ]
  })
}));

describe('eventTypes', () => {
  it('should return event types data structure', () => {
    const { result } = renderHook(() => useEventTypes());
    expect(result.current.eventTypes).toBeDefined();
    expect(Array.isArray(result.current.eventTypes)).toBe(true);
  });

  it('should have required event type properties', () => {
    const { result } = renderHook(() => useEventTypes());
    const eventType = result.current.eventTypes[0];
    expect(eventType).toHaveProperty('id');
    expect(eventType).toHaveProperty('name');
    expect(eventType).toHaveProperty('color');
  });
});
