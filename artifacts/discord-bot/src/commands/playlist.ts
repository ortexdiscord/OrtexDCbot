import { SlashCommandBuilder, GuildMember } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed, infoEmbed } from "../utils/embeds.js";
import { truncate } from "../utils/formatters.js";
import { db } from "@workspace/db";
import {
  playlistsTable,
  playlistTracksTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { Track } from "lavalink-client";

const playlist: Command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Manage your saved playlists")
    .addSubcommand((sub) =>
      sub
        .setName("save")
        .setDescription("Save the current queue as a playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("load")
        .setDescription("Load a saved playlist into the queue")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List your saved playlists")
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a saved playlist")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Playlist name").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    // --- SAVE ---
    if (sub === "save") {
      const player = lavalink.getPlayer(guildId);
      if (!player?.queue.current) {
        await interaction.reply({
          embeds: [errorEmbed("Nothing is playing to save.")],
          ephemeral: true,
        });
        return;
      }

      const name = interaction.options.getString("name", true).trim();
      await interaction.deferReply({ ephemeral: true });

      const current = player.queue.current as unknown as Track;
      const upcoming = player.queue.tracks as unknown as Track[];
      const allTracks: Track[] = [current, ...upcoming];

      // Remove existing playlist with same name
      const existing = await db
        .select()
        .from(playlistsTable)
        .where(
          and(
            eq(playlistsTable.userId, userId),
            eq(playlistsTable.name, name)
          )
        )
        .limit(1);

      if (existing[0]) {
        await db
          .delete(playlistTracksTable)
          .where(eq(playlistTracksTable.playlistId, existing[0].id));
        await db
          .delete(playlistsTable)
          .where(eq(playlistsTable.id, existing[0].id));
      }

      const [pl] = await db
        .insert(playlistsTable)
        .values({ userId, guildId, name })
        .returning();

      if (!pl) throw new Error("Failed to create playlist");

      await db.insert(playlistTracksTable).values(
        allTracks.map((t, i) => ({
          playlistId: pl.id,
          title: t.info.title,
          author: t.info.author,
          uri: t.info.uri ?? "",
          artworkUrl: t.info.artworkUrl ?? null,
          duration: t.info.duration ?? 0,
          position: i,
        }))
      );

      await interaction.editReply({
        embeds: [
          successEmbed(
            `Saved **${allTracks.length}** track(s) to playlist **${name}**.`
          ),
        ],
      });
    }

    // --- LOAD ---
    else if (sub === "load") {
      const name = interaction.options.getString("name", true).trim();
      const member = interaction.guild?.members.cache.get(userId) as GuildMember | undefined;
      if (!member?.voice.channelId) {
        await interaction.reply({
          embeds: [errorEmbed("You must be in a voice channel to load a playlist.")],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const [pl] = await db
        .select()
        .from(playlistsTable)
        .where(
          and(
            eq(playlistsTable.userId, userId),
            eq(playlistsTable.name, name)
          )
        )
        .limit(1);

      if (!pl) {
        await interaction.editReply({
          embeds: [errorEmbed(`No playlist named **${name}** found.`)],
        });
        return;
      }

      const tracks = await db
        .select()
        .from(playlistTracksTable)
        .where(eq(playlistTracksTable.playlistId, pl.id))
        .orderBy(playlistTracksTable.position);

      if (tracks.length === 0) {
        await interaction.editReply({
          embeds: [errorEmbed("That playlist is empty.")],
        });
        return;
      }

      const player = await lavalink.createPlayer({
        guildId,
        voiceChannelId: member.voice.channelId,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        volume: 80,
      });

      if (!player.connected) await player.connect();

      // Search each track by URI using the player's search
      let added = 0;
      for (const t of tracks) {
        try {
          const res = await player.search(
            { query: t.uri },
            interaction.user
          );
          if (res.tracks[0]) {
            await player.queue.add(res.tracks[0] as unknown as Track);
            added++;
          }
        } catch {
          // skip unresolvable tracks
        }
      }

      if (added === 0) {
        await interaction.editReply({
          embeds: [errorEmbed("None of the tracks in that playlist could be resolved. They may have been removed from YouTube/Spotify.")],
        });
        return;
      }

      if (!player.playing) await player.play();

      await interaction.editReply({
        embeds: [
          successEmbed(
            `Loaded **${added}** track(s) from playlist **${name}** into the queue.`
          ),
        ],
      });
    }

    // --- LIST ---
    else if (sub === "list") {
      const playlists = await db
        .select()
        .from(playlistsTable)
        .where(eq(playlistsTable.userId, userId));

      if (playlists.length === 0) {
        await interaction.reply({
          embeds: [
            infoEmbed(
              "Your Playlists",
              "You have no saved playlists.\nUse `/playlist save` while music is playing to create one!"
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const lines = playlists.map((p) => `• **${truncate(p.name, 40)}**`);
      await interaction.reply({
        embeds: [
          infoEmbed(`Your Playlists (${playlists.length})`, lines.join("\n")),
        ],
        ephemeral: true,
      });
    }

    // --- DELETE ---
    else if (sub === "delete") {
      const name = interaction.options.getString("name", true).trim();

      const [pl] = await db
        .select()
        .from(playlistsTable)
        .where(
          and(
            eq(playlistsTable.userId, userId),
            eq(playlistsTable.name, name)
          )
        )
        .limit(1);

      if (!pl) {
        await interaction.reply({
          embeds: [errorEmbed(`No playlist named **${name}** found.`)],
          ephemeral: true,
        });
        return;
      }

      await db
        .delete(playlistTracksTable)
        .where(eq(playlistTracksTable.playlistId, pl.id));
      await db.delete(playlistsTable).where(eq(playlistsTable.id, pl.id));

      await interaction.reply({
        embeds: [successEmbed(`Deleted playlist **${name}**.`)],
        ephemeral: true,
      });
    }
  },
};

export default playlist;
