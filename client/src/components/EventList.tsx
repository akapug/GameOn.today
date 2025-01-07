import EventCard from "./EventCard";
import { type Event, type Participant, type EventType } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherInfo } from "../../server/services/weather";
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/lib/queryClient";

interface EventListProps {
  events: Array<Event & { 
    participants: Array<Participant>;
    eventType: EventType;
    weather: WeatherInfo | null;
  }>;
  emptyMessage?: string;
  onCreateEvent?: () => void;
}

export default function EventList({ events, emptyMessage = "No events found", onCreateEvent }: EventListProps) {
  const { data: fetchedEvents, isLoading } = useQuery({
    queryKey: ["/api/events"],
    queryFn: () => fetch('/api/events').then(res => res.json()),
    staleTime: 0, // Always check for fresh data
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  const eventsToDisplay = Array.isArray(fetchedEvents) ? fetchedEvents : [];

  if (eventsToDisplay.length === 0 && onCreateEvent) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        <Button variant="outline" size="sm" onClick={onCreateEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {eventsToDisplay.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}