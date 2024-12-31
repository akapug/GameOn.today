import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Game, type Sport, type Player } from "@db/schema";

interface GameCardProps {
  game: Game & { players: Player[]; sport: Sport };
}

export default function GameCard({ game }: GameCardProps) {
  const [playerName, setPlayerName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{game.title}</h3>
            <p className="text-sm text-muted-foreground">{game.sport.name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            {format(new Date(game.date), "PPP p")}
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4" />
            {game.location}
          </div>
          <div className="flex items-center text-sm">
            <Users className="mr-2 h-4 w-4" />
            {game.players.length} / {game.playerThreshold} players
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              Join Game
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