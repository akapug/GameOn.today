
import React from "react";
import { Card, CardHeader, CardContent } from "./ui/card";
import type { Game, Player, Sport } from "@db/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import WeatherDisplay from "./WeatherDisplay";
import { Badge } from "./ui/badge";
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
              <a className="text-xl font-semibold hover:underline">
                {game.sport.name}
              </a>
            </Link>
            <div className="text-sm text-muted-foreground">
              {format(new Date(game.date), "EEEE, MMMM d")} at {format(new Date(game.date), "h:mm a")}
            </div>
          </div>
          <Badge variant={game.players.length >= game.playerThreshold ? "default" : "secondary"}>
            {game.players.length}/{game.playerThreshold} players
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {game.location && (
            <div>
              <div className="font-medium mb-1">Location</div>
              <div className="text-sm text-muted-foreground">{game.location}</div>
            </div>
          )}
          {game.weather && <WeatherDisplay weather={game.weather} />}
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;
