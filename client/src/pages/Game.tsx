import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function Game() {
  const [, params] = useRoute("/games/:id");
  const [, setLocation] = useLocation();

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", params?.id],
    enabled: !!params?.id,
  });

  useEffect(() => {
    if (!isLoading && game) {
      // Redirect to home with the game in view
      setLocation("/");
    }
  }, [game, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return null;
}
