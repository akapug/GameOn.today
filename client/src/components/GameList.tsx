import GameCard from "./GameCard";
import { type Game, type Player, type Activity } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherInfo } from "../../server/services/weather";
import { useQuery } from '@tanstack/react-query'; // Added import for useQuery

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
  //Added useQuery hook with caching parameters
  const { data: fetchedGames, isLoading, error } = useQuery({
    queryKey: ["/api/games"],
    queryFn: () => fetch('/api/games').then(res => res.json()), //Added fetch function
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const gamesToDisplay = fetchedGames || games; // Use fetchedGames if available, otherwise fallback to props

  if (gamesToDisplay.length === 0 && onCreateGame) {
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
      {gamesToDisplay.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}