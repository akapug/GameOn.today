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
    try {
      const existingSports = await db.select().from(sports);
      if (existingSports.length === 0) {
        await db.insert(sports).values(defaultSports);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to initialize sports:", error);
      res.status(500).json({ message: "Failed to initialize sports" });
    }
  });

  // Get all sports
  app.get("/api/sports", async (_req, res) => {
    try {
      const allSports = await db.select().from(sports);
      res.json(allSports);
    } catch (error) {
      console.error("Failed to fetch sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Get all games with related data
  app.get("/api/games", async (_req, res) => {
    try {
      const allGames = await db.query.games.findMany({
        with: {
          sport: true,
          players: true,
        },
      });
      res.json(allGames);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      // Validate that the sport exists
      const sport = await db.query.sports.findFirst({
        where: eq(sports.id, req.body.sportId),
      });

      if (!sport) {
        return res.status(400).json({ message: "Selected sport does not exist" });
      }

      const newGame = await db.insert(games).values({
        ...req.body,
        date: new Date(req.body.date),
      }).returning();

      res.json(newGame[0]);
    } catch (error) {
      console.error("Failed to create game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Join a game
  app.post("/api/games/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validate that the game exists
      const game = await db.query.games.findFirst({
        where: eq(games.id, parseInt(id, 10)),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const newPlayer = await db.insert(players).values({
        gameId: parseInt(id, 10),
        name,
      }).returning();

      res.json(newPlayer[0]);
    } catch (error) {
      console.error("Failed to join game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  return httpServer;
}