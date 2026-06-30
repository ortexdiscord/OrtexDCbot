import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { parseTimestamp, formatDuration } from "../utils/formatters.js";

const seek: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Seek to a position in the current track")
    .addStringOption((opt) =>
      opt
        .setName("position")
        .setDescription("Timestamp to seek to (e.g. 1:30 or 0:45)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        ephemeral: true,
      });
      return;
    }

    if (player.queue.current.info.isStream) {
      await interaction.reply({
        embeds: [errorEmbed("Cannot seek in a live stream.")],
        ephemeral: true,
      });
      return;
    }

    const raw = interaction.options.getString("position", true);
    const ms = parseTimestamp(raw);

    if (ms === null) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid timestamp. Use format `mm:ss` or `hh:mm:ss`.")],
        ephemeral: true,
      });
      return;
    }

    const duration = player.queue.current.info.duration ?? 0;
    if (ms > duration) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            `Timestamp exceeds track duration (${formatDuration(duration)}).`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await player.seek(ms);
    await interaction.reply({
      embeds: [successEmbed(`Seeked to **${formatDuration(ms)}**.`)],
    });
  },
};

export default seek;
