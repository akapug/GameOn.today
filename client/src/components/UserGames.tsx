import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Event, EventType } from "@db/schema";
import { queryKeys } from "@/lib/queryClient";

interface EventWithType extends Event {
  eventType: EventType;
}

export default function UserEvents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: events, isLoading } = useQuery<EventWithType[]>({
    queryKey: ["/api/events/user", { uid: user?.uid }],
    queryFn: () => fetch(`/api/events/user?uid=${user?.uid}`).then(res => res.json()),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  if (isLoading || !events) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading your events...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        You haven't created any events yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 p-2">
        {events.map((event) => (
          <Card 
            key={event.urlHash} 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setLocation(`/events/${event.urlHash}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{event.title || event.eventType?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.date), "PPP")}
                  </p>
                </div>
                {event.isPrivate ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}