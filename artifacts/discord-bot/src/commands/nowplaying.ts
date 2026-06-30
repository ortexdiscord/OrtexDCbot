import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, nowPlayingEmbed, musicPanelButtons } from "../utils/embeds.js";

const nowplaying: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing track with controls"),

  async execute(interaction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await interaction.reply({
        embeds: [errorEmbed("Nothing is playing right now.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [nowPlayingEmbed(player)],
      components: [musicPanelButtons(player)],
    });
  },
};

export default nowplaying;
