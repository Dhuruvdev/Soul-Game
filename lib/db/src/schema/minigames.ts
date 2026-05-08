import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const minigamesTable = pgTable("minigames", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  type: text("type").notNull(), // typing_chemistry | delulu_detector | emoji_panic | memory_lane | secret_voting
  playerCount: integer("player_count").notNull().default(2),
  duration: integer("duration").notNull().default(60),
  xpReward: integer("xp_reward").notNull().default(50),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  minigameId: integer("minigame_id").notNull().references(() => minigamesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  opponentId: integer("opponent_id").references(() => usersTable.id),
  score: integer("score"),
  won: boolean("won"),
  xpEarned: integer("xp_earned"),
  status: text("status").notNull().default("pending"), // pending | active | completed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMinigameSchema = createInsertSchema(minigamesTable).omit({ id: true });
export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({ id: true, createdAt: true });
export type InsertMinigame = z.infer<typeof insertMinigameSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Minigame = typeof minigamesTable.$inferSelect;
export type GameSession = typeof gameSessionsTable.$inferSelect;
