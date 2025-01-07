
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

expect.extend(matchers);

// Mock fetch globally
global.fetch = vi.fn();

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

// Mock QueryClient provider
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ 
    data: [], 
    isLoading: false,
    error: null
  }),
  QueryClient: function() {
    return {
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      invalidateQueries: vi.fn()
    };
  },
  QueryClientProvider: ({ children }) => children
}));

// Mock AuthProvider context
vi.mock('../components/AuthProvider', () => {
  const AuthProviderMock = ({ children }) => React.createElement(React.Fragment, null, children);
  return {
    useAuth: () => ({
      user: { uid: 'test-user', displayName: 'Test User' },
      loading: false,
      signInWithGoogle: vi.fn(),
      logout: vi.fn()
    }),
    AuthProvider: AuthProviderMock
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
