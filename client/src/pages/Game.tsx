
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GameCard from "@/components/GameCard";
import { queryKeys } from "@/lib/queryClient";
import type { Game, Player, Sport } from "@db/schema";
import type { WeatherInfo } from "../../../server/services/weather";

interface GameWithDetails extends Game {
  players: Player[];
  sport: Sport;
  weather: WeatherInfo | null;
}

export default function Game() {
  const [, params] = useRoute("/games/:id");
  const [, setLocation] = useLocation();

  const { data: game, isLoading } = useQuery<GameWithDetails>({
    queryKey: params?.id ? queryKeys.games.single(parseInt(params.id, 10)) : undefined,
    enabled: !!params?.id,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>
      <main className="container py-6 px-4">
        <GameCard game={game} fullscreen />
      </main>
    </div>
  );
}
