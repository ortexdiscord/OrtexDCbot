import { LavalinkManager } from "lavalink-client";
import type { Track, Player, TrackStartEvent, TrackEndEvent } from "lavalink-client";
import { client } from "./bot.js";
import { config } from "./config.js";
import { db } from "@workspace/db";
import { playHistoryTable } from "@workspace/db";
import { nowPlayingEmbed, musicPanelButtons, successEmbed } from "./utils/embeds.js";
import { updatePresence } from "./keepalive.js";

export const lavalink = new LavalinkManager({
  nodes: [
    {
      authorization: config.lavalink.password,
      host: config.lavalink.host,
      port: config.lavalink.port,
      id: "main",
      secure: config.lavalink.secure,
      retryAmount: 10,
      retryDelay: 3000,
    },
  ],
  sendToShard(guildId, payload) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  autoSkip: true,
  playerOptions: {
    onDisconnect: {
      autoReconnect: true,
      destroyPlayer: false,
    },
    onEmptyQueue: {
      destroyAfterMs: 60_000,
    },
  },
  queueOptions: {
    maxPreviousTracks: 20,
  },
});

// Node-level events (connect/disconnect/error)
lavalink.nodeManager.on("connect", (node) => {
  console.log(`[Lavalink] Node "${node.id}" connected`);
});

lavalink.nodeManager.on("disconnect", (node, reason) => {
  console.warn(`[Lavalink] Node "${node.id}" disconnected:`, reason);
});

lavalink.nodeManager.on("error", (node, error) => {
  console.error(`[Lavalink] Node "${node.id}" error:`, error);
});

// Player / track events
lavalink.on("trackStart", async (player: Player, track: Track | null, _payload: TrackStartEvent) => {
  if (!track) return;
  updatePresence(track.info.title);

  const channelId = player.textChannelId ?? "";
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isTextBased() || !("send" in channel)) return;

  const embed = nowPlayingEmbed(player);
  const buttons = musicPanelButtons(player);

  try {
    const msg = await (channel as { send: Function }).send({ embeds: [embed], components: [buttons] });
    const p = player as unknown as Record<string, unknown>;
    p["panelMessageId"] = msg.id;
    p["panelChannelId"] = channelId;
  } catch {
    // channel not writable
  }

  // Log to play history
  if (player.guildId && track.requester) {
    const requester = track.requester as { id?: string };
    try {
      await db.insert(playHistoryTable).values({
        guildId: player.guildId,
        userId: requester.id ?? "unknown",
        title: track.info.title,
        author: track.info.author,
        uri: track.info.uri ?? "",
        duration: track.info.duration ?? 0,
      });
    } catch {
      // non-critical
    }
  }
});

lavalink.on("trackEnd", (player: Player, _track: Track | null, _payload: TrackEndEvent) => {
  const p = player as unknown as Record<string, unknown>;
  delete p["panelMessageId"];
});

lavalink.on("queueEnd", async (player: Player) => {
  updatePresence(null);

  const channel = client.channels.cache.get(player.textChannelId ?? "");
  if (!channel?.isTextBased() || !("send" in channel)) return;

  try {
    await (channel as { send: Function }).send({
      embeds: [
        successEmbed(
          "Queue finished! Add more songs with `/play`. I'll leave in 60 seconds if nothing is added."
        ),
      ],
    });
  } catch {
    // ignore
  }
});

lavalink.on("playerDisconnect", (_player: Player) => {
  updatePresence(null);
});
