import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventTypeSelect from "@/components/EventTypeSelect";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type NewEvent } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { toUTC, getUserTimezone } from "@/lib/dates";

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(!user);
  const userTimezone = getUserTimezone();

  const form = useForm<NewEvent>({
    defaultValues: {
      title: "",
      location: "",
      date: "",
      endTime: "",
      timezone: userTimezone,
      participantThreshold: 10,
      eventTypeId: null,
      creatorId: user?.uid || undefined,
      creatorName: user?.displayName || "",
      notes: "",
      webLink: "",
      isRecurring: false,
      recurrenceFrequency: null,
      isPrivate: false,
    },
    mode: "onChange",
    resolver: async (data) => {
      const errors: Record<string, { message: string }> = {};

      if (!data.title?.trim()) errors.title = { message: "Title is required" };
      if (!data.location?.trim()) errors.location = { message: "Location is required" };
      if (!data.date?.trim()) errors.date = { message: "Start time is required" };
      if (!data.eventTypeId) errors.eventTypeId = { message: "Event type is required" };
      if (!data.participantThreshold || data.participantThreshold <= 1) {
        errors.participantThreshold = { message: "Participant threshold must be greater than 1" };
      }
      if (data.webLink && !isValidUrl(data.webLink)) {
        errors.webLink = { message: "Please enter a valid URL" };
      }
      if (data.isRecurring && !data.recurrenceFrequency) {
        errors.recurrenceFrequency = { message: "Recurrence frequency is required for recurring events" };
      }

      return {
        values: data,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const createEvent = useMutation({
    mutationFn: async (values: NewEvent) => {
      const eventData = {
        ...values,
        date: toUTC(values.date, values.timezone).toISOString(),
        endTime: values.endTime ? toUTC(values.endTime, values.timezone).toISOString() : null,
        eventTypeId: typeof values.eventTypeId === 'string' ? parseInt(values.eventTypeId, 10) : values.eventTypeId,
        participantThreshold: Number(values.participantThreshold),
        isRecurring: values.isRecurring === true,
        recurrenceFrequency: values.isRecurring === true ? values.recurrenceFrequency : null,
        isPrivate: values.isPrivate === true,
        title: values.title || '',
        creatorId: user?.uid,
        creatorName: user?.displayName || '',
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message + (errorData.fields ? `: ${errorData.fields.join(', ')}` : ''));
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectTo="/create"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">Create New Event</h1>
        </div>
      </header>

      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                createEvent.mutate(data);
              })} className="space-y-6">
                <FormField
                  control={form.control}
                  name="eventTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Event Type</FormLabel>
                      <EventTypeSelect {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Visibility</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'private')}
                        value={field.value ? 'private' : 'public'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public (Visible on homepage)</SelectItem>
                          <SelectItem value="private">Private (Only accessible via URL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Date & Time ({userTimezone})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <Collapsible>
                        <CollapsibleTrigger className="text-xs text-muted-foreground hover:underline">
                          Need to override detected timezone?
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                                      <SelectItem key={tz} value={tz}>
                                        {tz}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time ({userTimezone})</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantThreshold"
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Participant Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2"
                          onChange={(e) => onChange(parseInt(e.target.value, 10))}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any details about the event..." className="min-h-[100px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web Link</FormLabel>
                      <FormControl>
                        <Input placeholder="Link to more info" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Event</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'true')}
                        value={String(field.value === true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Is this a recurring event?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {form.watch("isRecurring") === true && (
                  <FormField
                    control={form.control}
                    name="recurrenceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
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
                      </FormItem>
                    )}
                  />
                )}

                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="space-y-2" role="alert" aria-label="Form Errors">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <p key={field} className="text-destructive text-sm">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createEvent.isPending || form.formState.isSubmitting || !form.formState.isValid}
                >
                  {(createEvent.isPending || form.formState.isSubmitting) ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}