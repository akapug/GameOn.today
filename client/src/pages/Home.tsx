import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import EventList from "@/components/EventList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { useState } from "react";
import EventTypeSelect from "@/components/EventTypeSelect";
import { type Event, type Participant, type EventType } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import AuthDialog from "@/components/AuthDialog";
import { queryKeys } from "@/lib/queryClient";
import type { WeatherInfo } from "../../../server/services/weather";

interface EventWithDetails extends Event {
  participants: Array<Participant>;
  eventType: EventType;
  weather: WeatherInfo | null;
}

export default function Home() {
  const [selectedEventType, setSelectedEventType] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: events, isLoading, error } = useQuery<EventWithDetails[]>({
    queryKey: queryKeys.events.all,
    queryFn: () => fetch('/api/events').then(res => res.json()),
  });

  const eventsList = Array.isArray(events) ? events : [];

  const handleCreateEvent = () => {
    if (user) {
      setLocation("/create");
    } else {
      setShowAuthDialog(true);
    }
  };

  const now = new Date();

  const filterEventsByType = (events: EventWithDetails[]) => {
    if (!selectedEventType) return events;
    return events.filter(event => event.eventType?.id === selectedEventType);
  };

  const isArchived = (event: EventWithDetails) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (event.endTime) {
      // If end time exists, archive 1 hour after end time
      const endTime = new Date(event.endTime);
      const archiveTime = new Date(endTime.getTime() + (60 * 60 * 1000)); // 1 hour after end
      const isNowArchived = now >= archiveTime;
      
      // Only create recurring event once when status changes to archived
      if (isNowArchived && event.isRecurring && !event._wasArchived) {
        event._wasArchived = true; // Mark as processed
        fetch('/api/events/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentEventId: event.id })
        }).catch(console.error);
      }
      
      return isNowArchived;
    } else {
      // If no end time, archive 6 hours after start time
      const archiveTime = new Date(eventDate.getTime() + (6 * 60 * 60 * 1000)); // 6 hours after start
      const isNowArchived = now >= archiveTime;
      
      // Only create recurring event once when status changes to archived
      if (isNowArchived && event.isRecurring && !event._wasArchived) {
        event._wasArchived = true; // Mark as processed
        fetch('/api/events/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentEventId: event.id })
        }).catch(console.error);
      }
      
      return isNowArchived;
    }
  };

  // Only show public events in the main list
  const publicEvents = eventsList.filter(event => !event.isPrivate);

  const upcomingEvents = filterEventsByType(
    publicEvents.filter(event => !isArchived(event))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archivedEvents = filterEventsByType(
    publicEvents.filter(event => isArchived(event))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectTo="/create"
      />
      <main className="container py-6 px-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList className="justify-start w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {upcomingEvents.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {upcomingEvents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="relative">
                Archive
                {archivedEvents.length > 0 && (
                  <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {archivedEvents.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <EventTypeSelect 
                  value={selectedEventType || 0} 
                  onChange={(value) => setSelectedEventType(value || null)}
                  allowClear
                />
              </div>
              <Button onClick={handleCreateEvent} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </div>
          </div>
          <TabsContent value="upcoming" className="mt-6">
            <EventList 
              events={upcomingEvents} 
              emptyMessage="No upcoming events scheduled. Create a new event to get started!"
              onCreateEvent={handleCreateEvent}
            />
          </TabsContent>
          <TabsContent value="archive" className="mt-6">
            <EventList 
              events={archivedEvents}
              emptyMessage="No past events found."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}