import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { type Game as GameType, type Player, type Sport } from "@db/schema";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function Game() {
  const [, params] = useRoute("/games/:id");
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [joinType, setJoinType] = useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = useState(0.5);

  const form = useForm<Partial<GameType>>();

  const { data: game, isLoading, error } = useQuery<GameType & { players: Player[]; sport: Sport }>({
    queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : null,
    enabled: !!params?.id,
  });

  // Handle error state with useEffect
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load game details",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [error, toast, setLocation]);

  // Update form values when game data is available
  useEffect(() => {
    if (game) {
      form.reset({
        title: game.title,
        location: game.location,
        date: game.date,
        playerThreshold: game.playerThreshold,
      });
    }
  }, [game, form]);

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${params?.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          email: playerEmail,
          likelihood: joinType === "yes" ? 1 : likelihood
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join game");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate both the individual game and the games list
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      queryClient.invalidateQueries({ 
        queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : undefined 
      });
      toast({
        title: "Success",
        description: "You've successfully joined the game!",
      });
      setIsOpen(false);
      setPlayerName("");
      setPlayerEmail("");
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

  const editGame = useMutation({
    mutationFn: async (values: Partial<GameType>) => {
      const res = await fetch(`/api/games/${params?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          creatorId: game?.creatorId,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : undefined });
      toast({
        title: "Success",
        description: "Game updated successfully",
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

  const deleteGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${params?.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      toast({
        title: "Success",
        description: "Game deleted successfully",
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

  if (!game) {
    return null;
  }

  const calculateProgress = () => {
    const total = game.players.reduce((sum, player) => {
      const likelihood = player.likelihood ? Number(player.likelihood) : 1;
      return sum + likelihood;
    }, 0);
    return (total / game.playerThreshold) * 100;
  };

  const progressPercentage = calculateProgress();
  const hasMinimumPlayers = progressPercentage >= 100;
  const canDelete = user && game.creatorId === user.uid;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold ml-4">{game.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Game</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => editGame.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field: { value, ...field } }) => (
                          <FormItem>
                            <FormLabel>Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                value={value ? new Date(value).toISOString().slice(0, 16) : ''}
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
                            <FormLabel>Player Threshold</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="2"
                                {...field}
                                value={value}
                                onChange={e => onChange(parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={editGame.isPending}>
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => shareGame('copy')}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareGame('facebook')}>
                  <Facebook className="mr-2 h-4 w-4" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareGame('twitter')}>
                  <Twitter className="mr-2 h-4 w-4" />
                  Share on Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareGame('sms')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Share via SMS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canDelete && (
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Game</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete this game? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteGame.mutate();
                        setShowDeleteConfirm(false);
                      }}
                      disabled={deleteGame.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 px-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{game.title}</h2>
                <p className="text-sm text-muted-foreground">{game.sport.name}</p>
              </div>
              {hasMinimumPlayers && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Ready to Play!
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(game.date), "PPP p")}
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4" />
                <button
                  onClick={() => openInGoogleMaps(game.location)}
                  className="text-primary hover:underline"
                >
                  {game.location}
                </button>
              </div>
              <div>
                <div className="flex items-center text-sm mb-2">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {game.players?.length || 0} {hasMinimumPlayers ? '✓' : '/'} {game.playerThreshold} needed
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500 ease-in-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="pl-6 space-y-1">
                    {game.players?.map((player, index) => {
                      const hasLikelihood = player.likelihood !== null && player.likelihood !== undefined;
                      const isFullyCommitted = !hasLikelihood || Number(player.likelihood) === 1;

                      return (
                        <p key={player.id} className="text-sm text-muted-foreground">
                          {index + 1}. {player.name}
                          {isFullyCommitted ? (
                            <span className="ml-1 text-xs text-green-600">
                              Yes!
                            </span>
                          ) : (
                            <span className="ml-1 text-xs text-yellow-600">
                              Maybe ({Math.round(Number(player.likelihood) * 100)}%)
                            </span>
                          )}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full mt-4"
                    variant={hasMinimumPlayers ? "outline" : "default"}
                  >
                    {hasMinimumPlayers ? "Join Game (Has Enough Players)" : "Join Game"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join {game.title}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    joinGame.mutate();
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Are you joining?</Label>
                      <RadioGroup
                        value={joinType}
                        onValueChange={(value) => setJoinType(value as "yes" | "maybe")}
                        className="flex flex-col space-y-1"
                      >
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
                            className="flex-1"
                          />
                          <span className="w-12 text-right">{Math.round(likelihood * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (for game notifications)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={playerEmail}
                        onChange={(e) => setPlayerEmail(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={joinGame.isPending}>
                      Join
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}