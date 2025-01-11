
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventTypes } from '../activities';
import { queryKeys } from '../queryClient';
import React from 'react';

describe('eventTypes', () => {
  it('should return event types data structure', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useEventTypes(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.queryKey).toEqual(queryKeys.eventTypes);
  });
});
