import { Events, MessageFlags, type Client, type ButtonInteraction } from "discord.js";
import { lavalink } from "../lavalink.js";
import {
  errorEmbed,
  nowPlayingEmbed,
  musicPanelButtons,
  queueEmbed,
  successEmbed,
} from "../utils/embeds.js";
import type { Track } from "lavalink-client";
import { withTimeout } from "../utils/timeout.js";
import { requireLavalink } from "../utils/health.js";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    // ── Autocomplete ─────────────────────────────────────────────────────────
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`[Autocomplete] Error in /${interaction.commandName}:`, err);
          await interaction.respond([]).catch(() => null);
        }
      }
      return;
    }

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (!(await requireLavalink(interaction))) return;

      try {
        await withTimeout(
          command.execute(interaction),
          "Command timed out after 4 seconds. Please try again."
        );
      } catch (err) {
        console.error(`[Command] Error in /${interaction.commandName}:`, err);
        const isTimeout =
          err instanceof Error && err.message.includes("timed out");
        const embed = errorEmbed(
          isTimeout
            ? "Command timed out after 4 seconds. The bot may be under heavy load — try again."
            : "Something went wrong. Please try again."
        );
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [embed] }).catch(() => null);
        } else {
          await interaction
            .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            .catch(() => null);
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
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!(await requireLavalink(interaction))) return;

      try {
        await withTimeout(
          handleMusicButton(interaction, id, player),
          "Button action timed out after 4 seconds. Please try again."
        );
      } catch (err) {
        console.error("[Button] Error handling music button:", err);
        const isTimeout =
          err instanceof Error && err.message.includes("timed out");
        const embed = errorEmbed(
          isTimeout
            ? "Button action timed out after 4 seconds. Please try again."
            : "Could not process that action."
        );
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [embed] }).catch(() => null);
        } else if (!interaction.replied) {
          await interaction
            .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            .catch(() => null);
        }
      }
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
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "music_resume":
        if (player.paused) await player.resume();
        await interaction.reply({
          embeds: [{ color: 0x57f287, description: "▶️  Resumed." }],
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "music_skip":
        await player.skip();
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: "⏭️  Skipped." }],
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "music_stop":
        await player.destroy();
        await interaction.reply({
          embeds: [{ color: 0xed4245, description: "⏹️  Stopped and disconnected." }],
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "music_shuffle": {
        if (player.queue.tracks.length < 2) {
          await interaction.reply({
            embeds: [errorEmbed("Need at least 2 upcoming tracks to shuffle.")],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        player.queue.shuffle();
        await interaction.reply({
          embeds: [{ color: 0x57f287, description: "🔀  Shuffled the queue." }],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "music_12o": {
        const current = player.twelveO as boolean | undefined;
        const next = !current;
        player.twelveO = next;
        if (next) {
          // Capture a stable snapshot of the current playlist for looping
          const currentTrack = player.queue.current as Track | null;
          const previous = (player.queue.previous as Track[] | undefined) ?? [];
          const upcoming = (player.queue.tracks as Track[] | undefined) ?? [];
          player.twelveOSnapshot = [
            ...previous,
            ...(currentTrack ? [currentTrack] : []),
            ...upcoming,
          ];
        } else {
          player.twelveOSnapshot = undefined;
        }
        await interaction.reply({
          embeds: [
            {
              color: next ? 0x57f287 : 0x5865f2,
              description: next
                ? "🔁  **12o** enabled — playlist will loop continuously."
                : "➡️  **12o** disabled — playlist will stop when finished.",
            },
          ],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "music_queue": {
        await interaction.reply({
          embeds: [queueEmbed(player, 1)],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "music_loop": {
        const modes = ["off", "track", "queue"] as const;
        const idx = modes.indexOf(player.repeatMode as (typeof modes)[number]);
        const next = modes[(idx + 1) % modes.length]!;
        player.setRepeatMode(next);
        const icons = { off: "➡️ Off", track: "🔂 Track", queue: "🔁 Queue" };
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: `Loop set to **${icons[next]}**.` }],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "music_previous": {
        const prev = (player.queue.previous as Track[] | undefined)?.at(-1);
        if (!prev) {
          await interaction.reply({
            embeds: [errorEmbed("No previous track available.")],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        await player.queue.add(prev, 0);
        await player.skip();
        await interaction.reply({
          embeds: [{ color: 0x5865f2, description: "⏮️  Playing previous track." }],
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      default:
        await interaction.reply({
          embeds: [errorEmbed("Unknown button.")],
          flags: MessageFlags.Ephemeral,
        });
    }

    // Update the original now-playing embed/buttons after action
    if (id !== "music_stop" && id !== "music_queue" && player.queue.current) {
      const panelMsgId = player["panelMessageId"] as string | undefined;
      const panelChanId = player["panelChannelId"] as string | undefined;
      if (panelMsgId && panelChanId) {
        try {
          const ch = interaction.client.channels.cache.get(panelChanId);
          if (ch?.isTextBased()) {
            const msg = await ch.messages.fetch(panelMsgId);
            await msg.edit({
              embeds: [nowPlayingEmbed(player)],
              components: musicPanelButtons(player),
            });
          }
        } catch {
          // panel message may have been deleted — fine
        }
      }
    }
  } catch (err) {
    console.error("[Button] Error handling music button:", err);
    const embed = errorEmbed("Could not process that action.");
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] }).catch(() => null);
    } else if (!interaction.replied) {
      await interaction
        .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        .catch(() => null);
    }
  }
}
