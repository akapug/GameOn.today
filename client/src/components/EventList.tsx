import EventCard from "./EventCard";
import { type Event, type Participant, type EventType } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherInfo } from "../../server/services/weather";
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/lib/queryClient";
import { useState } from 'react';

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
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ["/api/events", page, limit],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/events?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      } catch (error) {
        console.error('Failed to fetch events:', error);
        return { events: [], page: 1, limit };
      }
    },
    staleTime: 0,
    refetchInterval: 3000,
    retry: 3
  });

  const fetchedEvents = fetchedData?.events || [];

  const eventsToDisplay = Array.isArray(events) ? events : [];

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
      {fetchedEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}