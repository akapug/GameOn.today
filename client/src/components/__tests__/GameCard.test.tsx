import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameCard from '../GameCard';

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

  it('should render game title', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('should render location', () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});