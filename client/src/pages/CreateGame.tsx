import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import SportSelect from "@/components/SportSelect";
import { ArrowLeft, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type NewGame } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import AuthDialog from "@/components/AuthDialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createGameSchema = z.object({
  sportId: z.number().min(1, "Please select a sport"),
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  date: z.string().min(1, "Date is required"),
  timezone: z.string().refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Invalid timezone" }
  ),
  playerThreshold: z.number().min(2, "At least 2 players are required"),
  notes: z.string().optional(),
  creatorId: z.string(),
  creatorName: z.string()
});

type FormData = z.infer<typeof createGameSchema>;

export default function CreateGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(!user);
  const [showTimezoneAlert, setShowTimezoneAlert] = useState(true);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format current time in user's timezone for the datetime-local input
  const now = new Date();
  const defaultDate = now.toLocaleString('sv-SE', { timeZone: userTimezone }).slice(0, 16);

  const form = useForm<FormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      sportId: 0,
      title: "",
      location: "",
      date: defaultDate,
      timezone: userTimezone,
      playerThreshold: 2,
      notes: "",
      creatorId: user?.uid || "",
      creatorName: user?.displayName || ""
    }
  });

  // Effect to update timezone alert visibility
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'timezone' && value.timezone !== userTimezone) {
        setShowTimezoneAlert(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, userTimezone]);

  const createGame = useMutation({
    mutationFn: async (values: FormData) => {
      // Keep the date exactly as selected in the form
      const dateStr = values.date;

      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sportId: Number(values.sportId),
          playerThreshold: Number(values.playerThreshold),
          date: dateStr,
          timezone: values.timezone,
          creatorId: user?.uid,
          creatorName: user?.displayName || "",
          notes: values.notes || null
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to create game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create game",
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
          <h1 className="text-2xl font-bold ml-4">Create New Game</h1>
        </div>
      </header>

      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            {showTimezoneAlert && (
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Using your detected timezone: <strong>{userTimezone}</strong>. 
                  All times will be displayed in this timezone unless changed below.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createGame.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="sportId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport *</FormLabel>
                      <FormControl>
                        <SportSelect
                          value={field.value}
                          onChange={field.onChange}
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Game title..." {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="Game location..." {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormDescription>
                          Select the exact time for the game
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={userTimezone}
                        >
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormDescription>
                        Optional: Add any additional details about the game
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional details about the game..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="playerThreshold"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Player Threshold *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2"
                          {...field}
                          value={value}
                          onChange={e => onChange(parseInt(e.target.value, 10))}
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="text-sm text-muted-foreground mb-4">
                  * Required fields
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createGame.isPending}
                >
                  {createGame.isPending ? 'Creating...' : 'Create Game'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}