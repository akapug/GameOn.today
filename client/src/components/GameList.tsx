import GameCard from "./GameCard";
import { type Game } from "@db/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GameListProps {
  games: (Game & { players: any[]; sport: any; })[];
  emptyMessage?: string;
}

export default function GameList({ games, emptyMessage = "No games found" }: GameListProps) {
  const { user, signInWithGoogle } = useAuth();

  const CreateGameButton = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Game
        </Button>
      </DialogTrigger>
      {!user && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You need to sign in to create a game. You can still join existing games without signing in.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={signInWithGoogle}>
              Sign in with Google
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );

  if (games.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {user ? (
          <Link href="/create">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Game
            </Button>
          </Link>
        ) : (
          <CreateGameButton />
        )}
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