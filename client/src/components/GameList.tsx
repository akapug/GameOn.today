import GameCard from "./GameCard";
import { type Game } from "@db/schema";

interface GameListProps {
  games: (Game & { players: any[]; sport: any; })[];
}

export default function GameList({ games }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No games found</p>
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
