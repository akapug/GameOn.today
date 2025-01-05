import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, MapPin, Users, Share2, LinkIcon, Facebook, Twitter, MessageSquare, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { formatWithTimezone, utcToLocalInput, localInputToUTC } from "@/lib/dates";
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
import type { Game, Player, Sport } from "@db/schema";
import type { WeatherInfo } from "../../server/services/weather";

interface GameCardProps {
  game: Game & {
    players: Player[];
    sport: Sport;
    weather: WeatherInfo | null;
  };
  fullscreen?: boolean;
}

export default function GameCard({ game, fullscreen = false }: GameCardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = React.useState(user?.displayName || "");
  const [playerEmail, setPlayerEmail] = React.useState(user?.email || "");
  const [joinType, setJoinType] = React.useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = React.useState(0.5);
  const [isOpen, setIsOpen] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Added state for edit dialog
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const canEditResponse = (player: Player) => {
    if (!player.responseToken) return false;
    if (user?.uid) {
      return player.responseToken === user.uid;
    }
    const storedToken = localStorage.getItem(`response-token-${player.id}`);
    return Boolean(storedToken && storedToken === player.responseToken);
  };

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

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${game.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          email: playerEmail,
          likelihood: joinType === "yes" ? 1 : (joinType === "no" ? 0 : likelihood),
          uid: user?.uid,
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to join game");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (!user?.uid && data.responseToken) {
        localStorage.setItem(`response-token-${data.id}`, data.responseToken);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      toast({ title: "Success", description: "You've joined the game!" });
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
    mutationFn: async (values: { playerId: number; name: string; email: string; likelihood: number }) => {
      const responseToken = user?.uid || localStorage.getItem(`response-token-${values.playerId}`);
      if (!responseToken) throw new Error("Not authorized to edit");

      const res = await fetch(`/api/games/${game.id}/players/${values.playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, responseToken }),
      });
      if (!res.ok) throw new Error("Failed to update response");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      toast({ title: "Success", description: "Response updated!" });
      setEditingPlayer(null);
      setIsEditDialogOpen(false); // Close the dialog after successful update
    },
  });

  const toUTC = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return utcDate;
  }

  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/games/${game.id}`}>
              <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                {game.title || `${game.sport.name}`}
              </h3>
            </Link>
            <div className="text-sm text-muted-foreground">
              Organized by {game.creatorName}
            </div>
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
            {formatWithTimezone(game.date, "PPP p", game.timezone)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.location)}`, '_blank')}
                className="text-primary hover:underline"
              >
                {game.location}
              </button>
            </div>
            {game.weather && (
              <div className="flex items-center ml-6">
                <span className="text-muted-foreground">
                  Expected: <WeatherDisplay weather={game.weather} />
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center text-sm mb-2">
              <Users className="mr-2 h-4 w-4" />
              <span>
                {game.playerThreshold} players needed / {game.players.length} responded
                <span className="text-xs text-muted-foreground ml-1">
                  (~{(game.playerThreshold * (progressPercentage / 100)).toFixed(1)} expected)
                </span>
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mt-2" />
            <div className="mt-2 space-y-1">
              {game.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {index + 1}. {player.name}
                    {(!player.likelihood || player.likelihood === 1) ? (
                      <span className="ml-1 text-xs text-green-600">Yes!</span>
                    ) : (
                      <span className="ml-1 text-xs text-yellow-600">
                        Maybe ({Math.round(Number(player.likelihood) * 100)}%)
                      </span>
                    )}
                  </div>
                  {canEditResponse(player) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPlayer(player);
                        setPlayerName(player.name);
                        setPlayerEmail(player.email || '');
                        setJoinType(!player.likelihood || player.likelihood === 1 ? "yes" : "maybe");
                        setLikelihood(player.likelihood || 0.5);
                        setIsEditDialogOpen(true); // Open the dialog when Edit button is clicked
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Join Game Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Game</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              joinGame.mutate();
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
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">Join Game</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Response Dialog */}
        <Dialog
          open={isEditDialogOpen} // Use the new state to control the dialog
          onOpenChange={setIsEditDialogOpen} // Update the state when the dialog closes
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Response</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingPlayer) return;

              if (joinType === "no") {
                // Delete the response
                fetch(`/api/games/${game.id}/players/${editingPlayer.id}`, {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem(`response-token-${editingPlayer.id}`) || user?.uid}`
                  }
                })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
                    toast({ title: "Success", description: "Response removed successfully" });
                    setEditingPlayer(null);
                    setIsEditDialogOpen(false); // Close the dialog after removal
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
                  playerId: editingPlayer.id,
                  name: playerName,
                  email: playerEmail,
                  likelihood: joinType === "yes" ? 1 : likelihood,
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
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (optional)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant={joinType === "no" ? "destructive" : "default"}
                className="w-full"
              >
                {joinType === "no" ? "Remove Me" : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setIsOpen(true)}
          variant={hasMinimumPlayers ? "outline" : "default"}
        >
          {hasMinimumPlayers ? "Join Game (Has Enough Players)" : "Join Game"}
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
              navigator.clipboard.writeText(`${window.location.origin}/games/${game.id}`);
              toast({ title: "Link Copied", description: "Game link copied to clipboard!" });
            }}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/games/${game.id}`)}`,
                '_blank'
              );
            }}>
              <Facebook className="mr-2 h-4 w-4" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/games/${game.id}`)}&text=${encodeURIComponent(`Join our ${game.sport.name} game!`)}`,
                '_blank'
              );
            }}>
              <Twitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(
                `sms:?body=${encodeURIComponent(`Join our ${game.sport.name} game: ${window.location.origin}/games/${game.id}`)}`,
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Game</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedGame = {
                  ...game,
                  title: formData.get('title') as string,
                  location: formData.get('location') as string,
                  date: toUTC(
                    formData.get('date') as string,
                    game.timezone
                  ).toISOString(),
                  playerThreshold: parseInt(formData.get('playerThreshold') as string, 10),
                  creatorId: user?.uid,
                };

                fetch(`/api/games/${game.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatedGame),
                })
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to update game");
                    return res.json();
                  })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
                    toast({ title: "Success", description: "Game updated successfully" });
                    setIsEditDialogOpen(false);
                    e.currentTarget.closest('dialog')?.close();
                  })
                  .catch((error) => {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive",
                    });
                  });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    name="title"
                    defaultValue={game.title}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    name="location"
                    defaultValue={game.location}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time ({game.timezone})</Label>
                  <Input
                    name="date"
                    type="datetime-local"
                    defaultValue={utcToLocalInput(game.date, game.timezone)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Player Threshold</Label>
                  <Input
                    name="playerThreshold"
                    type="number"
                    min="2"
                    defaultValue={game.playerThreshold}
                  />
                </div>
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
                <DialogTitle>Delete Game</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete this game? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    fetch(`/api/games/${game.id}`, { method: "DELETE" })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
                        toast({ title: "Success", description: "Game deleted successfully" });
                      })
                      .catch(() => {
                        toast({
                          title: "Error",
                          description: "Failed to delete game",
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