import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SportSelect from "@/components/SportSelect";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type NewGame } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { apiRequest } from "@/lib/api";
import { toUTC, getUserTimezone } from "@/lib/dates";

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
      timezone: userTimezone, // Use detected timezone as default
      playerThreshold: 10,
      sportId: undefined,
      creatorId: user?.uid || "",
      creatorName: user?.displayName || "",
    },
    resolver: async (data) => {
      const errors: Record<string, { message: string }> = {};

      if (!data.title?.trim()) errors.title = { message: "Title is required" };
      if (!data.location?.trim()) errors.location = { message: "Location is required" };
      if (!data.date) errors.date = { message: "Date is required" };
      if (!data.sportId) errors.sportId = { message: "Sport is required" };
      if (!data.playerThreshold || data.playerThreshold <= 1) {
        errors.playerThreshold = { message: "Player threshold must be greater than 1" };
      }

      return {
        values: data,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const createGame = useMutation({
    mutationFn: async (values: NewGame) => {
      const gameData = {
        ...values,
        date: toUTC(values.date, values.timezone).toISOString(),
        sportId: Number(values.sportId),
        playerThreshold: Number(values.playerThreshold),
      };

      return await apiRequest("/api/games", {
        method: "POST",
        body: JSON.stringify(gameData),
      });
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
                  name="sportId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <SportSelect {...field} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
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
                      <FormLabel>Location</FormLabel>
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
                      <FormLabel>Date & Time ({userTimezone})</FormLabel>
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
                      <FormLabel>Timezone (detected from your browser)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="playerThreshold"
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Player Threshold</FormLabel>
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