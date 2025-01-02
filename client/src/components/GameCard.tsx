
import React from "react";
import { Card, CardHeader, CardContent } from "./ui/card";
import type { Game } from "@db/schema";

interface GameCardProps {
  game: Game;
  fullscreen?: boolean;
}

function GameCard({ game, fullscreen = false }: GameCardProps) {
  return (
    <Card className={`w-full ${fullscreen ? "max-w-4xl mx-auto mt-6" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          {/* Your existing card content */}
        </div>
      </CardHeader>
      <CardContent>
        {/* Your existing content */}
      </CardContent>
    </Card>
  );
}

export default GameCard;
