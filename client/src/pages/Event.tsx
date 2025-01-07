
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { type Event as EventType, type Participant } from "@db/schema";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { queryKeys } from "@/lib/queryClient";
import WeatherDisplay from "@/components/WeatherDisplay";
import EventCard from "@/components/EventCard";

interface EventWithDetails extends EventType {
  participants: Participant[];
  weather: WeatherInfo | null;
}

export default function Event() {
  const { hash } = useParams();
  const [, setLocation] = useLocation();
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: queryKeys.events.detail(hash || ''),
    queryFn: () => fetch(`/api/events/${hash}`).then(res => res.json()),
    enabled: !!hash,
    retry: 1,
  });

  if (isLoading) return <div className="container py-6"><Spinner className="w-8 h-8" /></div>;
  if (error || !event) return <div className="container py-6">Event not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">{event.title}</h1>
        </div>
      </header>
      <main className="container py-6 px-4">
        <EventCard event={event} fullscreen={true} />
      </main>
    </div>
  );
}
