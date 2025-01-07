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
            if (res.status >= 500) {
              console.warn(`Server error: ${res.status}`);
              return null;
            }
            return null;
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