import GameCard from "./GameCard";
import { type Game, type Player, type Activity } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherInfo } from "../../server/services/weather";

interface GameListProps {
  games: Array<Game & { 
    players: Array<Player>;
    activity: Activity;
    weather: WeatherInfo | null;
  }>;
  emptyMessage?: string;
  onCreateGame?: () => void;
}

export default function GameList({ games, emptyMessage = "No games found", onCreateGame }: GameListProps) {
  if (games.length === 0 && onCreateGame) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        <Button variant="outline" size="sm" onClick={onCreateGame}>
          <Plus className="mr-2 h-4 w-4" />
          Create Game
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}