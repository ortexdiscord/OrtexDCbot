import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";

const skip: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Number of tracks to skip (default: 1)")
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player?.playing) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const amount = interaction.options.getInteger("amount") ?? 1;

    if (amount > 1) {
      // Remove extra tracks then skip
      const toRemove = Math.min(amount - 1, player.queue.tracks.length);
      for (let i = 0; i < toRemove; i++) {
        player.queue.remove(0);
      }
    }

    await player.skip();
    await interaction.reply({
      embeds: [
        successEmbed(
          amount > 1
            ? `Skipped **${amount}** track(s).`
            : "Skipped to the next track."
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default skip;
