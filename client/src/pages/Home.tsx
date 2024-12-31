import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import GameList from "@/components/GameList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { useState } from "react";
import SportSelect from "@/components/SportSelect";
import { type Game } from "@db/schema";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryKeys } from "@/lib/queryClient";

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { user, signInWithGoogle } = useAuth();

  const { data: games = [] } = useQuery({
    queryKey: queryKeys.games.all,
    queryFn: () => fetch("/api/games").then(res => res.json()),
  });

  const handleCreateGame = () => {
    if (user) {
      setLocation("/create");
    } else {
      setShowAuthDialog(true);
    }
  };

  const now = startOfDay(new Date());

  // Filter games by selected sport if one is selected
  const filterGamesBySport = (games: Game[]) => {
    if (!selectedSport) return games;
    return games.filter(game => game.sportId === selectedSport);
  };

  const todayGames = filterGamesBySport(
    games.filter(game => isSameDay(new Date(game.date), now))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingGames = filterGamesBySport(
    games.filter(game => isAfter(new Date(game.date), now) && !isSameDay(new Date(game.date), now))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archivedGames = filterGamesBySport(
    games.filter(game => isBefore(new Date(game.date), now))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-2xl font-bold">Sports Games</h1>
            <div className="w-48">
              <SportSelect 
                value={selectedSport || 0} 
                onChange={(value) => setSelectedSport(value || null)}
                allowClear
              />
            </div>
          </div>
          <Button onClick={handleCreateGame}>
            <Plus className="mr-2 h-4 w-4" />
            New Game
          </Button>

          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
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
          </Dialog>
        </div>
      </header>

      <main className="container py-6 px-4">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full justify-start">
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
          <TabsContent value="today" className="mt-6">
            <GameList 
              games={todayGames}
              emptyMessage="No games scheduled for today. Why not create one?"
            />
          </TabsContent>
          <TabsContent value="upcoming" className="mt-6">
            <GameList 
              games={upcomingGames} 
              emptyMessage="No upcoming games scheduled. Create a new game to get started!"
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