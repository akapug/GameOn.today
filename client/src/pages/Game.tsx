import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { type Event as EventType, type Participant, type EventType as EventTypeModel } from "@db/schema";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Share2,
  LinkIcon,
  Facebook,
  Twitter,
  MessageSquare,
  Trash2,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthProvider";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/queryClient";
import WeatherDisplay from "@/components/WeatherDisplay";
import type { WeatherInfo } from "../../../server/services/weather";

interface EventWithDetails extends EventType {
  participants: Participant[];
  eventType: EventTypeModel;
  weather: WeatherInfo | null;
}

export default function Event() {
  const [, params] = useRoute("/events/:hash");
  const [, setLocation] = useLocation();
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [joinType, setJoinType] = useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = useState(0.5);

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: params?.hash ? ['/api/events', params.hash] : undefined,
    queryFn: () => fetch(`/api/events/${params.hash}`).then(res => res.json()),
    enabled: !!params?.hash,
    retry: 1,
  });

  const form = useForm<Partial<EventType>>({
    defaultValues: {
      title: event?.title || "",
      location: event?.location || "",
      date: event?.date || "",
      endTime: event?.endTime || "",
      timezone: event?.timezone || "",
      participantThreshold: event?.participantThreshold || 2,
      notes: event?.notes || "",
      webLink: event?.webLink || "",
      isRecurring: event?.isRecurring || false,
      recurrenceFrequency: event?.recurrenceFrequency || undefined,
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load event details",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [error, toast, setLocation]);

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        location: event.location,
        date: event.date,
        participantThreshold: event.participantThreshold,
        isRecurring: event.isRecurring,
        recurrenceFrequency: event.recurrenceFrequency,
      });
    }
  }, [event, form]);

  const joinEvent = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${params?.hash}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: participantName,
          email: participantEmail,
          likelihood: joinType === "yes" ? 1 : likelihood
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join event");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: params?.hash ? ['events', params.hash] : undefined });
      toast({
        title: "Success",
        description: "You've successfully joined the event!",
      });
      setIsOpen(false);
      setParticipantName("");
      setParticipantEmail("");
      setJoinType("yes");
      setLikelihood(0.5);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editEvent = useMutation({
    mutationFn: async (values: Partial<EventType>) => {
      const res = await fetch(`/api/events/${params?.hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          creatorId: event?.creatorId,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update event");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: params?.hash ? ['events', params.hash] : undefined });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${params?.hash}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete event");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const shareEvent = async (method: 'copy' | 'facebook' | 'twitter' | 'sms') => {
    const eventUrl = `${window.location.origin}/events/${event.urlHash}`;
    const text = `Join our ${event.eventType.name} event: ${event.title} at ${event.location}`;

    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(eventUrl);
        toast({
          title: "Link Copied",
          description: "Event link copied to clipboard!",
        });
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'sms':
        window.open(
          `sms:?body=${encodeURIComponent(`${text}\n${eventUrl}`)}`,
          '_blank'
        );
        break;
    }
  };

  const calculateProgress = () => {
    if (!event || !event.participants) return 0;
    const total = event.participants.reduce((sum, participant) => {
      const likelihood = participant.likelihood ? Number(participant.likelihood) : 1;
      return sum + likelihood;
    }, 0);
    return (total / event.participantThreshold) * 100;
  };

  const progressPercentage = calculateProgress();
  const hasMinimumParticipants = progressPercentage >= 100;
  const canDelete = user && event.creatorId === user.uid;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold ml-4">{event.title}</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-2 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: event.eventType?.color ? `${event.eventType.color}20` : '#eee',
                      color: event.eventType?.color || '#666'
                    }}
                  >
                    {event.eventType?.name}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4" />
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank')}
                    className="text-primary hover:underline"
                  >
                    {event.location}
                  </button>
                </div>

                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{formatWithTimezone(event.date, 'PPp', event.timezone)}</span>
                </div>

                {event.endTime && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Ends: {new Date(event.endTime).toLocaleTimeString()}</span>
                  </div>
                )}

                {event.notes && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {event.notes}
                  </div>
                )}
              </div>

              {event.weather && <WeatherDisplay weather={event.weather} />}

              <div>
                <div className="flex items-center text-sm mb-2">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {event.participantThreshold} participants needed / {event.participants?.length || 0} responded
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {event.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-muted px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{participant.name}</span>
                    {participant.likelihood !== 1 && (
                      <span className="ml-1 text-muted-foreground">
                        ({Math.round(Number(participant.likelihood) * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsOpen(true)}
              variant={hasMinimumParticipants ? "outline" : "default"}
            >
              Join Event
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => shareEvent('copy')}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareEvent('facebook')}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareEvent('twitter')}>
                  <Twitter className="h-4 w-4 mr-2" />
                  Share on Twitter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canDelete && (
              <>
                <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* Join Event Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              joinEvent.mutate();
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Join Type</Label>
                <RadioGroup value={joinType} onValueChange={(value: "yes" | "maybe") => setJoinType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <Label htmlFor="maybe">Maybe</Label>
                  </div>
                </RadioGroup>
              </div>

              {joinType === "maybe" && (
                <div className="space-y-2">
                  <Label>Likelihood ({Math.round(likelihood * 100)}%)</Label>
                  <Slider
                    value={[likelihood]}
                    onValueChange={([value]) => setLikelihood(value)}
                    step={0.1}
                    min={0}
                    max={1}
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                Join Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteEvent.mutate();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}