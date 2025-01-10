
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wrapper } from './setup';
import { AuthDialog } from '../components/AuthDialog';

describe('Authentication Flow', () => {
  it('shows sign in dialog', () => {
    render(<AuthDialog show={true} onDismiss={() => {}} />, { wrapper });
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('handles sign in with Google', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn();
    
    render(
      <AuthDialog 
        show={true} 
        onDismiss={() => {}}
        onSignInClick={mockSignIn}
      />, 
      { wrapper }
    );
    
    const signInButton = screen.getByRole('button', { name: /Continue with Google/i });
    await user.click(signInButton);
    
    expect(mockSignIn).toHaveBeenCalled();
  });
});
