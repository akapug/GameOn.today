import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Game } from "@db/schema";
import { queryKeys } from "@/lib/queryClient";

export default function UserGames() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/user", { uid: user?.uid }],
    enabled: !!user,
  });

  if (isLoading || !games) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading your games...</div>;
  }

  if (games.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        You haven't created any games yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 p-2">
        {games.map((game) => (
          <Card 
            key={game.urlHash} 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setLocation(`/games/${game.urlHash}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{game.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(game.date), "PPP")}
                  </p>
                </div>
                {game.isPrivate ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}