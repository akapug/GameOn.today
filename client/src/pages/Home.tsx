import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import GameList from "@/components/GameList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Home() {
  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: () => fetch("/api/games").then(res => res.json()),
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const todayGames = games.filter(game => 
    format(new Date(game.date), 'yyyy-MM-dd') === today
  );

  const upcomingGames = games.filter(game => 
    format(new Date(game.date), 'yyyy-MM-dd') > today
  );

  const archivedGames = games.filter(game => 
    format(new Date(game.date), 'yyyy-MM-dd') < today
  );

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
            <TabsTrigger value="today">Today's Games</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <GameList games={todayGames} />
          </TabsContent>
          <TabsContent value="upcoming">
            <GameList games={upcomingGames} />
          </TabsContent>
          <TabsContent value="archive">
            <GameList games={archivedGames} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}