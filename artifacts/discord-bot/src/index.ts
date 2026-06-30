import { client } from "./bot.js";
import { config } from "./config.js";
import { registerReadyEvent } from "./events/ready.js";
import { registerInteractionCreateEvent } from "./events/interactionCreate.js";
import {
  play,
  skip,
  stop,
  pause,
  resume,
  queue,
  nowplaying,
  volume,
  loop,
  shuffle,
  seek,
  remove,
  playlist,
} from "./commands/index.js";

// Register all commands
const commands = [
  play,
  skip,
  stop,
  pause,
  resume,
  queue,
  nowplaying,
  volume,
  loop,
  shuffle,
  seek,
  remove,
  playlist,
];
for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

// Register events
registerReadyEvent(client);
registerInteractionCreateEvent(client);

// Forward Discord voice state payloads to Lavalink
// Must be done after lavalink is imported (lazy import to avoid circular on init)
client.on("raw", (d) => {
  import("./lavalink.js").then(({ lavalink }) => lavalink.sendRawData(d));
});

// Login
client
  .login(config.token)
  .then(() => console.log("[Bot] Login initiated…"))
  .catch((err) => {
    console.error("[Bot] Login failed:", err);
    process.exit(1);
  });
