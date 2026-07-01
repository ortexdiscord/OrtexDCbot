import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";

const shuffle: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the upcoming queue"),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player || player.queue.tracks.length < 2) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            "Need at least 2 tracks in the queue to shuffle. Use `/play` to add more!"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    player.queue.shuffle();
    await interaction.reply({
      embeds: [
        successEmbed(
          `🔀 Shuffled **${player.queue.tracks.length}** upcoming tracks.`
        ),
      ],
      ephemeral: true,
    });
  },
};

export default shuffle;
