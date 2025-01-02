import type { Express } from "express";
import { createServer, type Server } from "http";
import { games, players, sports } from "@db/schema";
import { getDb } from "./services/database";
import { eq } from "drizzle-orm";
import { defaultSports } from "../client/src/lib/sports";
import nodemailer from "nodemailer";
import { getWeatherForecast } from "./services/weather";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendGameOnNotification(gameId: number) {
  const db = getDb();
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      sport: true,
      players: {
        columns: {
          email: true,
          name: true,
        }
      }
    },
  });

  if (!game) return;

  // Filter out players without email
  const playersWithEmail = game.players.filter(player => player.email);

  // Send email to all players who provided email
  const emailPromises = playersWithEmail.map(player =>
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: player.email,
      subject: `Game On! ${game.title} has enough players!`,
      html: `
        <h2>Great news, ${player.name}!</h2>
        <p>The game you joined has reached its minimum player threshold and is now confirmed to happen!</p>
        <p>Game Details:</p>
        <ul>
          <li><strong>Sport:</strong> ${game.sport.name}</li>
          <li><strong>Title:</strong> ${game.title}</li>
          <li><strong>Location:</strong> ${game.location}</li>
          <li><strong>Date:</strong> ${new Date(game.date).toLocaleString()}</li>
        </ul>
        <p>See you at the game!</p>
      `,
    })
  );

  await Promise.all(emailPromises).catch(console.error);
}

async function getGameWithWeather(game: any) {
  const weather = await getWeatherForecast(game.location, new Date(game.date));
  return {
    ...game,
    weather
  };
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Set default headers for all responses
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Initialize default sports if none exist
  app.get("/api/init", async (_req, res) => {
    try {
      const db = getDb();
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
      const db = getDb();
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
      const db = getDb();
      const allGames = await db.query.games.findMany({
        with: {
          sport: true,
          players: {
            columns: {
              id: true,
              name: true,
              email: true,
              joinedAt: true,
              likelihood: true
            }
          }
        },
      });

      // Add weather information to each game
      const gamesWithWeather = await Promise.all(
        allGames.map(getGameWithWeather)
      );

      res.json(gamesWithWeather);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Update the game creation endpoint to handle the datetime correctly
  app.post("/api/games", async (req, res) => {
    try {
      const db = getDb();
      const { sportId, title, location, date, timezone, playerThreshold, creatorId, creatorName, notes } = req.body;

      if (!sportId || !title || !location || !date || !playerThreshold || !creatorId || !timezone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const sport = await db.query.sports.findFirst({
        where: eq(sports.id, Number(sportId)),
      });

      if (!sport) {
        return res.status(400).json({ message: "Selected sport does not exist" });
      }

      // Create a Date object with the timezone information
      // This ensures the date is stored correctly in the database with timezone
      const gameDate = new Date(date);

      const gameData = {
        sportId: Number(sportId),
        title: String(title),
        location: String(location),
        date: gameDate,  // Store as Date object, PostgreSQL will handle timezone
        timezone: String(timezone),
        playerThreshold: Number(playerThreshold),
        creatorId: String(creatorId),
        creatorName: String(creatorName || ''),
        notes: notes ? String(notes) : null,
      };

      const [newGame] = await db.insert(games).values(gameData).returning();
      res.json(newGame);
    } catch (error) {
      console.error("Failed to create game:", error);
      res.status(500).json({ message: `Failed to create game: ${error.message}` });
    }
  });

  // Join a game
  app.post("/api/games/:id/join", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { name, email, likelihood } = req.body;

      // Validate that the game exists
      const game = await db.query.games.findFirst({
        where: eq(games.id, parseInt(id, 10)),
        with: {
          players: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const newPlayer = await db.insert(players).values({
        gameId: parseInt(id, 10),
        name,
        email,
        likelihood: likelihood || 1, // Ensure likelihood is properly handled
      }).returning();

      // Check if adding this player reaches the threshold
      if (game.players.length + 1 === game.playerThreshold) {
        // Send notifications to all players
        await sendGameOnNotification(game.id);
      }

      res.json(newPlayer[0]);
    } catch (error) {
      console.error("Failed to join game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  // Get a single game with related data
  app.get("/api/games/:id", async (req, res) => {
    try {
      const db = getDb();
      const game = await db.query.games.findFirst({
        where: eq(games.id, parseInt(req.params.id, 10)),
        with: {
          sport: true,
          players: {
            columns: {
              id: true,
              name: true,
              email: true,
              joinedAt: true,
              likelihood: true
            }
          }
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameWithWeather = await getGameWithWeather(game);
      res.json(gameWithWeather);
    } catch (error) {
      console.error("Failed to fetch game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Delete game endpoint
  app.delete("/api/games/:id", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;

      // First verify the game exists and creator matches
      const game = await db.query.games.findFirst({
        where: eq(games.id, parseInt(id, 10)),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Delete players first due to foreign key constraint
      await db.delete(players).where(eq(players.gameId, parseInt(id, 10)));

      // Then delete the game
      await db.delete(games).where(eq(games.id, parseInt(id, 10)));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Update a game
  app.put("/api/games/:id", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { title, location, date, playerThreshold, creatorId } = req.body;

      // First verify the game exists and creator matches
      const game = await db.query.games.findFirst({
        where: eq(games.id, parseInt(id, 10)),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.creatorId !== creatorId) {
        return res.status(403).json({ message: "Only the creator can edit this game" });
      }

      const gameDate = new Date(date);

      const [updatedGame] = await db
        .update(games)
        .set({
          title,
          location,
          date: gameDate,  // Store as Date object
          playerThreshold,
        })
        .where(eq(games.id, parseInt(id, 10)))
        .returning();

      res.json(updatedGame);
    } catch (error) {
      console.error("Failed to update game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  return httpServer;
}