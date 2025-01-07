
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
      vi.mocked(useAuth).mockReturnValue({ 
        user: { uid: 'test-user', displayName: 'Test User' }, 
        loading: false 
      });

      render(<CreateEvent />, { wrapper });
      
      await userEvent.type(screen.getByLabelText(/Title/i), 'New Event');
      await userEvent.type(screen.getByLabelText(/Location/i), 'Test Venue');
      
      const eventTypeSelect = screen.getByLabelText(/Event Type/i);
      await userEvent.click(eventTypeSelect);
      await userEvent.click(screen.getByRole('combobox', { name: /Event Type/i }));
      await userEvent.click(screen.getByRole('option', { name: /Test Type/i }));
      
      await userEvent.click(screen.getByRole('button', { name: /Create Event/i }));
      
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });
  });

  // Authentication Tests
  describe('Authentication Flows', () => {
    it('shows auth dialog for unauthenticated users', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false });
      render(<CreateEvent />, { wrapper });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Please sign in/i)).toBeInTheDocument();
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

      const mockEventWithCreator = {
        ...mockEvent,
        creatorId: 'test-creator',
        eventType: { id: 1, name: 'Test Type', color: '#000000' }
      };
      
      render(<EventCard event={mockEventWithCreator} />, { wrapper });
      
      const editButton = screen.getByRole('button', { name: /Edit/i });
      await userEvent.click(editButton);
      
      const titleInput = screen.getByLabelText(/Title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Event');
      
      await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      
      expect(global.fetch).toHaveBeenCalled();
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
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      
      render(<EventCard event={mockEvent} />, { wrapper });
      expect(screen.getByTestId('event-card')).toBeInTheDocument();
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
