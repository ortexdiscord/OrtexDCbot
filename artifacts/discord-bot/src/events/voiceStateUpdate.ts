import { Events, type Client, type VoiceState } from "discord.js";
import { lavalink } from "../lavalink.js";
import { successEmbed } from "../utils/embeds.js";

const LEAVE_DELAY_MS = 60_000; // 1 minute
const leaveTimers = new Map<string, NodeJS.Timeout>();

export function registerVoiceStateUpdateEvent(client: Client): void {
  client.on(Events.VoiceStateUpdate, async (_oldState: VoiceState, newState: VoiceState) => {
    const guildId = newState.guild.id;
    if (!guildId) return;

    const player = lavalink.getPlayer(guildId);
    if (!player) return;

    const botChannelId = player.voiceChannelId;
    if (!botChannelId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(botChannelId);
    if (!channel?.isVoiceBased()) return;

    // Count non-bot members in the bot's voice channel
    const humans = channel.members.filter((m) => !m.user.bot).size;

    if (humans === 0) {
      if (leaveTimers.has(guildId)) return;

      const timer = setTimeout(async () => {
        leaveTimers.delete(guildId);

        const textChannelId = player.textChannelId ?? "";
        const textChannel = client.channels.cache.get(textChannelId);
        if (textChannel?.isTextBased() && "send" in textChannel) {
          try {
            const msg = await (textChannel as { send: Function }).send({
              embeds: [successEmbed("Left the voice channel because it was empty for 1 minute.")],
            });
            // Keep the chat clean: delete this status message after 60 seconds
            setTimeout(() => msg.delete().catch(() => null), 60_000);
          } catch {
            // ignore
          }
        }

        try {
          await player.destroy();
        } catch {
          // ignore
        }
      }, LEAVE_DELAY_MS);

      leaveTimers.set(guildId, timer);
    } else {
      const timer = leaveTimers.get(guildId);
      if (timer) {
        clearTimeout(timer);
        leaveTimers.delete(guildId);
      }
    }
  });
}
