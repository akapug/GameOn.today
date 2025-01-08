import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../EventCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../AuthProvider';

const mockEvent = {
  id: 1,
  urlHash: 'test-event',
  title: 'Test Event',
  location: 'Test Location',
  date: new Date().toISOString(),
  participantThreshold: 5,
  participants: [],
  eventType: { id: 1, name: 'Test Type', color: '#000000' },
  isPrivate: false,
  creatorId: 'test-creator',
  creatorName: 'Test Creator',
  timezone: 'UTC',
  weather: null
};

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

describe('EventCard', () => {
  it('renders event details correctly', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EventCard event={mockEvent} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});