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
      destroyAfterMs: 3 * 60_000, // 3 minutes of no music before leaving
    },
  },
  queueOptions: {
    maxPreviousTracks: 100,
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

  const p = player as unknown as Record<string, unknown>;

  // Delete the old music panel so only the current one is visible
  const oldPanelMsgId = p["panelMessageId"] as string | undefined;
  const oldPanelChanId = p["panelChannelId"] as string | undefined;
  if (oldPanelMsgId && oldPanelChanId) {
    try {
      const oldCh = client.channels.cache.get(oldPanelChanId);
      if (oldCh?.isTextBased()) {
        const oldMsg = await oldCh.messages.fetch(oldPanelMsgId);
        await oldMsg.delete();
      }
    } catch {
      // old panel may already be deleted
    }
  }

  const embed = nowPlayingEmbed(player);
  const buttons = musicPanelButtons(player);

  try {
    const msg = await (channel as { send: Function }).send({ embeds: [embed], components: buttons });
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

lavalink.on("queueEnd", async (player: Player) => {
  updatePresence(null);

  const p = player as unknown as Record<string, unknown>;
  const twelveO = p["twelveO"] as boolean | undefined;
  const snapshot = (p["twelveOSnapshot"] as Track[] | undefined) ?? [];

  // 12o mode: re-add the stable playlist snapshot and keep playing continuously
  if (twelveO && snapshot.length > 0) {
    await player.queue.add(snapshot);
    await player.play();
    return;
  }

  const channel = client.channels.cache.get(player.textChannelId ?? "");
  if (!channel?.isTextBased() || !("send" in channel)) return;

  try {
    const msg = await (channel as { send: Function }).send({
      embeds: [
        successEmbed(
          "Queue finished! Add more songs with `/play`. I'll leave in 3 minutes if nothing is added."
        ),
      ],
    });
    // Keep the chat clean: delete this status message after 10 seconds
    setTimeout(() => msg.delete().catch(() => null), 10_000);
  } catch {
    // ignore
  }
});

lavalink.on("playerDestroy", async (player: Player, _reason?: string) => {
  const p = player as unknown as Record<string, unknown>;
  const panelMsgId = p["panelMessageId"] as string | undefined;
  const panelChanId = p["panelChannelId"] as string | undefined;

  if (panelMsgId && panelChanId) {
    try {
      const ch = client.channels.cache.get(panelChanId);
      if (ch?.isTextBased()) {
        const msg = await ch.messages.fetch(panelMsgId);
        await msg.delete();
      }
    } catch {
      // panel may already be deleted
    }
    delete p["panelMessageId"];
    delete p["panelChannelId"];
  }

  updatePresence(null);
});

lavalink.on("playerDisconnect", (_player: Player) => {
  updatePresence(null);
});
