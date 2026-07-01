import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed } from "./embeds.js";

export function isLavalinkConnected(): boolean {
  return Array.from(lavalink.nodeManager.nodes.values()).some(
    (node) => node.connected
  );
}

export async function requireLavalink(
  interaction: ChatInputCommandInteraction | ButtonInteraction
): Promise<boolean> {
  if (isLavalinkConnected()) return true;

  const message =
    "🔴 The music server (Lavalink) is not connected right now. Please try again in a moment or contact the bot owner.";
  const embed = errorEmbed(message);

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed] }).catch(() => null);
  } else {
    await interaction
      .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
      .catch(() => null);
  }
  return false;
}
