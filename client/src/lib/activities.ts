import { useQuery } from "@tanstack/react-query";
import { type EventType } from "@db/schema";
import { queryKeys } from "./queryClient";

export const eventTypeColors = {
  emerald: "hsl(152.2 76% 60.6%)",
  orange: "hsl(24.6 95% 53.1%)",
  green: "hsl(142.1 76.2% 36.3%)",
  yellow: "hsl(47.9 95.8% 53.1%)",
  red: "hsl(0 72.2% 50.6%)",
  purple: "hsl(280 68.2% 50.6%)",
};

// This function is kept for backwards compatibility
// but should be replaced with useEventTypes hook
export function useActivities() {
  const { data: eventTypes, error, isLoading } = useQuery<EventType[]>({
    queryKey: ['/api/event-types'],
  });

  return {
    data: eventTypes?.map(et => ({
      ...et,
      color: et.color || 'emerald',
      icon: et.icon || 'circle'
    })),
    error,
    isLoading
  };
}

export function useEventTypes() {
  return useQuery<EventType[]>({
    queryKey: ['/api/event-types'],
  });
}