import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import GameList from "@/components/GameList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";

export default function Home() {
  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => fetch("/api/games").then(res => res.json()),
  });

  const now = startOfDay(new Date());

  const todayGames = games
    .filter(game => isSameDay(new Date(game.date), now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingGames = games
    .filter(game => isAfter(new Date(game.date), now) && !isSameDay(new Date(game.date), now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archivedGames = games
    .filter(game => isBefore(new Date(game.date), now))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sports Games</h1>
          <Link href="/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Game
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-6">
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