import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Game, type Sport, type Player } from "@db/schema";
import { Progress } from "@/components/ui/progress";

interface GameCardProps {
  game: Game & { players: Player[]; sport: Sport };
}

export default function GameCard({ game }: GameCardProps) {
  const [playerName, setPlayerName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const queryClient = useQueryClient();

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/games/${game.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName }),
      });

      if (!res.ok) {
        throw new Error("Failed to join game");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setIsOpen(false);
      setPlayerName("");
    },
  });

  const fillPercentage = (game.players.length / game.playerThreshold) * 100;
  const isFull = game.players.length >= game.playerThreshold;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{game.title}</h3>
            <p className="text-sm text-muted-foreground">{game.sport.name}</p>
          </div>
          {isFull && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Full
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
                  <span>{game.players.length} / {game.playerThreshold} players</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPlayers(!showPlayers)}
                >
                  {showPlayers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <Progress value={fillPercentage} className="h-2" />
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
      <CardFooter>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={isFull}
            >
              {isFull ? "Game is Full" : "Join Game"}
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
              <Input
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={joinGame.isPending}>
                Join
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}