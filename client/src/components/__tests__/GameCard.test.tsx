
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('GameCard', () => {
  const mockGame = {
    id: 1,
    title: 'Test Game',
    date: new Date().toISOString(),
    location: 'Test Location',
    playerThreshold: 10,
    players: [],
    timezone: 'America/Los_Angeles',
    activityId: 1
  };

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should render game title', () => {
    render(<GameCard game={mockGame} />, { wrapper });
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should render location', () => {
    render(<GameCard game={mockGame} />, { wrapper });
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});
