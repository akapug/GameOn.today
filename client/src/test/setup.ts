
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock fetch globally
global.fetch = vi.fn();

// Mock activities data
vi.mock('../lib/activities', () => ({
  useActivities: () => ({
    activities: [
      { id: 1, name: "Basketball", color: "orange", icon: "circle" }
    ]
  })
}));

// Mock QueryClient provider
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
