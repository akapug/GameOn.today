import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  LinkIcon,
  Facebook,
  Twitter,
  MessageSquare,
  Trash2,
  User,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Game, type Sport, type Player } from "@db/schema";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/queryClient";
import WeatherDisplay from "./WeatherDisplay";
import type { WeatherInfo } from "../../../server/services/weather";

interface GameCardProps {
  game: Game & { 
    players: Player[]; 
    sport: Sport;
    weather: WeatherInfo | null;
  };
}

export default function GameCard({ game }: GameCardProps) {
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState(user?.displayName || "");
  const [playerEmail, setPlayerEmail] = useState(user?.email || "");
  const [joinType, setJoinType] = useState<"yes" | "maybe">("yes");
  const [likelihood, setLikelihood] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const canEditResponse = (player: Player) => {
    // For authenticated users, check if response token matches uid
    if (user?.uid && player.responseToken === user.uid) {
      return true;
    }
    // For non-authenticated users, check localStorage token
    const storedToken = localStorage.getItem(`response-token-${player.id}`);
    return storedToken && storedToken === player.responseToken;
  };

  const editResponse = useMutation({
    mutationFn: async (values: { playerId: number; name: string; email: string; likelihood: number }) => {
      const responseToken = user?.uid || localStorage.getItem(`response-token-${values.playerId}`);

      if (!responseToken) {
        throw new Error("You are not authorized to edit this response. If you joined while signed out, try using the same browser.");
      }

      const res = await fetch(`/api/games/${game.id}/players/${values.playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          likelihood: values.likelihood,
          responseToken
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to parse error response" }));
        throw new Error(errorData.message || `Failed to update response: ${res.status}`);
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.single(game.id) });
      toast({
        title: "Success",
        description: "Response updated successfully!",
      });
      setEditingPlayer(null);
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

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${game.id}/join`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: playerName,
          email: playerEmail,
          likelihood: joinType === "yes" ? 1 : likelihood,
          uid: user?.uid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to parse error response" }));
        throw new Error(errorData.message || "Failed to join game");
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Store the response token in localStorage for non-authenticated users
      if (!user?.uid && data.responseToken) {
        localStorage.setItem(`response-token-${data.id}`, data.responseToken);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.games.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.single(game.id) });
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

  const deleteGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${game.id}`, {
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
    const gameUrl = `${window.location.origin}/games/${game.id}`;
    const text = `Join our ${game.sport.name} game: ${game.title} at ${game.location}`;

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
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/games/${game.id}`}>
              <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">{game.title}</h3>
            </Link>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{game.sport.name}</p>
              <span className="text-sm text-muted-foreground">·</span>
              <p className="text-sm text-muted-foreground flex items-center">
                <User className="mr-1 h-3 w-3" />
                {game.creatorName}
              </p>
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
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              {format(new Date(game.date), "PPP p")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <button
                  onClick={() => openInGoogleMaps(game.location)}
                  className="text-primary hover:underline"
                >
                  {game.location}
                </button>
              </div>
              {game.weather && (
                <>
                  <span className="text-muted-foreground">(Expected weather: </span>
                  <WeatherDisplay weather={game.weather} />
                  <span className="text-muted-foreground">)</span>
                </>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Users className="mr-2 h-4 w-4" />
                <span>
                  {game.players.length} players {hasMinimumPlayers ? '✓' : '/'} {game.playerThreshold} needed
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className={`h-2 ${hasMinimumPlayers ? 'bg-green-100' : ''}`}
              />
              <div className="pl-6 space-y-1">
                {game.players.map((player, index) => {
                  const hasLikelihood = player.likelihood !== null && player.likelihood !== undefined;
                  const isFullyCommitted = !hasLikelihood || Number(player.likelihood) === 1;
                  const canEdit = canEditResponse(player);

                  return (
                    <div key={player.id} className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
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
                      {canEdit && (
                        <Dialog open={editingPlayer?.id === player.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingPlayer(null);
                          } else {
                            setEditingPlayer(player);
                            // Initialize form with existing values when opening edit dialog
                            setPlayerName(player.name);
                            setPlayerEmail(player.email || '');
                            const isFullyCommitted = !player.likelihood || Number(player.likelihood) === 1;
                            setJoinType(isFullyCommitted ? "yes" : "maybe");
                            setLikelihood(!isFullyCommitted ? Number(player.likelihood) : 0.5);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Response</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (!editingPlayer) return;

                              editResponse.mutate({
                                playerId: editingPlayer.id,
                                name: playerName || editingPlayer.name,
                                email: playerEmail || editingPlayer.email || '',
                                likelihood: joinType === "yes" ? 1 : likelihood,
                              });
                            }} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Are you joining?</Label>
                                <RadioGroup
                                  value={joinType}
                                  onValueChange={(value) => setJoinType(value as "yes" | "maybe")}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" id="edit-yes" />
                                    <Label htmlFor="edit-yes">Yes, I'm in!</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="maybe" id="edit-maybe" />
                                    <Label htmlFor="edit-maybe">Maybe, depends...</Label>
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
                                    <span className="w-12 text-right">
                                      {Math.round(likelihood * 100)}%
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                  id="edit-name"
                                  placeholder="Your name"
                                  value={playerName || editingPlayer?.name || ''}
                                  onChange={(e) => setPlayerName(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-email">Email (for game notifications)</Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  placeholder="your.email@example.com"
                                  value={playerEmail || editingPlayer?.email || ''}
                                  onChange={(e) => setPlayerEmail(e.target.value)}
                                />
                              </div>

                              <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={editResponse.isPending}
                              >
                                Save Changes
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex-1"
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
      </CardFooter>
    </Card>
  );
}