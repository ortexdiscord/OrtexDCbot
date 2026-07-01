import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, queueEmbed } from "../utils/embeds.js";

const queue: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("View the current music queue")
    .addIntegerOption((opt) =>
      opt
        .setName("page")
        .setDescription("Page number")
        .setMinValue(1)
    ),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await interaction.reply({
        embeds: [errorEmbed("The queue is empty. Use `/play` to add songs!")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const page = interaction.options.getInteger("page") ?? 1;
    await interaction.reply({
      embeds: [queueEmbed(player, page)],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default queue;
