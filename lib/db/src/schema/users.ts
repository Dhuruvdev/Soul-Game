import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpToNext: integer("xp_to_next").notNull().default(100),
  mood: text("mood"),
  tags: text("tags").array().notNull().default([]),
  title: text("title"),
  delulu: integer("delulu").notNull().default(0),
  redFlag: integer("red_flag").notNull().default(0),
  chronicallyOnline: integer("chronically_online").notNull().default(0),
  replySpeed: text("reply_speed"),
  mainCharacterEnergy: integer("main_character_energy").notNull().default(50),
  totalHearts: integer("total_hearts").notNull().default(0),
  currentRoom: text("current_room"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
