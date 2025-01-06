import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActivitySelect from "@/components/ActivitySelect";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type NewGame } from "@db/schema";
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

export default function CreateGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(!user);
  const userTimezone = getUserTimezone();

  const form = useForm<NewGame>({
    defaultValues: {
      title: "",
      location: "",
      date: "",
      endTime: "",
      timezone: userTimezone,
      playerThreshold: 10,
      activityId: undefined,
      creatorId: user?.uid || undefined,
      creatorName: user?.displayName || "",
      notes: "",
      webLink: "",
      isRecurring: false,
      recurrenceFrequency: null,
      isPrivate: false,
    },
    resolver: async (data) => {
      const errors: Record<string, { message: string }> = {};

      if (!data.title?.trim()) errors.title = { message: "Title is required" };
      if (!data.location?.trim()) errors.location = { message: "Location is required" };
      if (!data.date?.trim()) errors.date = { message: "Start time is required" };
      if (!data.activityId) errors.activityId = { message: "Activity is required" };
      if (!data.playerThreshold || data.playerThreshold <= 1) {
        errors.playerThreshold = { message: "Player threshold must be greater than 1" };
      }
      if (data.webLink && !isValidUrl(data.webLink)) {
        errors.webLink = { message: "Please enter a valid URL" };
      }
      if (data.isRecurring && !data.recurrenceFrequency) {
        errors.recurrenceFrequency = { message: "Recurrence frequency is required for recurring games" };
      }

      return {
        values: data,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const createGame = useMutation({
    mutationFn: async (values: NewGame) => {
      const requiredFields = {
        activityId: values.activityId,
        location: values.location?.trim(),
        date: values.date,
        playerThreshold: values.playerThreshold,
        creatorId: user?.uid,
        title: values.title?.trim()
      };

      console.log('Form submission details:', {
        values,
        requiredFields,
        user: user?.uid,
        isAuthenticated: !!user,
        activityIdType: typeof values.activityId,
        dateType: typeof values.date,
        playerThresholdType: typeof values.playerThreshold
      });

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error('Missing fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const gameData = {
        ...values,
        date: toUTC(values.date, values.timezone).toISOString(),
        endTime: values.endTime ? toUTC(values.endTime, values.timezone).toISOString() : null,
        activityId: Number(values.activityId),
        playerThreshold: Number(values.playerThreshold),
        isRecurring: values.isRecurring === true,
        recurrenceFrequency: values.isRecurring === true ? values.recurrenceFrequency : null,
        isPrivate: values.isPrivate === true,
        title: values.title || '',
        creatorId: user?.uid,
        creatorName: user?.displayName || '',
      };

      console.log('Sending game creation request:', gameData);
      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(gameData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.message + (errorData.fields ? `: ${errorData.fields.join(', ')}` : ''));
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


              <p className="text-sm text-muted-foreground mb-4">Fields marked with * are required</p>

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
          <h1 className="text-2xl font-bold ml-4">Create New Game</h1>
        </div>
      </header>

      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createGame.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Activity</FormLabel>
                      <ActivitySelect {...field} hideAllActivities={true} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Visibility</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'private')}
                        value={field.value ? 'private' : 'public'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select game visibility" />
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
                        <Input placeholder="Game title..." {...field} />
                      </FormControl>
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
                        <Input placeholder="Game location..." {...field} />
                      </FormControl>
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
                  name="playerThreshold"
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Player Threshold</FormLabel>
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
                        <Textarea placeholder="Add any details about the game, like level of play, parking instructions, etc." className="min-h-[100px]" {...field} />
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
                      <FormLabel>Recurring Game</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'true')}
                          value={String(field.value === true)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Is this a recurring game?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger>
                              <SelectValue placeholder="How often does this game repeat?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Biweekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={createGame.isPending}>
                  Create Game
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}