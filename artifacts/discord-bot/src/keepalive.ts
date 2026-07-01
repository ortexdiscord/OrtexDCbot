import { ActivityType, type Client } from "discord.js";

const IDLE_STATUSES = [
  "🎵 /play to add music",
  "🎶 Ready to rock",
  "🎧 Powered by Lavalink",
  "🎼 Type /play to start",
  "🔊 Waiting for your queue",
];

let _client: Client | null = null;
let _presenceInterval: NodeJS.Timeout | null = null;
let _idleIndex = 0;
let _currentTrack: string | null = null;

export function initKeepalive(client: Client): void {
  _client = client;

  // Rotate idle status every 30 seconds
  _presenceInterval = setInterval(() => {
    if (!_client?.isReady()) return;
    if (_currentTrack) {
      _client.user.setPresence({
        activities: [{ name: `🎵 ${_currentTrack}`, type: ActivityType.Listening }],
        status: "online",
      });
    } else {
      const text = IDLE_STATUSES[_idleIndex % IDLE_STATUSES.length]!;
      _client.user.setPresence({
        // Custom status for bots: name must be empty, text goes in state
        activities: [{ name: "", state: text, type: ActivityType.Custom }],
        status: "online",
      });
      _idleIndex++;
    }
  }, 30_000);

  // Heartbeat log every 5 minutes so you can confirm the bot is alive
  setInterval(() => {
    const guilds = _client?.guilds.cache.size ?? 0;
    console.log(`[Heartbeat] Bot is alive — serving ${guilds} guild(s)`);
  }, 5 * 60_000);

  // Handle unexpected exits and attempt graceful reconnect via discord.js auto-reconnect
  process.on("unhandledRejection", (reason) => {
    console.error("[Process] Unhandled rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[Process] Uncaught exception:", error);
    // Let discord.js auto-reconnect handle it; don't exit
  });
}

/**
 * Call when a track starts or ends. Pass null to revert to idle presence.
 */
export function updatePresence(track: string | null): void {
  _currentTrack = track;
  if (!_client?.isReady()) return;

  if (track) {
    _client.user.setPresence({
      activities: [{ name: `🎵 ${track}`, type: ActivityType.Listening }],
      status: "online",
    });
  } else {
    const text = IDLE_STATUSES[_idleIndex % IDLE_STATUSES.length]!;
    _client.user.setPresence({
      activities: [{ name: "", state: text, type: ActivityType.Custom }],
      status: "online",
    });
  }
}
