
import React from "react";
import { Card, CardHeader, CardContent } from "./ui/card";
import type { Game, Player, Sport } from "@db/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import WeatherDisplay from "./WeatherDisplay";
import { Button } from "./ui/button";
import { Share2 } from "lucide-react";
import type { WeatherInfo } from "../../server/services/weather";

interface GameCardProps {
  game: Game & {
    players: Player[];
    sport: Sport;
    weather: WeatherInfo | null;
  };
  fullscreen?: boolean;
}

function GameCard({ game, fullscreen = false }: GameCardProps) {
  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/games/${game.id}`}>
              <h3 className="text-xl font-semibold hover:underline">
                {format(new Date(game.date), "EEEE")} pickup
              </h3>
            </Link>
            <div className="text-sm text-muted-foreground">
              {game.sport.name} · {game.organizer?.name || "Unknown"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(game.date), "MMMM do, yyyy h:mm a")}</span>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span>{game.location}</span>
            {game.weather && (
              <span>(Expected weather: {Math.round(game.weather.temperature)}°F)</span>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {game.players.length} players / {game.playerThreshold} needed
          </div>

          <div className="space-y-2">
            {game.players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                <span>{index + 1}. {player.name}</span>
                {player.status === 'maybe' && <span className="text-yellow-500">(Maybe)</span>}
                {player.status === 'yes' && <span className="text-green-500">(Yes!)</span>}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button className="flex-1">Join Game</Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;
