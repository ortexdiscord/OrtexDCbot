import { Events, type Client, type ButtonInteraction } from "discord.js";
import { lavalink } from "../lavalink.js";
import { errorEmbed, nowPlayingEmbed, musicPanelButtons } from "../utils/embeds.js";
import type { Track } from "lavalink-client";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[Command] Error in /${interaction.commandName}:`, err);
        const reply = {
          embeds: [errorEmbed("Something went wrong. Please try again.")],
          ephemeral: true,
        };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(reply).catch(() => null);
        } else {
          await interaction.reply(reply).catch(() => null);
        }
      }
      return;
    }

    // ── Button interactions (music panel) ──────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (!id.startsWith("music_")) return;

      const player = lavalink.getPlayer(interaction.guildId!);
      if (!player) {
        await interaction.reply({
          embeds: [errorEmbed("No active player in this server.")],
          ephemeral: true,
        });
        return;
      }

      await handleMusicButton(interaction, id, player);
    }
  });
}

async function handleMusicButton(
  interaction: ButtonInteraction,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  player: any
): Promise<void> {
  try {
    switch (id) {
      case "music_pause":
        if (!player.paused) await player.pause();
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: "⏸️  Paused." }],
          ephemeral: true,
        });
        break;

      case "music_resume":
        if (player.paused) await player.resume();
        await interaction.reply({
          embeds: [{ color: 0x57f287, description: "▶️  Resumed." }],
          ephemeral: true,
        });
        break;

      case "music_skip":
        await player.skip();
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: "⏭️  Skipped." }],
          ephemeral: true,
        });
        break;

      case "music_stop":
        await player.destroy();
        await interaction.reply({
          embeds: [{ color: 0xed4245, description: "⏹️  Stopped and disconnected." }],
          ephemeral: true,
        });
        break;

      case "music_loop": {
        const modes = ["off", "track", "queue"] as const;
        const idx = modes.indexOf(player.repeatMode as (typeof modes)[number]);
        const next = modes[(idx + 1) % modes.length]!;
        player.setRepeatMode(next);
        const icons = { off: "➡️ Off", track: "🔂 Track", queue: "🔁 Queue" };
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: `Loop set to **${icons[next]}**.` }],
          ephemeral: true,
        });
        break;
      }

      case "music_previous": {
        const prev = (player.queue.previous as Track[] | undefined)?.at(-1);
        if (!prev) {
          await interaction.reply({
            embeds: [errorEmbed("No previous track available.")],
            ephemeral: true,
          });
          return;
        }
        await player.queue.add(prev, 0);
        await player.skip();
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: "⏮️  Playing previous track." }],
          ephemeral: true,
        });
        break;
      }

      default:
        await interaction.reply({
          embeds: [errorEmbed("Unknown button.")],
          ephemeral: true,
        });
    }

    // Update the original now-playing embed/buttons after action
    if (id !== "music_stop" && player.queue.current) {
      const panelMsgId = player["panelMessageId"] as string | undefined;
      const panelChanId = player["panelChannelId"] as string | undefined;
      if (panelMsgId && panelChanId) {
        try {
          const ch = interaction.client.channels.cache.get(panelChanId);
          if (ch?.isTextBased()) {
            const msg = await ch.messages.fetch(panelMsgId);
            await msg.edit({
              embeds: [nowPlayingEmbed(player)],
              components: [musicPanelButtons(player)],
            });
          }
        } catch {
          // panel message may have been deleted — fine
        }
      }
    }
  } catch (err) {
    console.error("[Button] Error handling music button:", err);
    const safeReply = { embeds: [errorEmbed("Could not process that action.")], ephemeral: true };
    if (interaction.deferred) {
      await interaction.editReply(safeReply).catch(() => null);
    } else if (!interaction.replied) {
      await interaction.reply(safeReply).catch(() => null);
    }
  }
}
