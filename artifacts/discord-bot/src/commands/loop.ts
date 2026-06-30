import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";

const MODES = ["off", "track", "queue"] as const;
type RepeatMode = (typeof MODES)[number];

const loop: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set the loop mode for the queue")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Loop mode (defaults to cycling)")
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track (repeat current song)", value: "track" },
          { name: "Queue (repeat whole queue)", value: "queue" }
        )
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

    let mode = interaction.options.getString("mode") as RepeatMode | null;
    if (!mode) {
      // Cycle through modes
      const idx = MODES.indexOf(player.repeatMode as RepeatMode);
      mode = MODES[(idx + 1) % MODES.length]!;
    }

    player.setRepeatMode(mode);

    const icons: Record<RepeatMode, string> = {
      off: "➡️ Off",
      track: "🔂 Track",
      queue: "🔁 Queue",
    };
    await interaction.reply({
      embeds: [successEmbed(`Loop mode set to **${icons[mode]}**.`)],
    });
  },
};

export default loop;
