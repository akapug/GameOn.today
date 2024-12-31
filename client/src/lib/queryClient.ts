import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // Handle array query keys properly
        const endpoint = Array.isArray(queryKey) ? queryKey.join('/') : queryKey;
        const res = await fetch(endpoint, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Game not found");
          }
          if (res.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }
          const errorText = await res.text();
          throw new Error(errorText || "An unexpected error occurred");
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Changed from Infinity to 0 to ensure fresh data
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

// Helper function to generate query keys
export const queryKeys = {
  games: {
    all: ['api', 'games'],
    single: (id: number) => ['api', 'games', id.toString()],
  },
  sports: ['api', 'sports'],
};