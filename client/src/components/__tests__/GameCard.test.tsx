
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../EventCard';

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
  timezone: 'UTC'
};

describe('EventCard', () => {
  it('renders event details correctly', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => new QueryClient()
  };
});

describe('EventCard', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockEvent = {
    id: 1,
    urlHash: 'test-event',
    title: 'Test Event',
    location: 'Test Location',
    date: new Date().toISOString(),
    participantThreshold: 10,
    participants: [],
    timezone: 'America/Los_Angeles',
    eventTypeId: 1,
    eventType: { id: 1, name: 'Test Type', color: '#000000' }
  };

  beforeEach(() => {
    queryClient.clear();
  });

  it('should render event title', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('should render location', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});
