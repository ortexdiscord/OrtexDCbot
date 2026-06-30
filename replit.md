# Discord Music Bot

A Discord music bot powered by Lavalink, discord.js v14, and PostgreSQL. Plays music from YouTube/Spotify/SoundCloud in voice channels with rich embeds and interactive button controls.

## Run & Operate

- `pnpm --filter @workspace/discord-bot run dev` — run the Discord bot
- `pnpm --filter @workspace/discord-bot run deploy` — register slash commands (needs `DISCORD_CLIENT_ID`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `DISCORDTOKEN` — Discord bot token (set in Replit Secrets)
- Optional env: `DISCORD_CLIENT_ID` — Bot Application ID (needed for `/deploy` command registration)
- Optional env: `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD`, `LAVALINK_SECURE` — custom Lavalink node (defaults to a public node)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Bot: discord.js v14 + lavalink-client (Lavalink audio)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/discord-bot/src/` — bot source
  - `commands/` — slash commands (play, skip, stop, pause, resume, queue, nowplaying, volume, loop, shuffle, seek, remove, playlist)
  - `events/` — Discord event handlers (ready, interactionCreate)
  - `utils/embeds.ts` — rich embed builders + button rows
  - `utils/formatters.ts` — time formatting, progress bar
  - `lavalink.ts` — LavalinkManager setup + events
  - `keepalive.ts` — rotating presence + heartbeat
  - `config.ts` — env var validation
- `lib/db/src/schema/` — DB schema (guildSettings, playlists, playlistTracks, playHistory)

## Architecture decisions

- Search is on `player.search()` not `lavalink.search()` — the player binds to a node, so search goes through its node
- Node events (connect/disconnect/error) are on `lavalink.nodeManager` not `lavalink` directly
- Channel type narrowing: check `'send' in channel` after `isTextBased()` to exclude PartialGroupDMChannel
- Keepalive rotates presence every 30s; when music plays, presence shows the song title
- Public Lavalink node used by default (lavalink.devamop.in:443) — override via env vars

## Product

- `/play [query]` — search YouTube/Spotify/SoundCloud and play
- `/skip [amount]` — skip 1 or more tracks
- `/stop` — stop music and disconnect
- `/pause` / `/resume` — pause/resume playback
- `/queue [page]` — view upcoming tracks
- `/nowplaying` — show current song with progress bar + interactive buttons
- `/volume [level]` — set volume (persisted per guild)
- `/loop [mode]` — off / track / queue loop modes
- `/shuffle` — shuffle the queue
- `/seek [timestamp]` — seek to mm:ss position
- `/remove [position]` — remove a track from queue
- `/playlist save/load/list/delete` — saved playlists per user

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/discord-bot run deploy` once to register slash commands before the bot can respond to them
- `DISCORD_CLIENT_ID` is the Application ID from Discord Developer Portal, not the bot token
- After changing Lavalink node settings, restart the bot workflow for changes to take effect

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
