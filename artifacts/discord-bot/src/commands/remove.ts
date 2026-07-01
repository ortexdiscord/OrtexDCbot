import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { truncate } from "../utils/formatters.js";

const remove: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a track from the queue by position")
    .addIntegerOption((opt) =>
      opt
        .setName("position")
        .setDescription("Queue position to remove (1 = next track)")
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player || player.queue.tracks.length === 0) {
      await interaction.reply({
        embeds: [errorEmbed("The queue is empty.")],
        ephemeral: true,
      });
      return;
    }

    const pos = interaction.options.getInteger("position", true);
    const index = pos - 1; // queue.tracks is 0-indexed

    if (index >= player.queue.tracks.length) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            `Position **${pos}** is out of range. Queue has **${player.queue.tracks.length}** track(s).`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const removed = player.queue.tracks[index]!;
    player.queue.remove(index);

    await interaction.reply({
      embeds: [
        successEmbed(
          `Removed **${truncate(removed.info.title, 80)}** from position #${pos}.`
        ),
      ],
      ephemeral: true,
    });
  },
};

export default remove;
