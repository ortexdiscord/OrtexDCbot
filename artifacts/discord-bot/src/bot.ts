import {
  Client,
  GatewayIntentBits,
  Collection,
} from "discord.js";
import type { Command } from "./commands/index.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Augment client with commands collection
declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

client.commands = new Collection();
