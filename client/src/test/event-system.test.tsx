import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateEvent from '../pages/CreateEvent';
import EventCard from '../components/EventCard';
import { AuthProvider } from '../components/AuthProvider';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

const mockEvent = {
  id: 1,
  urlHash: 'test-event',
  title: 'Test Event',
  location: 'Test Location',
  date: new Date().toISOString(),
  participantThreshold: 5,
  participants: [],
  eventType: {
    id: 1,
    name: 'Test Type',
    color: '#000000',
  },
  isPrivate: false,
  creatorId: 'test-creator',
  creatorName: 'Test Creator',
  timezone: 'UTC',
  weather: null
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Event System', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock window.open for location links
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('EventCard Component', () => {
    it('renders event details correctly', () => {
      render(<EventCard event={mockEvent} />, { wrapper });

      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('5 participants needed / 0 responded')).toBeInTheDocument();
    });

    it('shows private label when event is private', () => {
      const privateEvent = { ...mockEvent, isPrivate: true };
      render(<EventCard event={privateEvent} />, { wrapper });

      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('handles join event interaction', async () => {
      render(<EventCard event={mockEvent} />, { wrapper });

      // Get the join button by role+text to be more specific
      const joinButton = screen.getByRole('button', { name: /Join Event/i });
      await userEvent.click(joinButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Join Event/i })).toBeInTheDocument();
    });
  });

  describe('CreateEvent Component', () => {
    it('validates required fields', async () => {
      render(<CreateEvent />, { wrapper });

      const submitButton = screen.getByRole('button', { name: /Create Event/i });
      await userEvent.click(submitButton);

      // Wait for validation messages
      await screen.findByText('Event type is required');
      await screen.findByText('Title is required');
      await screen.findByText('Location is required');
    });

    it('handles event creation form submission', async () => {
      render(<CreateEvent />, { wrapper });

      // Fill in required fields
      await userEvent.type(screen.getByLabelText(/Title/i), 'New Test Event');
      await userEvent.type(screen.getByLabelText(/Location/i), 'Test Venue');
      await userEvent.type(screen.getByLabelText(/Participant Threshold/i), '10');
      
      // Submit form using button click
      const submitButton = screen.getByRole('button', { name: /Create Event/i });
      await userEvent.click(submitButton);

      // Wait for disabled state
      await expect(submitButton).toBeDisabled();
    });
  });
});