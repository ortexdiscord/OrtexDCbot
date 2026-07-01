import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed, warnEmbed } from "../utils/embeds.js";

const pause: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the current track"),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player?.playing) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (player.paused) {
      await interaction.reply({
        embeds: [warnEmbed("Already paused. Use `/resume` to continue.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await player.pause();
    await interaction.reply({
      embeds: [successEmbed("Paused the track.")],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default pause;
