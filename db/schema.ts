import { pgTable, text, serial, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  date: timestamp("date", { mode: 'string', withTimezone: true }).notNull(),
  playerThreshold: integer("player_threshold").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  creatorId: text("creator_id").notNull(),
  creatorName: text("creator_name").notNull(),
  timezone: text("timezone").notNull(),
  endTime: timestamp("end_time", { mode: 'string', withTimezone: true }),
  notes: text("notes"),
  webLink: text("web_link"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  parentGameId: integer("parent_game_id").references(() => games.id),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  likelihood: decimal("likelihood").notNull().default('1'),
  responseToken: text("response_token").notNull(),
});

export const gamesRelations = relations(games, ({ one, many }) => ({
  activity: one(activities, {
    fields: [games.activityId],
    references: [activities.id],
  }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
}));

// Add strict boolean handling to game schema
export const gameSchema = z.object({
  id: z.number(),
  sportId: z.number(),
  title: z.string(),
  location: z.string(),
  date: z.string(),
  playerThreshold: z.number(),
  createdAt: z.string(),
  creatorId: z.string(),
  creatorName: z.string(),
  timezone: z.string(),
  endTime: z.string().nullable(),
  notes: z.string().nullable(),
  webLink: z.string().nullable(),
  isRecurring: z.boolean(),
  recurrenceFrequency: z.string().nullable(),
  parentGameId: z.number().nullable(),
});

export const insertGameSchema = createInsertSchema(games, {
  isRecurring: z.boolean(),
});
export const selectGameSchema = createSelectSchema(games, {
  isRecurring: z.boolean(),
});

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Activity = typeof activities.$inferSelect;