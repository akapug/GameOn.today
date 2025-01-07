import { pgTable, text, serial, timestamp, integer, decimal, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const eventTypes = pgTable("event_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
}, (table) => {
  return {
    nameIdx: unique("event_types_name_idx").on(table.name),
  };
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  urlHash: text("url_hash").notNull().unique(),
  isPrivate: boolean("is_private").notNull().default(false),
  eventTypeId: integer("event_type_id").references(() => eventTypes.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  date: timestamp("date", { mode: 'string', withTimezone: true }).notNull(),
  participantThreshold: integer("participant_threshold").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  creatorId: text("creator_id").notNull(),
  creatorName: text("creator_name").notNull(),
  timezone: text("timezone").notNull(),
  endTime: timestamp("end_time", { mode: 'string', withTimezone: true }),
  notes: text("notes"),
  webLink: text("web_link"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  parentEventId: integer("parent_event_id").references(() => events.id),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  likelihood: decimal("likelihood").notNull().default('1'),
  responseToken: text("response_token").notNull(),
  comment: text("comment"),
});

// Define relationships
export const eventsRelations = relations(events, ({ one, many }) => ({
  eventType: one(eventTypes, {
    fields: [events.eventTypeId],
    references: [eventTypes.id],
  }),
  participants: many(participants),
  parentEvent: one(events, {
    fields: [events.parentEventId],
    references: [events.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  event: one(events, {
    fields: [participants.eventId],
    references: [events.id],
  }),
}));

// Zod schemas for validation
export const eventTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});

export const eventSchema = z.object({
  id: z.number(),
  urlHash: z.string(),
  isPrivate: z.boolean(),
  eventTypeId: z.number(),
  title: z.string(),
  location: z.string(),
  date: z.string(),
  participantThreshold: z.number(),
  createdAt: z.string(),
  creatorId: z.string(),
  creatorName: z.string(),
  timezone: z.string(),
  endTime: z.string().nullable(),
  notes: z.string().nullable(),
  webLink: z.string().nullable(),
  isRecurring: z.boolean(),
  recurrenceFrequency: z.string().nullable(),
  parentEventId: z.number().nullable(),
});

export const participantSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  joinedAt: z.string(),
  likelihood: z.number(),
  responseToken: z.string(),
  comment: z.string().nullable(),
});

// Create insert and select schemas
export const insertEventTypeSchema = createInsertSchema(eventTypes);
export const selectEventTypeSchema = createSelectSchema(eventTypes);

export const insertEventSchema = createInsertSchema(events, {
  isRecurring: z.boolean(),
  isPrivate: z.boolean(),
});
export const selectEventSchema = createSelectSchema(events, {
  isRecurring: z.boolean(),
  isPrivate: z.boolean(),
});

export const insertParticipantSchema = createInsertSchema(participants);
export const selectParticipantSchema = createSelectSchema(participants);

// Type exports
export type EventType = typeof eventTypes.$inferSelect;
export type NewEventType = typeof eventTypes.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;