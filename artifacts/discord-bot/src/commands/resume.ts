import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed, warnEmbed } from "../utils/embeds.js";

const resume: Command = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume the paused track"),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!player.paused) {
      await interaction.reply({
        embeds: [warnEmbed("The track is not paused.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await player.resume();
    await interaction.reply({
      embeds: [successEmbed("Resumed playback.")],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default resume;
