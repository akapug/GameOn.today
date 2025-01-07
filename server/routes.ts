import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { games, players, activities } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { defaultActivities } from "../client/src/lib/activities";
import nodemailer from "nodemailer";
import { getWeatherForecast } from "./services/weather";
import { formatWithTimezone, toUTC } from "../client/src/lib/dates";

// Schema middleware to ensure correct schema is set for each request
async function setSchemaMiddleware(req: any, res: any, next: any) {
  const env = process.env.NODE_ENV || 'development';
  const schema = env === 'production' ? 'production' : 'development';

  try {
    await db.execute(sql`SET search_path TO ${sql.raw(schema)}, public`);
    next();
  } catch (error) {
    console.error(`Failed to set schema to ${schema}:`, error);
    res.status(500).json({ message: "Database configuration error" });
  }
}

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

  // Add schema middleware to all API routes
  app.use('/api', setSchemaMiddleware);

  // Init endpoint for app initialization data
  app.get("/api/init", async (_req, res) => {
    try {
      const allActivities = await db.query.activities.findMany();
      res.json({
        activities: allActivities,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to fetch init data:", error);
      res.status(500).json({ message: "Failed to fetch initialization data" });
    }
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

      // Verify activity exists first
      const activity = await db.query.activities.findFirst({
        where: eq(activities.id, Number(activityId))
      });

      if (!activity) {
        return res.status(400).json({
          message: `Activity with ID ${activityId} does not exist`,
          details: { field: 'activityId' }
        });
      }

      const missingFields = [];
      if (!activityId) missingFields.push('activityId');
      if (!location) missingFields.push('location');
      if (!date) missingFields.push('date');
      if (!playerThreshold) missingFields.push('playerThreshold');
      if (!creatorId) missingFields.push('creatorId');

      if (missingFields.length > 0) {
        console.error('Missing fields in request:', missingFields);
        console.error('Request body:', req.body);
        return res.status(400).json({
          message: "Missing required fields",
          fields: missingFields
        });
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
      const errorMessage = error instanceof Error ? error.message : "Failed to create game";
      res.status(500).json({ message: errorMessage, details: error });
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
      const { name, email, likelihood, uid, comment } = req.body;

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
      const responseToken = uid || generateGameHash();

      // Check for existing player by email or response token
      const existingPlayer = game.players.find(p =>
        (email && p.email === email) ||
        (uid && p.responseToken === uid)
      );

      if (existingPlayer) {
        return res.status(400).json({ message: "You have already joined this game" });
      }

      const [newPlayer] = await db.insert(players).values({
        gameId: game.id,
        name: name.trim(),
        email: email?.trim(),
        likelihood: likelihood || 1,
        responseToken,
        comment: comment?.trim(),
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

  // Update player response
  app.put("/api/games/:hash/players/:playerId", async (req, res) => {
    try {
      const { hash, playerId } = req.params;
      const { name, email, likelihood, responseToken, comment } = req.body;

      const game = await db.query.games.findFirst({
        where: eq(games.urlHash, hash),
        with: {
          players: {
            where: eq(players.id, parseInt(playerId))
          }
        }
      });

      if (!game || !game.players.length) {
        return res.status(404).json({ message: "Player not found" });
      }

      const player = game.players[0];
      if (player.responseToken !== responseToken) {
        return res.status(403).json({ message: "Not authorized to edit response" });
      }

      const [updatedPlayer] = await db
        .update(players)
        .set({
          name,
          email,
          likelihood,
          comment
        })
        .where(eq(players.id, parseInt(playerId)))
        .returning();

      res.json(updatedPlayer);
    } catch (error) {
      console.error("Failed to update player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

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

  return httpServer;
}