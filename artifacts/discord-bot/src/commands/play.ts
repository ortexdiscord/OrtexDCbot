import { SlashCommandBuilder, GuildMember } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import {
  errorEmbed,
  successEmbed,
  infoEmbed,
} from "../utils/embeds.js";
import { formatDuration } from "../utils/formatters.js";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Track } from "lavalink-client";

const play: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist from YouTube / Spotify / SoundCloud")
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("Song name, YouTube URL, Spotify URL, or playlist URL")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member as GuildMember;
    if (!member.voice.channelId) {
      await interaction.reply({
        embeds: [errorEmbed("You need to be in a voice channel to play music.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    // Fetch default volume from guild settings
    let defaultVolume = 80;
    try {
      const settings = await db
        .select()
        .from(guildSettingsTable)
        .where(eq(guildSettingsTable.guildId, interaction.guildId!))
        .limit(1);
      if (settings[0]) defaultVolume = settings[0].defaultVolume;
    } catch {
      // use default
    }

    const player = await lavalink.createPlayer({
      guildId: interaction.guildId!,
      voiceChannelId: member.voice.channelId,
      textChannelId: interaction.channelId,
      selfDeaf: true,
      volume: defaultVolume,
    });

    if (!player.connected) await player.connect();

    const query = interaction.options.getString("query", true);

    // Detect URLs — pass raw, let Lavalink resolve source automatically.
    // For plain text queries, force ytsearch so it doesn't guess wrongly.
    const isUrl = /^https?:\/\//i.test(query);
    const searchQuery = isUrl
      ? { query }
      : { query, source: "ytsearch" as const };

    const result = await player.search(searchQuery, interaction.user);

    if (result.loadType === "error" || result.loadType === "empty") {
      await interaction.editReply({
        embeds: [errorEmbed("No results found. Try a different search term or URL.")],
      });
      return;
    }

    if (result.loadType === "playlist") {
      const tracks = result.tracks as Track[];
      await player.queue.add(tracks);
      if (!player.playing) await player.play();
      await interaction.editReply({
        embeds: [
          successEmbed(
            `Queued **${tracks.length}** tracks from playlist **${result.playlist?.name ?? "Unknown Playlist"}**`
          ),
        ],
      });
      return;
    }

    const track = result.tracks[0] as Track;
    if (!track) {
      await interaction.editReply({
        embeds: [errorEmbed("Could not resolve a playable track.")],
      });
      return;
    }

    await player.queue.add(track);

    if (!player.playing) {
      await player.play();
      await interaction.editReply({
        embeds: [
          infoEmbed(
            "Now Loading…",
            `[${track.info.title}](${track.info.uri ?? "#"}) — ${formatDuration(track.info.duration ?? 0)}`
          ),
        ],
      });
    } else {
      await interaction.editReply({
        embeds: [
          infoEmbed(
            "Added to Queue",
            `[${track.info.title}](${track.info.uri ?? "#"}) — ${formatDuration(track.info.duration ?? 0)}\nPosition: **#${player.queue.tracks.length}**`
          ),
        ],
      });
    }
  },
};

export default play;
