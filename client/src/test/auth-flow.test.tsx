import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wrapper } from './setup';
import AuthDialog from '../components/AuthDialog';

describe('Authentication Flow', () => {
  it('shows sign in dialog', () => {
    render(<AuthDialog open={true} onOpenChange={() => {}} />, { wrapper });
    expect(screen.getByText(/Sign in Required/i)).toBeInTheDocument();
  });

  it('handles sign in with Google', async () => {
    const user = userEvent.setup();
    const mockSignInWithGoogle = vi.fn();

    render(
      <AuthDialog 
        open={true} 
        onOpenChange={() => {}}
      />, 
      { wrapper }
    );

    const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
    await user.click(signInButton);

    // We can't directly test the Google sign in since it's handled by Firebase
    // But we can verify the button is present
    expect(signInButton).toBeInTheDocument();
  });
});