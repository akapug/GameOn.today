import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, MapPin, Users, Share2, LinkIcon, Facebook, Twitter, MessageSquare, Trash2, Edit, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Link, useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import WeatherDisplay from "./WeatherDisplay";
import type { Event, Participant, EventType } from "@db/schema";
import type { WeatherInfo } from "../../server/services/weather";

interface EventCardProps {
  event: Event & {
    participants: Participant[];
    eventType: EventType;
    weather: WeatherInfo | null;
  };
  fullscreen?: boolean;
}

export default function EventCard({ event, fullscreen = false }: EventCardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [participantName, setParticipantName] = React.useState(user?.displayName || "");
  const [participantEmail, setParticipantEmail] = React.useState(user?.email || "");
  const [joinType, setJoinType] = React.useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = React.useState(0.5);
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingParticipant, setEditingParticipant] = React.useState<Participant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResponseEditDialogOpen, setIsResponseEditDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const canEditResponse = (participant: Participant) => {
    if (!participant.responseToken) return false;
    if (user?.uid) {
      return participant.responseToken === user.uid;
    }
    const storedToken = localStorage.getItem(`response-token-${participant.id}`);
    return Boolean(storedToken && storedToken === participant.responseToken);
  };

  const calculateProgress = () => {
    if (!event?.participants) return 0;
    const total = event.participants.reduce((sum, participant) => {
      const likelihood = participant.likelihood ? Number(participant.likelihood) : 1;
      return sum + likelihood;
    }, 0);
    return (total / event.participantThreshold) * 100;
  };

  const progressPercentage = calculateProgress();
  const hasMinimumParticipants = progressPercentage >= 100;
  const canDelete = user && event.creatorId === user.uid;

  const joinEvent = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${event.urlHash}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: participantName,
          email: participantEmail,
          likelihood: joinType === "yes" ? 1 : likelihood,
          uid: user?.uid,
          comment
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join event");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (!user?.uid && data.responseToken) {
        localStorage.setItem(`response-token-${data.id}`, data.responseToken);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      toast({ title: "Success", description: "You've joined the event!" });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/events/${event.urlHash}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                  {event.title}
                </h3>
                <span 
                  className="text-sm px-2 py-0.5 rounded-full" 
                  style={{ 
                    backgroundColor: event.eventType?.color ? `${event.eventType.color}20` : '#eee',
                    color: event.eventType?.color || '#666'
                  }}
                >
                  {event.eventType?.name || 'Event'}
                </span>
              </div>
            </Link>
            <div className="text-sm text-muted-foreground flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank')}
                className="text-primary hover:underline"
              >
                {event.location}
              </button>
            </div>
          </div>
          {event.isPrivate && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              Private
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
              {event.endTime && (
                <span className="text-muted-foreground ml-1">
                  - {new Date(event.endTime).toLocaleTimeString()}
                </span>
              )}
            </div>

            {event.isRecurring && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="mr-2 h-4 w-4" />
                Recurring {event.recurrenceFrequency} event
              </div>
            )}

            {event.notes && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MessageSquare className="mr-2 h-4 w-4" />
                {event.notes}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center text-sm mb-2">
              <Users className="mr-2 h-4 w-4" />
              <span>
                {event.participantThreshold} participants needed / {event.participants?.length || 0} responded
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mt-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setIsOpen(true)}
          variant={hasMinimumParticipants ? "outline" : "default"}
        >
          {hasMinimumParticipants ? "Join Event (Has Enough Participants)" : "Join Event"}
        </Button>
      </CardFooter>

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
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" value={participantName} onChange={(e) => setParticipantName(e.target.value)} />

            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={participantEmail} onChange={(e) => setParticipantEmail(e.target.value)} />

            <Label htmlFor="joinType">Join Type</Label>
            <RadioGroup value={joinType} onChange={setJoinType}>
              <RadioGroupItem value="yes">Yes</RadioGroupItem>
              <RadioGroupItem value="maybe">Maybe</RadioGroupItem>
            </RadioGroup>

            {joinType === "maybe" && (
              <>
                <Label htmlFor="likelihood">Likelihood</Label>
                <Slider
                  id="likelihood"
                  step={0.1}
                  min={0}
                  max={1}
                  value={likelihood}
                  onChange={(e) => setLikelihood(e.target.value)}
                />
              </>
            )}

            <Label htmlFor="comment">Comment</Label>
            <Input id="comment" type="text" value={comment} onChange={(e) => setComment(e.target.value)} />

            <Button type="submit">Join</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}