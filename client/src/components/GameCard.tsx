import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Share2,
  Link as LinkIcon,
  Facebook,
  Twitter,
  MessageSquare,
  Trash2
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

interface GameCardProps {
  game: Game & { players: Player[]; sport: Sport };
}

export default function GameCard({ game }: GameCardProps) {
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${game.id}/join`, {
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
      queryClient.invalidateQueries({ queryKey: ["games"] });
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

  const deleteGame = useMutation({
    mutationFn: async () => {
      const deleteToken = localStorage.getItem(`game-${game.id}-token`);
      if (!deleteToken) throw new Error("You don't have permission to delete this game");

      const res = await fetch(`/api/games/${game.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      localStorage.removeItem(`game-${game.id}-token`);
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

  const progressPercentage = (game.players.length / game.playerThreshold) * 100;
  const hasMinimumPlayers = game.players.length >= game.playerThreshold;
  const canDelete = Boolean(localStorage.getItem(`game-${game.id}-token`));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{game.title}</h3>
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
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              {format(new Date(game.date), "PPP p")}
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="mr-2 h-4 w-4" />
              {game.location}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {game.players.length} {hasMinimumPlayers ? '✓' : '/'} {game.playerThreshold} players needed
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlayers(!showPlayers)}
                >
                  {showPlayers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <Progress
                value={progressPercentage}
                className={`h-2 ${hasMinimumPlayers ? 'bg-green-100' : ''}`}
              />
              {showPlayers && game.players.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {game.players.map((player, index) => (
                    <p key={player.id} className="text-sm text-muted-foreground">
                      {index + 1}. {player.name}
                    </p>
                  ))}
                </div>
              )}
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