import { Card, CardHeader, CardContent } from "./ui/card";
import { Calendar } from "lucide-react";
import { formatWithTimezone } from "@/lib/dates";
import type { Game, Player, Sport } from "@db/schema";
import type { WeatherInfo } from "../../server/services/weather";

interface GameCardProps {
  game: Game & {
    players: Player[];
    sport: Sport;
    weather: WeatherInfo | null;
  };
  fullscreen?: boolean;
}

export default function GameCard({ game, fullscreen = false }: GameCardProps) {
  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        {/* Header content */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            {formatWithTimezone(game.date, 'PPP p', game.timezone)}
          </div>

          {/* CardContent */}
        </div>
        {/* Rest of the component */}
      </CardContent>
    </Card>
  );
}