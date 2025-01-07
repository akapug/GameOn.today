import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { events, participants, eventTypes } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import nodemailer from "nodemailer";
import { getWeatherForecast } from "./services/weather";
import { formatWithTimezone, toUTC } from "../client/src/lib/dates";

// Schema middleware to ensure correct schema is set for each request
async function setSchemaMiddleware(req: any, res: any, next: any) {
  const env = process.env.NODE_ENV || 'development';
  const schema = env === 'production' ? 'production' : 'development';

  try {
    // Add timeout to schema setting
    const schemaPromise = db.execute(sql`SET search_path TO ${sql.identifier(schema)}, public`);
    await Promise.race([
      schemaPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Schema setting timeout')), 5000))
    ]);
    console.log(`Set search path to ${schema} schema`);
    next();
  } catch (error) {
    console.error(`Failed to set schema to ${schema}:`, error);
    res.status(503).json({ message: "Database temporarily unavailable" });
  }
}

// Helper function to generate 6-char event hash
function generateEventHash() {
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
    const existing = await db.query.events.findFirst({
      where: eq(events.urlHash, hash),
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

async function sendEventNotification(eventId: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      eventType: true,
      participants: {
        columns: {
          email: true,
          name: true,
        }
      }
    },
  });

  if (!event) return;

  const participantsWithEmail = event.participants.filter(participant => participant.email);
  const formattedEventDate = formatWithTimezone(event.date, 'PPP p', event.timezone || 'UTC');

  const emailPromises = participantsWithEmail.map(participant =>
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: participant.email,
      subject: `Event On! ${event.title} has enough participants!`,
      html: `
        <h2>Great news, ${participant.name}!</h2>
        <p>The event you joined has reached its minimum participant threshold and is now confirmed to happen!</p>
        <p>Event Details:</p>
        <ul>
          <li><strong>Type:</strong> ${event.eventType.name}</li>
          <li><strong>Title:</strong> ${event.title}</li>
          <li><strong>Location:</strong> ${event.location}</li>
          <li><strong>Date:</strong> ${formattedEventDate}</li>
        </ul>
        <p>See you at the event!</p>
      `,
    })
  );

  await Promise.all(emailPromises).catch(console.error);
}

