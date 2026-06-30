// Support both casing styles for the bot token
const token =
  process.env.DISCORDTOKEN ??
  process.env.discordtoken ??
  process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error(
    "Missing bot token. Set DISCORDTOKEN in Replit Secrets."
  );
}

export const config = {
  token,
  clientId: process.env.DISCORD_CLIENT_ID ?? "",
  lavalink: {
    host: process.env.LAVALINK_HOST ?? "lavalink.devamop.in",
    port: parseInt(process.env.LAVALINK_PORT ?? "443", 10),
    password: process.env.LAVALINK_PASSWORD ?? "DevamOP",
    secure: process.env.LAVALINK_SECURE !== "false",
  },
};
