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
import { useState } from "react";
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
import SportSelect from "@/components/SportSelect";

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
  const form = useForm<Partial<GameType>>({
    defaultValues: {
      title: game?.title,
      location: game?.location,
      date: game?.date,
      playerThreshold: game?.playerThreshold,
    },
  });

  const { data: game, isLoading, error } = useQuery<GameType & { players: Player[]; sport: Sport }>({
    queryKey: [`/api/games/${params?.id}`],
    enabled: !!params?.id,
  });

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${params?.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          email: playerEmail
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${params?.id}`] });
      toast({
        title: "Success",
        description: "You've successfully joined the game!",
      });
      setIsOpen(false);
      setPlayerName("");
      setPlayerEmail("");
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
      queryClient.invalidateQueries({ queryKey: [`/api/games/${params?.id}`] });
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
      queryClient.invalidateQueries({ queryKey: ["games"] });
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

  const shareGame = async (method: 'copy' | 'facebook' | 'twitter' | 'sms') => {
    const gameUrl = `${window.location.origin}/games/${params?.id}`;
    const text = `Join our ${game?.sport.name} game: ${game?.title} at ${game?.location}`;

    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(gameUrl);
        toast({
          title: "Link Copied",
          description: "Game link copied to clipboard!",
        });
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'sms':
        window.open(
          `sms:?body=${encodeURIComponent(`${text}\n${gameUrl}`)}`,
          '_blank'
        );
        break;
    }
  };

  const openInGoogleMaps = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !game || !game.players) {
    toast({
      title: "Error",
      description: "Failed to load game details",
      variant: "destructive",
    });
    setLocation("/");
    return null;
  }

  const progressPercentage = (game.players.length / game.playerThreshold) * 100;
  const hasMinimumPlayers = game.players.length >= game.playerThreshold;
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
                    {game.players.length} {hasMinimumPlayers ? '✓' : '/'} {game.playerThreshold} players needed
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
                    {game.players.map((player, index) => (
                      <p key={player.id} className="text-sm text-muted-foreground">
                        {index + 1}. {player.name}
                      </p>
                    ))}
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
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email (for game notifications)</label>
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