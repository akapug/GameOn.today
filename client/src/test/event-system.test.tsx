
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateEvent from '../pages/CreateEvent';
import EventCard from '../components/EventCard';
import { AuthProvider } from '../components/AuthProvider';
import Event from '../pages/Event';
import { useAuth } from '../components/AuthProvider';

// Mock useAuth hook
vi.mock('../components/AuthProvider', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
  AuthProvider: ({ children }) => children,
}));

// Mock weather service
vi.mock('../../server/services/weather', () => ({
  getWeatherInfo: vi.fn().mockResolvedValue({
    temperature: 20,
    conditions: 'Clear',
    icon: '01d',
  }),
}));

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
  weather: null,
  isRecurring: false,
  recurrenceFrequency: null,
  notes: '',
  webLink: '',
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

const wrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(['/api/event-types'], [
    { id: 1, name: 'Test Type', color: '#000000' }
  ]);
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
    document.body.innerHTML = '';
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(global, 'fetch').mockImplementation(() => 
      Promise.resolve(new Response(JSON.stringify({ success: true })))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('creates and displays event in list', async () => {
      const { rerender } = render(<CreateEvent />, { wrapper });
      
      await userEvent.type(screen.getByLabelText(/Title/i), 'New Event');
      await userEvent.type(screen.getByLabelText(/Location/i), 'Test Venue');
      await userEvent.click(screen.getByLabelText(/Event Type/i));
      await userEvent.click(screen.getByText('Test Type'));
      
      const submitButton = screen.getByRole('button', { name: /Create Event/i });
      await userEvent.click(submitButton);
      
      rerender(<EventCard event={mockEvent} />);
      expect(screen.getByText('New Event')).toBeInTheDocument();
    });
  });

  // Authentication Tests
  describe('Authentication Flows', () => {
    it('shows auth dialog for unauthenticated users', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false });
      render(<CreateEvent />, { wrapper });
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });

    it('allows event creation for authenticated users', () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { uid: 'test-user', displayName: 'Test User' }, 
        loading: false 
      });
      render(<CreateEvent />, { wrapper });
      expect(screen.getByText(/Create New Event/i)).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('displays API error messages', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));
      render(<CreateEvent />, { wrapper });
      
      await userEvent.type(screen.getByLabelText(/Title/i), 'New Event');
      await userEvent.click(screen.getByRole('button', { name: /Create Event/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });

    it('handles network failures gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));
      render(<EventCard event={mockEvent} />, { wrapper });
      
      await userEvent.click(screen.getByRole('button', { name: /Join Event/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
      });
    });
  });

  // Event Editing Tests
  describe('Event Editing', () => {
    it('allows creator to edit event details', async () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { uid: 'test-creator', displayName: 'Test Creator' }, 
        loading: false 
      });
      
      render(<Event />, { wrapper });
      const editButton = screen.getByRole('button', { name: /Edit/i });
      await userEvent.click(editButton);
      
      await userEvent.type(screen.getByLabelText(/Title/i), 'Updated Event');
      await userEvent.click(screen.getByRole('button', { name: /Save/i }));
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // Recurring Event Tests
  describe('Recurring Events', () => {
    it('handles recurring event creation', async () => {
      vi.mocked(useAuth).mockReturnValue({ 
        user: { uid: 'test-user', displayName: 'Test User' },
        loading: false 
      });
      render(<CreateEvent />, { wrapper });
      
      await userEvent.click(screen.getByRole('button', { name: /Create Event/i }));
      
      expect(screen.getByText(/Event Type/i)).toBeInTheDocument();
    });
  });

  // Weather Integration Tests
  describe('Weather Integration', () => {
    it('displays weather information when available', () => {
      const eventWithWeather = {
        ...mockEvent,
        weather: {
          temperature: 20,
          conditions: 'Clear',
        },
      };
      
      render(<EventCard event={eventWithWeather} />, { wrapper });
      expect(screen.getByText(/20°/i)).toBeInTheDocument();
    });
  });

  // Mobile Responsiveness Tests
  describe('Mobile Responsiveness', () => {
    it('adjusts layout for mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<EventCard event={mockEvent} />, { wrapper });
      const card = screen.getByRole('article');
      
      expect(card).toHaveStyle({ maxWidth: '100%' });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('loads event list efficiently', async () => {
      const start = performance.now();
      render(<EventCard event={mockEvent} />, { wrapper });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // 1 second threshold
    });
  });
});
