import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import GameList from "@/components/GameList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import { useState } from "react";
import SportSelect from "@/components/SportSelect";
import { type Game, type Player, type Sport } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import AuthDialog from "@/components/AuthDialog";
import { queryKeys } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { WeatherInfo } from "../../../server/services/weather";

interface GameWithDetails extends Game {
  players: Array<Player>;
  sport: Sport;
  weather: WeatherInfo | null;
}

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data: games = [] } = useQuery<GameWithDetails[]>({
    queryKey: queryKeys.games.all,
  });

  const handleCreateGame = () => {
    if (user) {
      setLocation("/create");
    } else {
      setShowAuthDialog(true);
    }
  };

  const now = startOfDay(new Date());

  const filterGamesBySport = (games: GameWithDetails[]) => {
    if (!selectedSport) return games;
    return games.filter(game => game.sportId === selectedSport);
  };

  // Show warning if any games are in different timezones
  const hasGamesInDifferentTimezones = games.some(game => game.timezone !== userTimezone);

  const todayGames = filterGamesBySport(
    games.filter(game => {
      const gameDate = utcToZonedTime(new Date(game.date), game.timezone);
      return isSameDay(gameDate, now);
    })
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingGames = filterGamesBySport(
    games.filter(game => {
      const gameDate = utcToZonedTime(new Date(game.date), game.timezone);
      return isAfter(gameDate, now) && !isSameDay(gameDate, now);
    })
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archivedGames = filterGamesBySport(
    games.filter(game => {
      const gameDate = utcToZonedTime(new Date(game.date), game.timezone);
      return isBefore(gameDate, now);
    })
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectTo="/create"
      />
      <main className="container py-6 px-4">
        {hasGamesInDifferentTimezones && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some games are scheduled in different timezones. Please check each game's timezone carefully.
              Your current timezone is: {userTimezone}
            </AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="today" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList className="justify-start w-full sm:w-auto">
              <TabsTrigger value="today" className="relative">
                Today's Games
                {todayGames.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {todayGames.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {upcomingGames.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {upcomingGames.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="relative">
                Archive
                {archivedGames.length > 0 && (
                  <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {archivedGames.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <SportSelect 
                  value={selectedSport || 0} 
                  onChange={(value) => setSelectedSport(value || null)}
                  allowClear
                />
              </div>
              <Button onClick={handleCreateGame} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Game
              </Button>
            </div>
          </div>
          <TabsContent value="today" className="mt-6">
            <GameList 
              games={todayGames}
              emptyMessage="No games scheduled for today. Why not create one?"
              onCreateGame={handleCreateGame}
            />
          </TabsContent>
          <TabsContent value="upcoming" className="mt-6">
            <GameList 
              games={upcomingGames} 
              emptyMessage="No upcoming games scheduled. Create a new game to get started!"
              onCreateGame={handleCreateGame}
            />
          </TabsContent>
          <TabsContent value="archive" className="mt-6">
            <GameList 
              games={archivedGames}
              emptyMessage="No past games found."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}