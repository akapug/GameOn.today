import { useQuery } from "@tanstack/react-query";
import { type EventType } from "@db/schema";

export const eventTypeColors = {
  emerald: "hsl(152.2 76% 60.6%)",
  orange: "hsl(24.6 95% 53.1%)",
  green: "hsl(142.1 76.2% 36.3%)",
  yellow: "hsl(47.9 95.8% 53.1%)",
  red: "hsl(0 72.2% 50.6%)",
  purple: "hsl(280 68.2% 50.6%)",
  gray: "hsl(0 0% 50.6%)",
  blue: "hsl(210 68.2% 50.6%)",
  pink: "hsl(320 68.2% 50.6%)"
};

export function useEventTypes() {
  return useQuery<EventType[]>({
    queryKey: ['/api/event-types'],
  });
}