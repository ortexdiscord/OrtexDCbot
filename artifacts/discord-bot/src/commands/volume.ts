import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const volume: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set or check the playback volume")
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("Volume level (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        ephemeral: true,
      });
      return;
    }

    const level = interaction.options.getInteger("level");
    if (level === null) {
      await interaction.reply({
        embeds: [successEmbed(`Current volume is **${player.volume}%**.`)],
        ephemeral: true,
      });
      return;
    }

    await player.setVolume(level);

    // Persist as default for this guild
    try {
      await db
        .insert(guildSettingsTable)
        .values({ guildId: interaction.guildId!, defaultVolume: level })
        .onConflictDoUpdate({
          target: guildSettingsTable.guildId,
          set: { defaultVolume: level, updatedAt: new Date() },
        });
    } catch {
      // non-critical
    }

    await interaction.reply({
      embeds: [successEmbed(`Volume set to **${level}%**.`)],
      ephemeral: true,
    });
  },
};

export default volume;
