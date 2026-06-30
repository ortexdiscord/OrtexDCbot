import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ColorResolvable,
} from "discord.js";
import type { Player, Track } from "lavalink-client";
import { formatDuration, progressBar, truncate } from "./formatters.js";

const MUSIC_COLOR: ColorResolvable = 0x5865f2;
const ERROR_COLOR: ColorResolvable = 0xed4245;
const SUCCESS_COLOR: ColorResolvable = 0x57f287;
const WARN_COLOR: ColorResolvable = 0xfee75c;

export function nowPlayingEmbed(player: Player): EmbedBuilder {
  const track = player.queue.current as Track | null;
  if (!track) return errorEmbed("No track is currently playing.");

  const info = track.info;
  const pos = player.position ?? 0;
  const dur = info.duration ?? 0;
  const isStream = info.isStream;

  const bar = isStream
    ? "🔴 LIVE"
    : `${formatDuration(pos)} ${progressBar(pos, dur)} ${formatDuration(dur)}`;

  const loopIcon =
    player.repeatMode === "track"
      ? "🔂"
      : player.repeatMode === "queue"
        ? "🔁"
        : "➡️";

  const embed = new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setAuthor({ name: "♫ Now Playing" })
    .setTitle(truncate(info.title, 256))
    .setURL(info.uri ?? null)
    .setDescription(`**by ${truncate(info.author, 100)}**\n\n${bar}`)
    .addFields(
      {
        name: "⏱ Duration",
        value: isStream ? "Live Stream" : formatDuration(dur),
        inline: true,
      },
      { name: "🔊 Volume", value: `${player.volume}%`, inline: true },
      { name: "Loop", value: loopIcon, inline: true },
      {
        name: "📋 Queue",
        value: `${player.queue.tracks.length} track(s) up next`,
        inline: true,
      },
    )
    .setFooter({
      text: `Requested by ${(track.requester as { username?: string })?.username ?? "Unknown"}`,
    })
    .setTimestamp();

  if (info.artworkUrl) {
    embed.setThumbnail(info.artworkUrl);
  }

  return embed;
}

export function musicPanelButtons(player: Player): ActionRowBuilder<ButtonBuilder> {
  const paused = player.paused;
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_previous")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Prev"),
    new ButtonBuilder()
      .setCustomId(paused ? "music_resume" : "music_pause")
      .setEmoji(paused ? "▶️" : "⏸️")
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Primary)
      .setLabel(paused ? "Resume" : "Pause"),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Skip"),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Stop"),
    new ButtonBuilder()
      .setCustomId("music_loop")
      .setEmoji("🔁")
      .setStyle(
        player.repeatMode !== "off" ? ButtonStyle.Success : ButtonStyle.Secondary
      )
      .setLabel("Loop"),
  );
}

export function queueEmbed(player: Player, page = 1): EmbedBuilder {
  const perPage = 10;
  const tracks = player.queue.tracks;
  const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;
  const slice = tracks.slice(start, start + perPage);

  const current = player.queue.current as Track | null;

  const embed = new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setTitle("🎶 Queue")
    .setFooter({ text: `Page ${safePage}/${totalPages} • ${tracks.length} tracks total` });

  if (current) {
    embed.addFields({
      name: "▶ Now Playing",
      value: `[${truncate(current.info.title, 80)}](${current.info.uri}) — ${formatDuration(current.info.duration ?? 0)}`,
    });
  }

  if (slice.length > 0) {
    embed.addFields({
      name: "Up Next",
      value: slice
        .map(
          (t, i) =>
            `\`${start + i + 1}.\` [${truncate(t.info.title, 60)}](${t.info.uri}) — ${formatDuration(t.info.duration ?? 0)}`,
        )
        .join("\n"),
    });
  } else {
    embed.setDescription("*The queue is empty. Use `/play` to add songs!*");
  }

  return embed;
}

export function successEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setDescription(`✅  ${message}`);
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setDescription(`❌  ${message}`);
}

export function warnEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(WARN_COLOR)
    .setDescription(`⚠️  ${message}`);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setTitle(title)
    .setDescription(description);
}
