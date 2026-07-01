import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";

const stop: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop music and disconnect from the voice channel"),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        embeds: [errorEmbed("I'm not in a voice channel.")],
        ephemeral: true,
      });
      return;
    }

    await player.destroy();
    await interaction.reply({
      embeds: [successEmbed("Stopped the music and left the voice channel.")],
      ephemeral: true,
    });
  },
};

export default stop;
