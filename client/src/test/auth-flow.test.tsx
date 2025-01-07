
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('Authentication Flow', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  it('handles sign in flow', async () => {
    render(<AuthProvider>{() => {
      const { user } = useAuth();
      return user ? <div>Signed in</div> : <button>Sign in</button>;
    }}</AuthProvider>, { wrapper });

    await userEvent.click(screen.getByText('Sign in'));
    await waitFor(() => {
      expect(screen.getByText('Signed in')).toBeInTheDocument();
    });
  });

  it('handles authentication errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Auth failed'));
    render(<AuthProvider>{() => {
      const { error } = useAuth();
      return error ? <div>Error: {error.message}</div> : null;
    }}</AuthProvider>, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Error: Auth failed')).toBeInTheDocument();
    });
  });
});
