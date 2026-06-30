import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playlistsTable = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playlistTracksTable = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id")
    .notNull()
    .references(() => playlistsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  uri: text("uri").notNull(),
  artworkUrl: text("artwork_url"),
  duration: integer("duration").notNull().default(0),
  position: integer("position").notNull().default(0),
});

export const insertPlaylistSchema = createInsertSchema(playlistsTable).omit({
  id: true,
  createdAt: true,
});
export const insertPlaylistTrackSchema = createInsertSchema(
  playlistTracksTable
).omit({ id: true });

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlistsTable.$inferSelect;
export type PlaylistTrack = typeof playlistTracksTable.$inferSelect;
