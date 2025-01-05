
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Cache persists for 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// Helper function to generate query keys
export const queryKeys = {
  games: {
    all: ['/api/games'],
    single: (id: string) => ['/api/games', id],
    user: (uid: string) => ['/api/games/user', { uid }],
  },
  activities: ['/api/activities'],
};
