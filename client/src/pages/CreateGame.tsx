import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import SportSelect from "@/components/SportSelect";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type NewGame } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateGame() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(!user);

  console.log('[CreateGame] Component mounted, user:', user?.uid);

  const form = useForm<NewGame>({
    defaultValues: {
      sportId: undefined,
      title: "",
      location: "",
      date: new Date().toISOString().slice(0, 16),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      playerThreshold: 2,
      notes: "",  // Optional field
      creatorId: user?.uid || "",
      creatorName: user?.displayName || ""
    }
  });

  const createGame = useMutation({
    mutationFn: async (values: NewGame) => {
      console.log('[CreateGame] Mutation started with values:', values);
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[CreateGame] API error:', errorText);
        throw new Error(errorText || "Failed to create game");
      }

      const result = await res.json();
      console.log('[CreateGame] API success:', result);
      return result;
    },
    onSuccess: () => {
      console.log('[CreateGame] Mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      console.error('[CreateGame] Mutation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: NewGame) => {
    console.log('[CreateGame] Form submitted with data:', data);

    if (!user?.uid) {
      console.error('[CreateGame] No user found during submission');
      return;
    }

    try {
      const gameData = {
        ...data,
        sportId: Number(data.sportId),
        playerThreshold: Number(data.playerThreshold),
        date: new Date(data.date).toISOString(),
        creatorId: user.uid,
        creatorName: user.displayName || ''
      };

      console.log('[CreateGame] Processed game data:', gameData);
      createGame.mutate(gameData);
    } catch (error) {
      console.error('[CreateGame] Error processing form data:', error);
    }
  };

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
              <form 
                onSubmit={(e) => {
                  console.log('[CreateGame] Raw form submit event triggered');
                  e.preventDefault();
                  form.handleSubmit(handleFormSubmit)(e);
                }}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="sportId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport *</FormLabel>
                      <FormControl>
                        <SportSelect {...field} />
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
                      <FormLabel>Location *</FormLabel>
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
                      <FormLabel>Date & Time *</FormLabel>
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
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
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
                    </FormItem>
                  )}
                />

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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Threshold *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                  onClick={() => console.log('[CreateGame] Submit button clicked')}
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