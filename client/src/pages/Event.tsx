
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import EventCard from "@/components/EventCard";

export default function Event() {
  const { hash } = useParams();
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: queryKeys.events.detail(hash || ''),
    enabled: !!hash
  });

  if (isLoading) return <div className="container py-6">Loading...</div>;
  if (error) return <div className="container py-6">Error loading event</div>;
  if (!event) return <div className="container py-6">Event not found</div>;

  return (
    <div className="container py-6">
      <EventCard event={event} fullscreen />
    </div>
  );
}
