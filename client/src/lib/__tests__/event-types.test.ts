
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { useEventTypes } from '../activities';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('eventTypes', () => {
  it('should return event types data structure', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useEventTypes(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.queryKey).toEqual(['/api/event-types']);
  });
});
