import GameCard from "./GameCard";
import { type Game } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface GameListProps {
  games: (Game & { players: any[]; sport: any; })[];
  emptyMessage?: string;
}

export default function GameList({ games, emptyMessage = "No games found" }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        <Link href="/create">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Game
          </Button>
        </Link>
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