import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { games, players, activities } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { defaultActivities } from "../client/src/lib/activities";
import nodemailer from "nodemailer";
import { getWeatherForecast } from "./services/weather";
import { formatWithTimezone, toUTC } from "../client/src/lib/dates";

// Helper function to generate 6-char game hash
function generateGameHash() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Helper function to generate random URL hash
function generateUrlHash(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate unique hash by checking against existing ones
async function generateUniqueUrlHash() {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const hash = generateUrlHash();
    const existing = await db.query.games.findFirst({
      where: eq(games.urlHash, hash),
    });

    if (!existing) {
      return hash;
    }
    attempts++;
  }

  throw new Error("Could not generate unique hash after maximum attempts");
}

// Email transport configuration
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
      activity: true,
      players: {
        columns: {
          email: true,
          name: true,
        }
      }
    },
  });

  if (!game) return;

  const playersWithEmail = game.players.filter(player => player.email);
  const formattedGameDate = formatWithTimezone(game.date, 'PPP p', game.timezone || 'UTC');

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
          <li><strong>Activity:</strong> ${game.activity.name}</li>
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
  return {
    ...game,
    isRecurring: game.isRecurring === true || game.isRecurring === 't',
    isPrivate: game.isPrivate === true || game.isPrivate === 't',
    weather: await getWeatherForecast(game.location, new Date(game.date))
  };
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // API response headers middleware
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Get user's games (both private and public)
  app.get("/api/games/user", async (req, res) => {
    try {
      const { uid } = req.query;

      if (!uid) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userGames = await db.query.games.findMany({
        where: eq(games.creatorId, String(uid)),
        with: {
          activity: true,
          players: true,
        },
        orderBy: [desc(games.date)],
      });

      const gamesWithWeather = await Promise.all(
        userGames.map(async game => ({
          ...game,
          isRecurring: game.isRecurring === true || game.isRecurring === 't',
          isPrivate: game.isPrivate === true || game.isPrivate === 't',
          weather: await getWeatherForecast(game.location, new Date(game.date))
        }))
      );

      res.json(gamesWithWeather);
    } catch (error) {
      console.error("Failed to fetch user's games:", error);
      res.status(500).json({ message: "Failed to fetch user's games" });
    }
  });

  // Get all public games
  app.get("/api/games", async (_req, res) => {
    try {
      const allGames = await db.query.games.findMany({
        where: eq(games.isPrivate, false),
        with: {
          activity: true,
          players: true,
        },
      });

      const gamesWithWeather = await Promise.all(
        allGames.map(async game => ({
          ...game,
          isRecurring: game.isRecurring === true || game.isRecurring === 't',
          isPrivate: game.isPrivate === true || game.isPrivate === 't',
          weather: await getWeatherForecast(game.location, new Date(game.date))
        }))
      );

      res.json(gamesWithWeather);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get single game by URL hash
  app.get("/api/games/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
        with: {
          activity: true,
          players: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameWithWeather = {
        ...game,
        isRecurring: game.isRecurring === true || game.isRecurring === 't',
        isPrivate: game.isPrivate === true || game.isPrivate === 't',
        weather: await getWeatherForecast(game.location, new Date(game.date))
      };

      res.json(gameWithWeather);
    } catch (error) {
      console.error("Failed to fetch game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Create new game
  app.post("/api/games", async (req, res) => {
    try {
      const { activityId, title, location, date, timezone, playerThreshold, creatorId, creatorName, endTime, notes, webLink, isRecurring, recurrenceFrequency, isPrivate } = req.body;

      if (!activityId || !location || !date || !playerThreshold || !creatorId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Generate a unique URL hash
      const urlHash = await generateUniqueUrlHash();

      const [newGame] = await db.insert(games).values({
        urlHash,
        activityId: Number(activityId),
        title: String(title || ''),
        location: String(location),
        date: toUTC(date, timezone || 'UTC'),
        timezone: timezone || 'UTC',
        playerThreshold: Number(playerThreshold),
        creatorId: String(creatorId),
        creatorName: String(creatorName || ''),
        endTime: endTime ? toUTC(endTime, timezone || 'UTC') : null,
        notes: notes || null,
        webLink: webLink || null,
        isRecurring: isRecurring === true,
        recurrenceFrequency: isRecurring === true ? recurrenceFrequency : null,
        isPrivate: isPrivate === true,
      }).returning();

      const gameWithWeather = await getGameWithWeather(newGame);
      res.json(gameWithWeather);
    } catch (error) {
      console.error("Failed to create game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Update game
  app.put("/api/games/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const { title, location, date, timezone, playerThreshold, creatorId, endTime, notes, webLink, isRecurring, recurrenceFrequency, isPrivate } = req.body;

      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.creatorId !== creatorId) {
        return res.status(403).json({ message: "Only the creator can edit this game" });
      }

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
          isRecurring: isRecurring === true,
          recurrenceFrequency: isRecurring === true ? recurrenceFrequency : null,
          isPrivate: isPrivate === true
        })
        .where(eq(games.urlHash, hash))
        .returning();

      const gameWithWeather = await getGameWithWeather(updatedGame);
      res.json(gameWithWeather);
    } catch (error) {
      console.error("Failed to update game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  // Delete game
  app.delete("/api/games/:hash", async (req, res) => {
    try {
      const { hash } = req.params;

      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Delete players first due to foreign key constraint
      await db.delete(players).where(eq(players.gameId, game.id));
      await db.delete(games).where(eq(games.urlHash, hash));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Join game
  app.post("/api/games/:hash/join", async (req, res) => {
    try {
      const { hash } = req.params;
      const { name, email, likelihood, uid } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
        with: {
          players: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Generate a simple random string for response token
      const responseToken = uid || generateRandomString();

      if (email) {
        const existingPlayer = game.players.find(p => p.email === email);
        if (existingPlayer) {
          return res.status(400).json({ message: "You have already joined this game" });
        }
      }

      const [newPlayer] = await db.insert(players).values({
        gameId: game.id,
        name: name.trim(),
        email: email?.trim(),
        likelihood: likelihood || 1,
        responseToken,
      }).returning();

      const expectedPlayers = game.players.reduce((sum, player) => {
        return sum + (Number(player.likelihood) || 1);
      }, likelihood || 1);

      if (expectedPlayers >= game.playerThreshold) {
        sendGameOnNotification(game.id).catch(console.error);
      }

      res.json({ ...newPlayer, responseToken });
    } catch (error) {
      console.error("Failed to join game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  return httpServer;
}

  // Delete player response
  app.delete("/api/games/:hash/players/:playerId", async (req, res) => {
    try {
      const { hash, playerId } = req.params;

      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      await db.delete(players).where(eq(players.id, parseInt(playerId)));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