async function getEventWithWeather(event: any) {
  return {
    ...event,
    isRecurring: event.isRecurring === true || event.isRecurring === 't',
    isPrivate: event.isPrivate === true || event.isPrivate === 't',
    weather: await getWeatherForecast(event.location, new Date(event.date))
  };
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Add schema middleware to all API routes
  app.use('/api', setSchemaMiddleware);

  // Init endpoint for app initialization data
  app.get("/api/init", async (_req, res) => {
    try {
      const schema = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      await db.execute(sql`SET search_path TO ${sql.identifier(schema)}, public`);

      // Verify schema exists and is ready
      const schemaCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = ${schema}
          AND table_name = 'event_types'
        );
      `);

      if (!schemaCheck.rows[0].exists) {
        throw new Error('Schema not ready');
      }
      const allEventTypes = await db.query.eventTypes.findMany();
      res.json({
        eventTypes: allEventTypes,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to fetch init data:", error);
      res.status(500).json({ message: "Failed to fetch initialization data" });
    }
  });

  // Get user's events (both private and public)
  app.get("/api/events/user", async (req, res) => {
    try {
      const { uid } = req.query;

      if (!uid) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userEvents = await db.query.events.findMany({
        where: eq(events.creatorId, String(uid)),
        with: {
          eventType: true,
          participants: true,
        },
        orderBy: [desc(events.date)],
      });

      const eventsWithWeather = await Promise.all(
        userEvents.map(getEventWithWeather)
      );

      res.json(eventsWithWeather);
    } catch (error) {
      console.error("Failed to fetch user's events:", error);
      res.status(500).json({ message: "Failed to fetch user's events" });
    }
  });

  // Get all public events
  app.get("/api/events", async (_req, res) => {
    try {
      const allEvents = await db.query.events.findMany({
        where: eq(events.isPrivate, false),
        with: {
          eventType: true,
          participants: true,
        },
      });

      const eventsWithWeather = await Promise.all(
        allEvents.map(getEventWithWeather)
      );

      res.json(eventsWithWeather);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get single event by URL hash
  app.get("/api/events/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
        with: {
          eventType: true,
          participants: true,
        },
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const eventWithWeather = await getEventWithWeather(event);
      res.json(eventWithWeather);
    } catch (error) {
      console.error("Failed to fetch event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Create new event
  app.post("/api/events", async (req, res) => {
    try {
      const { eventTypeId, title, location, date, timezone, participantThreshold, creatorId, creatorName, endTime, notes, webLink, isRecurring, recurrenceFrequency, isPrivate } = req.body;

      // Verify event type exists first
      const eventType = await db.query.eventTypes.findFirst({
        where: eq(eventTypes.id, Number(eventTypeId))
      });

      if (!eventType) {
        return res.status(400).json({
          message: `Event type with ID ${eventTypeId} does not exist`,
          details: { field: 'eventTypeId' }
        });
      }

      const missingFields = [];
      if (!eventTypeId) missingFields.push('eventTypeId');
      if (!location) missingFields.push('location');
      if (!date) missingFields.push('date');
      if (!participantThreshold) missingFields.push('participantThreshold');
      if (!creatorId) missingFields.push('creatorId');

      if (missingFields.length > 0) {
        console.error('Missing fields in request:', missingFields);
        return res.status(400).json({
          message: "Missing required fields",
          fields: missingFields
        });
      }

      // Generate a unique URL hash
      const urlHash = await generateUniqueUrlHash();

      const [newEvent] = await db.insert(events).values({
        urlHash,
        eventTypeId: Number(eventTypeId),
        title: String(title || ''),
        location: String(location),
        date: toUTC(date, timezone || 'UTC'),
        timezone: timezone || 'UTC',
        participantThreshold: Number(participantThreshold),
        creatorId: String(creatorId),
        creatorName: String(creatorName || ''),
        endTime: endTime ? toUTC(endTime, timezone || 'UTC') : null,
        notes: notes || null,
        webLink: webLink || null,
        isRecurring: isRecurring === true,
        recurrenceFrequency: isRecurring === true ? recurrenceFrequency : null,
        isPrivate: isPrivate === true,
      }).returning();

      const eventWithWeather = await getEventWithWeather(newEvent);
      res.json(eventWithWeather);
    } catch (error) {
      console.error("Failed to create event:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create event";
      res.status(500).json({ message: errorMessage, details: error });
    }
  });

  // Update event
  app.put("/api/events/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const { title, location, date, timezone, participantThreshold, creatorId, endTime, notes, webLink, isRecurring, recurrenceFrequency, isPrivate, eventTypeId } = req.body;

      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
        with: {
          eventType: true,
          participants: true
        }
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.creatorId !== creatorId) {
        return res.status(403).json({ message: "Only the creator can edit this event" });
      }

      await db
        .update(events)
        .set({
          title,
          location,
          date: toUTC(date, timezone || event.timezone || 'UTC'),
          timezone: timezone || event.timezone || 'UTC',
          participantThreshold,
          eventTypeId: eventTypeId ? Number(eventTypeId) : event.eventTypeId,
          endTime: endTime ? toUTC(endTime, timezone || event.timezone || 'UTC') : null,
          notes: notes || null,
          webLink: webLink || null,
          isRecurring: isRecurring === true,
          recurrenceFrequency: isRecurring === true ? recurrenceFrequency : null,
          isPrivate: isPrivate === true
        })
        .where(eq(events.urlHash, hash));

      const updatedEventWithRels = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
        with: {
          eventType: true,
          participants: true,
        }
      });

      const eventWithWeather = await getEventWithWeather(updatedEventWithRels);
      res.json(eventWithWeather);
    } catch (error) {
      console.error("Failed to update event:", {
        error,
        requestBody: req.body,
        hash: req.params?.hash,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error 
        ? `Failed to update event: ${error.message}`
        : "Failed to update event";
        
      res.status(500).json({ 
        message: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  });

  // Delete event
  app.delete("/api/events/:hash", async (req, res) => {
    try {
      const { hash } = req.params;

      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Delete participants first due to foreign key constraint
      await db.delete(participants).where(eq(participants.eventId, event.id));
      await db.delete(events).where(eq(events.urlHash, hash));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Join event
  app.post("/api/events/:hash/join", async (req, res) => {
    try {
      const { hash } = req.params;
      const { name, email, likelihood, uid, comment } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
        with: {
          participants: true,
        },
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Generate a simple random string for response token
      const responseToken = uid || generateEventHash();

      // Check for existing participant by email or response token
      const existingParticipant = event.participants.find(p =>
        (email && p.email === email) ||
        (uid && p.responseToken === uid)
      );

      if (existingParticipant) {
        return res.status(400).json({ message: "You have already joined this event" });
      }

      const [newParticipant] = await db.insert(participants).values({
        eventId: event.id,
        name: name.trim(),
        email: email?.trim(),
        likelihood: likelihood || 1,
        responseToken,
        comment: comment?.trim(),
      }).returning();

      const expectedParticipants = event.participants.reduce((sum, participant) => {
        return sum + (Number(participant.likelihood) || 1);
      }, likelihood || 1);

      if (expectedParticipants >= event.participantThreshold) {
        sendEventNotification(event.id).catch(console.error);
      }

      res.json({ ...newParticipant, responseToken });
    } catch (error) {
      console.error("Failed to join event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  // Update participant response
  app.put("/api/events/:hash/participants/:participantId", async (req, res) => {
    try {
      const { hash, participantId } = req.params;
      const { name, email, likelihood, responseToken, comment } = req.body;

      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
        with: {
          participants: {
            where: eq(participants.id, parseInt(participantId))
          }
        }
      });

      if (!event || !event.participants.length) {
        return res.status(404).json({ message: "Participant not found" });
      }

      const participant = event.participants[0];
      if (participant.responseToken !== responseToken) {
        return res.status(403).json({ message: "Not authorized to edit response" });
      }

      const [updatedParticipant] = await db
        .update(participants)
        .set({
          name,
          email,
          likelihood,
          comment
        })
        .where(eq(participants.id, parseInt(participantId)))
        .returning();

      res.json(updatedParticipant);
    } catch (error) {
      console.error("Failed to update participant:", error);
      res.status(500).json({ message: "Failed to update participant" });
    }
  });

  // Delete participant response
  app.delete("/api/events/:hash/participants/:participantId", async (req, res) => {
    try {
      const { hash, participantId } = req.params;

      const event = await db.query.events.findFirst({
        where: eq(events.urlHash, hash),
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      await db.delete(participants).where(eq(participants.id, parseInt(participantId)));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete participant:", error);
      res.status(500).json({ message: "Failed to delete participant" });
    }
  });

  app.get("/api/event-types", async (_req, res) => {
    try {
      const types = await db.query.eventTypes.findMany();
      res.json(types);
    } catch (error) {
      console.error("Error fetching event types:", error);
      res.status(500).json({ message: "Error fetching event types" });
    }
  });


  return httpServer;
}