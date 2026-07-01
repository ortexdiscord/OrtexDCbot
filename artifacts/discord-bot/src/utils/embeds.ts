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

function getTwelveO(player: Player): boolean {
  return (player as unknown as { twelveO?: boolean }).twelveO ?? false;
}

function getTrackColor(track: Track): ColorResolvable {
  // Try to derive a sidebar color from the track source for a music-themed vibe.
  // Discord embeds only support a single color, so we use the source brand color
  // as a stand-in for the track's gradient/dominant color.
  const source = ((track.info as { sourceName?: string }).sourceName ?? "").toLowerCase();
  if (source.includes("youtube") || source.includes("yt")) return 0xff0000;
  if (source.includes("spotify")) return 0x1db954;
  if (source.includes("soundcloud")) return 0xff5500;
  if (source.includes("apple")) return 0xfa2d48;
  if (source.includes("twitch")) return 0x9146ff;
  if (source.includes("vimeo")) return 0x1ab7ea;
  if (source.includes("bandcamp")) return 0x1da0c3;
  if (source.includes("deezer")) return 0xff0092;
  if (source.includes("tidal")) return 0x000000;
  return MUSIC_COLOR;
}

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

  const twelveO = getTwelveO(player);
  const loopMode = player.repeatMode;
  const loopText = twelveO
    ? "🔁 12o (continuous)"
    : loopMode === "track"
      ? "🔂 Track"
      : loopMode === "queue"
        ? "🔁 Queue"
        : "➡️ Off";

  const embed = new EmbedBuilder()
    .setColor(getTrackColor(track))
    .setTitle(truncate(info.title, 256))
    .setURL(info.uri ?? null)
    .setDescription(
      `**${truncate(info.author, 100)}**\n\n${bar}\n\nLoop: ${loopText}`
    )
    .setFooter({
      text: `Requested by ${(track.requester as { username?: string })?.username ?? "Unknown"}`,
    })
    .setTimestamp();

  if (info.artworkUrl) {
    embed.setImage(info.artworkUrl);
  }

  return embed;
}

export function musicPanelButtons(
  player: Player
): ActionRowBuilder<ButtonBuilder>[] {
  const paused = player.paused;
  const twelveO = getTwelveO(player);

  const playbackRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_shuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Shuffle"),
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
      .setLabel("Next")
  );

  const extraRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_12o")
      .setEmoji("🔁")
      .setStyle(twelveO ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setLabel("12o"),
    new ButtonBuilder()
      .setCustomId("music_queue")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Queue")
  );

  return [playbackRow, extraRow];
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
            `\`${start + i + 1}.\` [${truncate(t.info.title, 60)}](${t.info.uri}) — ${formatDuration(t.info.duration ?? 0)}`
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
