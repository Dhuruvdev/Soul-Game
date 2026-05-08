import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const heartsTable = pgTable("hearts", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id),
  toUserId: integer("to_user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const complimentsTable = pgTable("compliments", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id),
  toUserId: integer("to_user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  xpGained: integer("xp_gained"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHeartSchema = createInsertSchema(heartsTable).omit({ id: true, createdAt: true });
export const insertComplimentSchema = createInsertSchema(complimentsTable).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, createdAt: true });

export type InsertHeart = z.infer<typeof insertHeartSchema>;
export type InsertCompliment = z.infer<typeof insertComplimentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Heart = typeof heartsTable.$inferSelect;
export type Compliment = typeof complimentsTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
