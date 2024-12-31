import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
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
  date: timestamp("date").notNull(),
  playerThreshold: integer("player_threshold").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deleteToken: text("delete_token").notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  joinedAt: timestamp("joined_at").defaultNow(),
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