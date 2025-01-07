import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        try {
          const res = await fetch(queryKey[0] as string, {
            credentials: "include",
          });

          if (!res.ok) {
            const error = new Error(`HTTP error! status: ${res.status}`);
            console.error('Query failed:', error);
            throw error; // Let React Query handle retries
          }

          return res.json();
        } catch (err) {
          console.warn('Query failed silently:', err);
          return null;
        }
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    }
  },
});

// Helper function to generate query keys
export const queryKeys = {
  events: {
    all: ['/api/events'],
    single: (id: string) => ['/api/events', id],
    user: (uid: string) => ['/api/events/user', { uid }],
  },
  eventTypes: ['/api/event-types'],
};