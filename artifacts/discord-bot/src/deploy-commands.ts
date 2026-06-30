/**
 * Run this once to register slash commands globally:
 *   pnpm --filter @workspace/discord-bot run deploy
 *
 * Requires DISCORDTOKEN and DISCORD_CLIENT_ID env vars.
 * DISCORD_CLIENT_ID = your bot's Application ID (from Discord Developer Portal).
 */
import { REST, Routes } from "discord.js";
import { config } from "./config.js";
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
].map((cmd) => cmd.data.toJSON());

if (!config.clientId) {
  console.error(
    "Error: DISCORD_CLIENT_ID is not set.\n" +
      "Set it to your bot's Application ID (found in Discord Developer Portal)."
  );
  process.exit(1);
}

const rest = new REST().setToken(config.token);

console.log(`Registering ${commands.length} slash command(s)…`);

rest
  .put(Routes.applicationCommands(config.clientId), { body: commands })
  .then((data) => {
    const d = data as unknown[];
    console.log(`✅  Successfully registered ${d.length} application command(s).`);
    console.log("Commands are now available globally (may take up to 1 hour to propagate).");
  })
  .catch((err) => {
    console.error("❌  Failed to register commands:", err);
    process.exit(1);
  });
