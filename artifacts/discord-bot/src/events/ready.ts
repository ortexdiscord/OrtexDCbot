import { ActivityType, type Client } from "discord.js";
import { lavalink } from "../lavalink.js";
import { initKeepalive } from "../keepalive.js";

export function registerReadyEvent(client: Client): void {
  client.once("ready", async (c) => {
    console.log(`[Bot] Logged in as ${c.user.tag}`);

    // Set initial presence. Custom status for bots requires empty name + state.
    c.user.setPresence({
      activities: [{ name: "", state: "🎵 /play to add music", type: ActivityType.Custom }],
      status: "online",
    });

    // Start keepalive (rotating presence + heartbeat logging)
    initKeepalive(client);

    // Initialize Lavalink
    await lavalink.init({ id: c.user.id, username: c.user.username });
    console.log("[Lavalink] Manager initialized");
  });
}
