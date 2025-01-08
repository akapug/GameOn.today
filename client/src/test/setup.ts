import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../components/AuthProvider';
import { MobileProvider } from '../hooks/use-mobile.tsx';

expect.extend(matchers);

const mockAuth = {
  user: { uid: 'test-user', displayName: 'Test User' },
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
};

vi.mock('../components/AuthProvider', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuth
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export function wrapper({ children }) {
  const queryClient = createTestQueryClient();
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        MobileProvider,
        null,
        children
      )
    )
  );
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock fetch globally
global.fetch = vi.fn();

beforeEach(() => {
  vi.mocked(global.fetch).mockClear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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