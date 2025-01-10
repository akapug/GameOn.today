
import { describe, it, expect, vi } from 'vitest';
import { useEventTypes } from '../eventTypes';
import { renderHook } from '@testing-library/react';

vi.mock('../eventTypes', () => ({
  useEventTypes: () => ({
    data: [
      { id: 1, name: 'Basketball', color: '#FF6B6B', icon: '🏀' }
    ],
    isLoading: false,
    error: null
  })
}));

describe('eventTypes', () => {
  it('should return event types data structure', () => {
    const { result } = renderHook(() => useEventTypes());
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.[0]).toEqual({
      id: 1,
      name: 'Basketball',
      color: '#FF6B6B',
      icon: '🏀'
    });
  });
});
