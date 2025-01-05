import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { games, players, sports } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { defaultSports } from "../client/src/lib/sports";
import nodemailer from "nodemailer";
import { getWeatherForecast, type WeatherInfo } from "./services/weather";
import crypto from 'crypto';
import { formatWithTimezone, toUTC } from "../client/src/lib/dates";

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

  // Format the game date in the game's timezone for email
  const formattedGameDate = formatWithTimezone(
    game.date,
    'PPP p',
    game.timezone || 'UTC'
  );

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
          <li><strong>Date:</strong> ${formattedGameDate}</li>
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

  // Set default headers for all API responses
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Error handling middleware
  app.use((err: Error, _req: any, res: any, next: any) => {
    console.error('Error:', err);

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }

    // Ensure response is always JSON
    if (!res.headersSent) {
      res.status(500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }
  });

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
          players: {
            columns: {
              id: true,
              name: true,
              email: true,
              joinedAt: true,
              likelihood: true,
              responseToken: true
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

  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const { sportId, title, location, date, timezone, playerThreshold, creatorId, creatorName, endTime, notes, webLink } = req.body;

      if (!sportId || !title || !location || !date || !playerThreshold || !creatorId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const sport = await db.query.sports.findFirst({
        where: eq(sports.id, Number(sportId)),
      });

      if (!sport) {
        return res.status(400).json({ message: "Selected sport does not exist" });
      }

      // Ensure the date is stored in UTC
      const gameData = {
        sportId: Number(sportId),
        title: String(title),
        location: String(location),
        date: toUTC(date, timezone || 'UTC'),
        timezone: timezone || 'UTC',
        playerThreshold: Number(playerThreshold),
        creatorId: String(creatorId),
        creatorName: String(creatorName || ''),
        endTime: endTime ? toUTC(endTime, timezone || 'UTC') : null,
        notes: notes || null,
        webLink: webLink || null
      };

      const [newGame] = await db.insert(games).values(gameData).returning();

      // If this is a recurring game, schedule the next one
      if (gameData.isRecurring && gameData.recurrenceFrequency) {
        const nextDate = new Date(gameData.date);
        switch (gameData.recurrenceFrequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        }

        // Create the next recurring game
        await db.insert(games).values({
          ...gameData,
          date: nextDate.toISOString(),
          endTime: gameData.endTime ? new Date(new Date(gameData.endTime).getTime() + (nextDate.getTime() - new Date(gameData.date).getTime())).toISOString() : null,
          parentGameId: newGame.id,
        });
      }

      res.json(newGame);
    } catch (error) {
      console.error("Failed to create game:", error);
      res.status(500).json({ message: `Failed to create game: ${error.message}` });
    }
  });

  // Join a game
  app.post("/api/games/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, likelihood, uid } = req.body;

      console.log("Join game request:", { id, name, email, likelihood, uid });

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Validate game ID
      const gameId = parseInt(id, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      // Generate response token - either use Firebase UID or generate UUID
      const responseToken = uid || crypto.randomUUID();

      // Ensure responseToken is never null
      if (!responseToken) {
        return res.status(400).json({ message: "Unable to generate response token" });
      }

      // Validate that the game exists
      const game = await db.query.games.findFirst({
        where: eq(games.id, gameId),
        with: {
          players: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Check if player with same email already exists
      if (email) {
        const existingPlayer = game.players.find(p => p.email === email);
        if (existingPlayer) {
          return res.status(400).json({ message: "You have already joined this game" });
        }
      }

      try {
        const [newPlayer] = await db.insert(players).values({
          gameId: gameId,
          name: name.trim(),
          email: email?.trim(),
          likelihood: likelihood || 1,
          responseToken: responseToken,
        }).returning();

        console.log("New player created:", newPlayer);

        // Calculate expected players including the new player
        const expectedPlayers = game.players.reduce((sum, player) => {
          const likelihood = player.likelihood ? Number(player.likelihood) : 1;
          return sum + likelihood;
        }, likelihood || 1); // Add the new player's likelihood

        // Check if expected players reaches the threshold
        if (expectedPlayers >= game.playerThreshold) {
          // Send notifications to all players but don't wait for it
          sendGameOnNotification(game.id).catch(error => {
            console.error("Failed to send notifications:", error);
          });
        }

        res.json({ ...newPlayer, responseToken }); // Return the token to be stored in localStorage
      } catch (dbError) {
        console.error("Database error when joining game:", dbError);
        return res.status(500).json({ message: "Failed to join game. Please try again." });
      }
    } catch (error) {
      console.error("Error in join game route:", error);
      res.status(500).json({ message: "An unexpected error occurred. Please try again." });
    }
  });

  // Delete player response
  app.delete("/api/games/:gameId/players/:playerId", async (req, res) => {
    try {
      const { gameId, playerId } = req.params;
      const responseToken = req.headers.authorization?.replace('Bearer ', '');

      if (!responseToken) {
        return res.status(401).json({ message: "Authorization token required" });
      }

      const [deletedPlayer] = await db
        .delete(players)
        .where(
          and(
            eq(players.id, parseInt(playerId, 10)),
            eq(players.gameId, parseInt(gameId, 10)),
            eq(players.responseToken, responseToken)
          )
        )
        .returning();

      if (!deletedPlayer) {
        return res.status(404).json({ message: "Player not found or unauthorized" });
      }

      return res.json(deletedPlayer);
    } catch (error) {
      console.error("Failed to delete player response:", error);
      return res.status(500).json({ message: "Failed to delete response" });
    }
  });

  // Edit player response
  app.put("/api/games/:gameId/players/:playerId", async (req, res) => {
    try {
      const { gameId, playerId } = req.params;
      const { name, email, likelihood, responseToken } = req.body;

      if (!responseToken) {
        return res.status(401).json({ message: "Authorization token required" });
      }

      // First verify the player exists and token matches
      const existingPlayer = await db.query.players.findFirst({
        where: and(
          eq(players.id, parseInt(playerId, 10)),
          eq(players.gameId, parseInt(gameId, 10)),
          eq(players.responseToken, responseToken)
        ),
      });

      if (!existingPlayer) {
        return res.status(404).json({ message: "Player not found or unauthorized" });
      }

      const [updatedPlayer] = await db
        .update(players)
        .set({
          name: name || existingPlayer.name,
          email: email || existingPlayer.email,
          likelihood: likelihood ?? existingPlayer.likelihood,
        })
        .where(
          and(
            eq(players.id, parseInt(playerId, 10)),
            eq(players.responseToken, responseToken)
          )
        )
        .returning();

      return res.json(updatedPlayer);
    } catch (error) {
      console.error("Failed to update player response:", error);
      return res.status(500).json({ message: "Failed to update response" });
    }
  });

  // Get a single game with related data
  app.get("/api/games/:id", async (req, res) => {
    try {
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
              likelihood: true,
              responseToken: true
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
      const { id } = req.params;
      const { title, location, date, timezone, playerThreshold, creatorId, endTime, notes, webLink } = req.body;

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

      // Convert date to UTC before storage
      const [updatedGame] = await db
        .update(games)
        .set({
          title,
          location,
          date: toUTC(date, timezone || game.timezone),
          timezone: timezone || game.timezone,
          playerThreshold,
          endTime: endTime ? toUTC(endTime, timezone || game.timezone) : null,
          notes: notes || null,
          webLink: webLink || null,
        })
        .where(eq(games.id, parseInt(id, 10)))
        .returning();

      // Fetch fresh weather data for the updated location/time
      const gameWithWeather = await getGameWithWeather(updatedGame);
      res.json(gameWithWeather);
    } catch (error) {
      console.error("Failed to update game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  return httpServer;
}