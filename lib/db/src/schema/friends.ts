import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const friendsTable = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  friendId: integer("friend_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"), // pending | accepted | blocked
  bondXp: integer("bond_xp").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFriendSchema = createInsertSchema(friendsTable).omit({ id: true, createdAt: true });
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friendsTable.$inferSelect;
