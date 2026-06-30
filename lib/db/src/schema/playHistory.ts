import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playHistoryTable = pgTable("play_history", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  uri: text("uri").notNull(),
  duration: integer("duration").notNull().default(0),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const insertPlayHistorySchema = createInsertSchema(
  playHistoryTable
).omit({ id: true, playedAt: true });

export type InsertPlayHistory = z.infer<typeof insertPlayHistorySchema>;
export type PlayHistory = typeof playHistoryTable.$inferSelect;
