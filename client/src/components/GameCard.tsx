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
import { utcToLocalInput } from "@/lib/dates";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [editingParticipant, setEditingParticipant] = React.useState<Participant | null>(null);
  const [isEventEditDialogOpen, setIsEventEditDialogOpen] = useState(false);
  const [isResponseEditDialogOpen, setIsResponseEditDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    title: event.title,
    location: event.location,
    date: event.date,
    endTime: event.endTime,
    participantThreshold: event.participantThreshold,
    notes: event.notes || '',
    webLink: event.webLink || '',
    isRecurring: event.isRecurring === true,
    recurrenceFrequency: event.recurrenceFrequency,
    isPrivate: event.isPrivate === true
  });
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
          likelihood: joinType === "yes" ? 1 : (joinType === "no" ? 0 : likelihood),
          uid: user?.uid,
          comment: comment
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

  const editResponse = useMutation({
    mutationFn: async (values: { participantId: number; name: string; email: string; likelihood: number; comment: string }) => {
      const responseToken = user?.uid || localStorage.getItem(`response-token-${values.participantId}`);
      if (!responseToken) throw new Error("Not authorized to edit");

      const res = await fetch(`/api/events/${event.urlHash}/participants/${values.participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, responseToken }),
      });
      if (!res.ok) throw new Error("Failed to update response");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      toast({ title: "Success", description: "Response updated!" });
      setEditingParticipant(null);
      setIsResponseEditDialogOpen(false);
    },
  });

  const toUTC = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return utcDate;
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formState.isRecurring && !formState.recurrenceFrequency) {
      toast({
        title: "Error",
        description: "Please select a recurrence frequency for recurring events",
        variant: "destructive"
      });
      return;
    }

    const updatedEvent = {
      ...event,
      title: formState.title,
      location: formState.location,
      date: toUTC(formState.date, event.timezone).toISOString(),
      endTime: formState.endTime ? toUTC(formState.endTime, event.timezone).toISOString() : null,
      notes: formState.notes,
      webLink: formState.webLink,
      participantThreshold: Number(formState.participantThreshold),
      creatorId: user?.uid,
      timezone: event.timezone,
      isRecurring: formState.isRecurring,
      recurrenceFrequency: formState.isRecurring ? formState.recurrenceFrequency : null,
      isPrivate: formState.isPrivate,
    };

    try {
      const res = await fetch(`/api/events/${event.urlHash}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(updatedEvent),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update event");
      }

      await res.json();
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      toast({ title: "Success", description: "Event updated successfully" });
      setIsEventEditDialogOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const [comment, setComment] = useState('');

  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/events/${event.urlHash}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                  {event?.title || (event?.eventType?.name || 'Event')}
                </h3>
                <span 
                  className="text-sm px-2 py-0.5 rounded-full" 
                  style={{ 
                    backgroundColor: event?.eventType?.color ? `${event?.eventType?.color}20` : '#eee',
                    color: event?.eventType?.color ? event?.eventType?.color : '#666'
                  }}
                >
                  {event?.eventType?.name || 'Event'}
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
              {formatWithTimezone(event.date, "PPP p", event.timezone)}
              {event.endTime && (
                <span className="text-muted-foreground ml-1">
                  - {formatWithTimezone(event.endTime, "p", event.timezone)}
                </span>
              )}
              <a
                href={(() => {
                  const startDate = event?.date ? new Date(event.date) : null;
                  const endDate = event?.endTime ? new Date(event.endTime) : (startDate ? new Date(startDate.getTime() + 3600000) : null);

                  if (!startDate || isNaN(startDate.getTime())) return '#';

                  const startStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0];
                  const endStr = (endDate && !isNaN(endDate.getTime())) ? 
                    endDate.toISOString().replace(/[-:]/g, '').split('.')[0] : 
                    new Date(startDate.getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0];

                  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event?.title || `${event?.eventType?.name || ''} Event`)}&dates=${startStr}Z/${endStr}Z&details=${encodeURIComponent(`Join us for ${event?.eventType?.name || 'the event'}! ${window.location.origin}/events/${event?.urlHash}`)}&location=${encodeURIComponent(event?.location || '')}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs text-primary hover:underline"
              >
                Add to Calendar
              </a>
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

            {event.webLink && (
              <div className="text-sm">
                <a
                  href={event.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  More Info
                </a>
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">

            {event.weather && (
              <div className="flex items-center ml-6">
                <span className="text-muted-foreground">
                  Expected: <WeatherDisplay weather={event.weather} />
                </span>
              </div>
            )}
          </div>
        </div>
        <div>
            <div className="flex items-center text-sm mb-2">
              <Users className="mr-2 h-4 w-4" />
              <span>
                {event?.participantThreshold || 0} participants needed / {event?.participants?.length || 0} responded
                <span className="text-xs text-muted-foreground ml-1">
                  (~{((event?.participantThreshold || 0) * (progressPercentage / 100)).toFixed(1)} expected)
                </span>
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mt-2" />
            <div className="mt-2 space-y-1">
              {event?.participants?.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {index + 1}. {participant.name} {(!participant.likelihood || participant.likelihood === 1) ? (
                      <span className="ml-1 text-xs text-green-600">Yes!</span>
                    ) : (
                      <span className="ml-1 text-xs text-yellow-600">
                        Maybe ({Math.round(Number(participant.likelihood) * 100)}%)
                      </span>
                    )} {participant.comment && <span className="ml-2 text-muted-foreground">({participant.comment})</span>}
                  </div>
                  <div className="flex gap-1">
                    {canEditResponse(participant) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingParticipant(participant);
                          setParticipantName(participant.name);
                          setParticipantEmail(participant.email || '');
                          setJoinType(!participant.likelihood || participant.likelihood === 1 ? "yes" : "maybe");
                          setLikelihood(participant.likelihood || 0.5);
                          setComment(participant.comment || '');
                          setIsResponseEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Remove ${participant.name}'s response?`)) {
                            try {
                              const response = await fetch(`/api/events/${event.urlHash}/participants/${participant.id}`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" }
                              });

                              if (!response.ok) {
                                throw new Error('Failed to delete response');
                              }

                              queryClient.invalidateQueries({ queryKey: queryKeys.events.single(event.urlHash) });
                              queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
                              toast({ title: "Success", description: "Response removed successfully" });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to remove response",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>


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
                <Label>Are you joining?</Label>
                <RadioGroup value={joinType} onValueChange={(v) => setJoinType(v as "yes" | "maybe")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes">Yes, I'm in!</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <Label htmlFor="maybe">Maybe, depends...</Label>
                  </div>
                </RadioGroup>
              </div>

              {joinType === "maybe" && (
                <div className="space-y-2">
                  <Label>How likely are you to attend?</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      min={10}
                      max={90}
                      step={10}
                      value={[likelihood * 100]}
                      onValueChange={([value]) => setLikelihood(value / 100)}
                    />
                    <span className="w-12 text-right">{Math.round(likelihood * 100)}%</span>
                  </div>
                </div>
              )}

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
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  placeholder="your@email.com (optional)"
                />
              </div>
              <div>
                <Label htmlFor="comment">Comment (optional)</Label>
                <Input
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any notes about your attendance?"
                  maxLength={100}
                />
              </div>

              <Button type="submit" className="w-full">Join Event</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Response Dialog */}
        <Dialog
          open={isResponseEditDialogOpen}
          onOpenChange={setIsResponseEditDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Response</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingParticipant) return;

              if (joinType === "no") {
                fetch(`/api/events/${event.urlHash}/participants/${editingParticipant.id}`, {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem(`response-token-${editingParticipant.id}`) || user?.uid}`
                  }
                })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
                    toast({ title: "Success", description: "Response removed successfully" });
                    setEditingParticipant(null);
                    setIsResponseEditDialogOpen(false);
                  })
                  .catch(() => {
                    toast({
                      title: "Error",
                      description: "Failed to remove response",
                      variant: "destructive",
                    });
                  });
              } else {
                editResponse.mutate({
                  participantId: editingParticipant.id,
                  name: participantName,
                  email: participantEmail,
                  likelihood: joinType === "yes" ? 1 : likelihood,
                  comment: comment
                });
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Are you joining?</Label>
                <RadioGroup value={joinType} onValueChange={(v) => setJoinType(v as "yes" | "maybe" | "no")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="edit-yes" />
                    <Label htmlFor="edit-yes">Yes, I'm in!</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="edit-maybe" />
                    <Label htmlFor="edit-maybe">Maybe, depends...</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="edit-no" />
                    <Label htmlFor="edit-no">Sorry, I can't join</Label>
                  </div>
                </RadioGroup>
              </div>

              {joinType === "maybe" && (
                <div className="space-y-2">
                  <Label>How likely are you to attend?</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      min={10}
                      max={90}
                      step={10}
                      value={[likelihood * 100]}
                      onValueChange={([value]) => setLikelihood(value / 100)}
                    />
                    <span className="w-12 text-right">{Math.round(likelihood * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (optional)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-comment">Comment (optional)</Label>
                <Input
                  id="edit-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any notes about your attendance?"
                  maxLength={100}
                />
              </div>
              <Button
                type="submit"
                variant={joinType === "no" ? "destructive" : "default"}
                className="w-full"
              >
                {joinType === "no" ? "Remove Me" : "Save and Close"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setIsOpen(true)}
          variant={hasMinimumParticipants ? "outline" : "default"}
        >
          {hasMinimumParticipants ? "Join Event (Has Enough Participants)" : "Join Event"}
        </Button>

        {/* Share Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/events/${event.urlHash}`);
              toast({ title: "Link Copied", description: "Event link copied to clipboard!" });
            }}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/events/${event.urlHash}`)}`,
                '_blank'
              );
            }}>
              <Facebook className="mr-2 h-4 w-4" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/events/${event?.urlHash || ''}`)}&text=${encodeURIComponent(`Join our ${event?.eventType?.name || 'upcoming'} event!`)}`,
                '_blank'
              );
            }}>
              <Twitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `sms:?body=${encodeURIComponent(`Join our ${event.eventType.name} event: ${window.location.origin}/events/${event.urlHash}`)}`,
                '_blank'
              );
            }}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Share via SMS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Button */}
        {canDelete && (
          <Dialog open={isEventEditDialogOpen} onOpenChange={setIsEventEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Event Visibility</Label>
                  <Select
                    value={formState.isPrivate ? 'private' : 'public'}
                    onValueChange={(value) => setFormState(prev => ({ ...prev, isPrivate: value === 'private' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (Visible on homepage)</SelectItem>
                      <SelectItem value="private">Private (Only accessible via URL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formState.location}
                    onChange={(e) => setFormState(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time ({event.timezone})</Label>
                  <Input
                    type="datetime-local"
                    value={utcToLocalInput(formState.date, event.timezone)}
                    onChange={(e) => setFormState(prev => ({ ...prev, date: localToUTCInput(e.target.value, event.timezone) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time ({event.timezone})</Label>
                  <Input
                    type="datetime-local"
                    value={utcToLocalInput(formState.endTime, event.timezone)}
                    onChange={(e) => setFormState(prev => ({ ...prev, endTime: localToUTCInput(e.target.value, event.timezone) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Participant Threshold</Label>
                  <Input
                    type="number"
                    min="2"
                    value={formState.participantThreshold}
                    onChange={(e) => setFormState(prev => ({ ...prev, participantThreshold: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={formState.notes}
                    onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any details about the event, like level of play, parking instructions, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Web Link</Label>
                  <Input
                    value={formState.webLink}
                    onChange={(e) => setFormState(prev => ({ ...prev, webLink: e.target.value }))}
                    placeholder="Link to more info"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recurring Event</Label>
                  <Select
                    value={String(formState.isRecurring)}
                    onValueChange={(value) => {
                      setFormState(prev => ({
                        ...prev,
                        isRecurring: value === 'true',
                        recurrenceFrequency: value === 'false' ? null : prev.recurrenceFrequency
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Is this a recurring event?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formState.isRecurring && (
                  <div className="space-y-2">
                    <Label>Recurrence Frequency</Label>
                    <Select
                      value={formState.recurrenceFrequency || ''}
                      onValueChange={(value) => {
                        setFormState(prev => ({
                          ...prev,
                          recurrenceFrequency: value
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How often does this event repeat?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Button */}
        {canDelete && (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Event</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete this event? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    fetch(`/api/events/${event.urlHash}`, { method: "DELETE" })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
                        toast({ title: "Success", description: "Event deleted successfully" });
                      })
                      .catch(() => {
                        toast({
                          title: "Error",
                          description: "Failed to delete event",
                          variant: "destructive",
                        });
                      });
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}

function localToUTCInput(localDateTimeString: string, timezone: string): string {
  const localDate = new Date(localDateTimeString);
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  return utcDate.toISOString();
}