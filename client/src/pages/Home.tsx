import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import GameList from "@/components/GameList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { useState } from "react";
import ActivitySelect from "@/components/ActivitySelect";
import { type Game, type Player, type Activity } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import AuthDialog from "@/components/AuthDialog";
import { queryKeys } from "@/lib/queryClient";
import type { WeatherInfo } from "../../../server/services/weather";

interface GameWithDetails extends Game {
  players: Array<Player>;
  activity: Activity;
  weather: WeatherInfo | null;
}

export default function Home() {
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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

  const now = new Date();

  const filterGamesByActivity = (games: GameWithDetails[]) => {
    if (selectedActivity === null) return games;
    return games.filter(game => game.activity.id === selectedActivity);
  };

  const isArchived = (game: GameWithDetails) => {
    const gameDate = new Date(game.date);
    const threeHoursAfterStart = new Date(gameDate.getTime() + (3 * 60 * 60 * 1000));
    return isBefore(threeHoursAfterStart, now);
  };

  const upcomingGames = filterGamesByActivity(
    games.filter(game => !isArchived(game))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archivedGames = filterGamesByActivity(
    games.filter(game => isArchived(game))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        redirectTo="/create"
      />
      <main className="container py-6 px-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList className="justify-start w-full sm:w-auto">
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
                <ActivitySelect 
                  value={selectedActivity || 0} 
                  onChange={(value) => setSelectedActivity(value || null)}
                  allowClear
                />
              </div>
              <Button onClick={handleCreateGame} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Game
              </Button>
            </div>
          </div>
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