import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export { default as play } from "./play.js";
export { default as skip } from "./skip.js";
export { default as stop } from "./stop.js";
export { default as pause } from "./pause.js";
export { default as resume } from "./resume.js";
export { default as queue } from "./queue.js";
export { default as nowplaying } from "./nowplaying.js";
export { default as volume } from "./volume.js";
export { default as loop } from "./loop.js";
export { default as shuffle } from "./shuffle.js";
export { default as seek } from "./seek.js";
export { default as remove } from "./remove.js";
export { default as playlist } from "./playlist.js";
