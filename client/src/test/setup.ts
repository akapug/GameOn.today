import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { useAuth } from '../components/AuthProvider';

expect.extend(matchers);

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock fetch globally
global.fetch = vi.fn();

// Mock AuthProvider
vi.mock('../components/AuthProvider', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children
}));

// Mock activities data
vi.mock('../lib/activities', () => ({
  useActivities: () => ({
    data: [
      { id: 1, name: "Basketball", color: "orange", icon: "circle" }
    ],
    isLoading: false,
    error: null
  }),
  defaultActivities: [
    { id: 1, name: "Basketball", color: "orange", icon: "circle" }
  ]
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const wrapper = ({ children }) => (
  React.createElement(AuthProvider, null,
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
);

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: 'test-user', displayName: 'Test User' },
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});