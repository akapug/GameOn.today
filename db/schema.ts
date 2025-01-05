import { pgTable, text, serial, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  sportId: integer("sport_id").references(() => sports.id),
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
  sport: one(sports, {
    fields: [games.sportId],
    references: [sports.id],
  }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
}));

export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);
export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertSportSchema = createInsertSchema(sports);
export const selectSportSchema = createSelectSchema(sports);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Sport = typeof sports.$inferSelect;