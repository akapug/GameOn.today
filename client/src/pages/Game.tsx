import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { type Game as GameType, type Player, type Sport } from "@db/schema";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function Game() {
  const [, params] = useRoute("/games/:id");
  const [, setLocation] = useLocation();

  const { data: game, isLoading, error } = useQuery<GameType & { players: Player[]; sport: Sport }>({
    queryKey: ["/api/games", params?.id],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !game) {
    setLocation("/");
    return null;
  }

  const progressPercentage = (game.players.length / game.playerThreshold) * 100;
  const hasMinimumPlayers = game.players.length >= game.playerThreshold;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex items-center">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">{game.title}</h1>
        </div>
      </header>

      <main className="container py-6 px-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{game.title}</h2>
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
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(game.date), "PPP p")}
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4" />
                {game.location}
              </div>
              <div>
                <div className="flex items-center text-sm mb-2">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {game.players.length} {hasMinimumPlayers ? '✓' : '/'} {game.playerThreshold} players needed
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500 ease-in-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="pl-6 space-y-1">
                    {game.players.map((player, index) => (
                      <p key={player.id} className="text-sm text-muted-foreground">
                        {index + 1}. {player.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}