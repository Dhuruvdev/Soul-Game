import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bondsTable = pgTable("bonds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  partnerId: integer("partner_id").notNull().references(() => usersTable.id),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  title: text("title"),
  lastInteraction: timestamp("last_interaction", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBondSchema = createInsertSchema(bondsTable).omit({ id: true, createdAt: true });
export type InsertBond = z.infer<typeof insertBondSchema>;
export type Bond = typeof bondsTable.$inferSelect;
