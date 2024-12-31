import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { games, players, sports } from "@db/schema";
import { eq } from "drizzle-orm";
import { defaultSports } from "../client/src/lib/sports";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Initialize default sports if none exist
  app.get("/api/init", async (_req, res) => {
    const existingSports = await db.select().from(sports);
    if (existingSports.length === 0) {
      await db.insert(sports).values(defaultSports);
    }
    res.json({ success: true });
  });

  // Get all sports
  app.get("/api/sports", async (_req, res) => {
    const allSports = await db.select().from(sports);
    res.json(allSports);
  });

  // Get all games with related data
  app.get("/api/games", async (_req, res) => {
    const allGames = await db.query.games.findMany({
      with: {
        sport: true,
        players: true,
      },
    });
    res.json(allGames);
  });

  // Create a new game
  app.post("/api/games", async (req, res) => {
    const newGame = await db.insert(games).values({
      ...req.body,
      date: new Date(req.body.date),
    }).returning();
    res.json(newGame[0]);
  });

  // Join a game
  app.post("/api/games/:id/join", async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const newPlayer = await db.insert(players).values({
      gameId: parseInt(id, 10),
      name,
    }).returning();

    res.json(newPlayer[0]);
  });

  return httpServer;
}
