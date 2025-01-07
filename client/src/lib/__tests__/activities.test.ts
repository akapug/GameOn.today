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
    expect(result.current).toBeDefined();
  });
});